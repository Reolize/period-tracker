from statistics import mean, stdev
from datetime import timedelta, date
from app.services.global_priors import load_global_priors
from typing import Optional, List, Dict, Any
import sys
import os

# Add ML directory to path to import predict module
ml_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml"))
if ml_path not in sys.path:
    sys.path.append(ml_path)

try:
    from base_model.predict import predict_next_cycle as ml_predict_next_cycle
except ImportError:
    ml_predict_next_cycle = None


class PredictionEngine:
    """
    Hybrid Prediction Engine supporting 3 user-selectable modes:
    
    1. "smart" (Smart AI Hybrid): Automated 3-tier fallback logic
       - 0-3 cycles: Global ML Model (HistGradientBoosting)
       - 4-5 cycles: Bayesian Shrinkage (user data + global priors)
       - 6+ cycles: Weighted Moving Average
    
    2. "strict" (Regular Calendar): Pure Weighted Moving Average
       - Always uses weighted prediction with outlier filtering (>2 SD)
       - Ignores global ML model and Bayesian shrinkage
    
    3. "fixed" (Fixed Number): Manual user-defined cycle length
       - Returns user_setup.manual_cycle_length directly
       - No calculations performed
    """

    WINDOW_SIZE = 6
    MIN_REQUIRED = 4
    PRIOR_STRENGTH = 3  # pseudo-observations for shrinkage

    @classmethod
    def predict(
        cls,
        db,
        user_id: int,
        cycles: List,
        prediction_mode: str = "smart",
        manual_cycle_length: Optional[int] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Main prediction entry point.
        
        Args:
            db: Database session
            user_id: User ID
            cycles: List of user's Cycle objects
            prediction_mode: "smart", "strict", or "fixed"
            manual_cycle_length: Required when mode is "fixed"
            
        Returns:
            Dictionary with prediction results or None if insufficient data
        """
        from app.models.user_setup import UserSetup

        print(f"[ENGINE] Calculating... Mode received: {prediction_mode}. Forcing branch for {prediction_mode}")

        # NUCLEAR ISOLATION: If mode is smart or strict, FORCE manual_cycle_length to None
        # This makes it mathematically impossible to accidentally use the manual number
        if prediction_mode in ("smart", "strict"):
            print(f"[ENGINE] NUCLEAR ISOLATION: Forcing manual_cycle_length from {manual_cycle_length} to None for {prediction_mode} mode")
            manual_cycle_length = None

        # Normalize cycles
        if not cycles:
            cycles = []

        # Get user's setup for fallback data
        setup = db.query(UserSetup).filter(UserSetup.user_id == user_id).first()

        # Extract completed cycles and their data
        completed_cycles = [c for c in cycles if c.end_date is not None]
        
        # Determine last start date for predictions
        if completed_cycles:
            last_start_date = completed_cycles[-1].start_date
        elif setup and setup.last_period_start_date:
            last_start_date = setup.last_period_start_date
        else:
            last_start_date = date.today()

        # Get cycle and period lengths
        cycle_lengths = [c.cycle_length for c in completed_cycles[-cls.WINDOW_SIZE:] if c.cycle_length]
        period_lengths = [c.period_length for c in completed_cycles[-cls.WINDOW_SIZE:] if c.period_length]

        result = None

        # Route to appropriate prediction method based on mode
        if prediction_mode == "fixed":
            if manual_cycle_length is None:
                print("[ENGINE] Fixed mode requested but no manual_cycle_length, falling back to smart")
                result = cls._predict_smart(db, user_id, cycle_lengths, period_lengths, completed_cycles, last_start_date)
            else:
                result = cls._predict_fixed(manual_cycle_length, period_lengths, last_start_date)
        
        elif prediction_mode == "strict":
            result = cls._predict_strict(cycle_lengths, period_lengths, last_start_date)
        
        else:  # default to "smart"
            result = cls._predict_smart(db, user_id, cycle_lengths, period_lengths, completed_cycles, last_start_date)
        
        # Log final result
        if result:
            final_length = result.get('cycle_length_prediction') or result.get('average_cycle_length')
            print(f"[ENGINE] Final calculated length returning to UI: {final_length}")
        else:
            print("[ENGINE] No result returned (insufficient data)")
        
        return result

    @classmethod
    def _predict_fixed(
        cls,
        manual_cycle_length: int,
        period_lengths: List[int],
        last_start_date: date
    ) -> Dict[str, Any]:
        """
        Fixed Number mode: Use user-defined cycle length directly.
        """
        # For period length, use weighted average if available, else default to 5
        period_result = cls._weighted_prediction(period_lengths)
        if period_result:
            period_avg, period_sd, _ = period_result
        else:
            period_avg = 5
            period_sd = 1.0

        cycle_avg = manual_cycle_length
        cycle_sd = 0  # Fixed mode has no variability
        confidence = 95.0  # High confidence since user explicitly set this

        return cls._build_prediction_result(
            cycle_avg=cycle_avg,
            period_avg=period_avg,
            cycle_sd=cycle_sd,
            period_sd=period_sd,
            last_start_date=last_start_date,
            confidence=confidence,
            mode="fixed",
            mode_label="Fixed Number (User-defined)"
        )

    @classmethod
    def _predict_strict(
        cls,
        cycle_lengths: List[int],
        period_lengths: List[int],
        last_start_date: date
    ) -> Optional[Dict[str, Any]]:
        """
        Regular Calendar mode: Pure Weighted Moving Average with outlier filtering.
        """
        # This mode REQUIRES sufficient data
        if len(cycle_lengths) < 3:
            return None  # Not enough data for strict mode

        cycle_result = cls._weighted_prediction(cycle_lengths)
        period_result = cls._weighted_prediction(period_lengths)

        if not cycle_result:
            return None

        cycle_avg, cycle_sd, cycle_n = cycle_result
        
        if period_result:
            period_avg, period_sd, _ = period_result
        else:
            period_avg = 5
            period_sd = 1.0

        # Calculate confidence based on data quality
        variability = max(0, 1 - (cycle_sd / cycle_avg)) if cycle_avg else 0
        data_score = min(1, cycle_n / cls.WINDOW_SIZE)
        confidence = round((variability * 0.7 + data_score * 0.3) * 100, 2)

        return cls._build_prediction_result(
            cycle_avg=cycle_avg,
            period_avg=period_avg,
            cycle_sd=cycle_sd,
            period_sd=period_sd,
            last_start_date=last_start_date,
            confidence=confidence,
            mode="strict",
            mode_label="Regular Calendar (Weighted Average)"
        )

    @classmethod
    def _predict_smart(
        cls,
        db,
        user_id: int,
        cycle_lengths: List[int],
        period_lengths: List[int],
        completed_cycles: List,
        last_start_date: date
    ) -> Optional[Dict[str, Any]]:
        """
        Smart AI Hybrid mode: Automated 3-tier logic based on cycle count.
        
        Tier 1 (0-3 cycles): Global ML Model
        Tier 2 (4-5 cycles): Bayesian Shrinkage
        Tier 3 (6+ cycles): Weighted Moving Average
        """
        completed_count = len(completed_cycles)
        
        # Check if we have enough data for weighted prediction
        cycle_result = cls._weighted_prediction(cycle_lengths) if len(cycle_lengths) >= 3 else None
        period_result = cls._weighted_prediction(period_lengths) if len(period_lengths) >= 3 else None
        
        priors = load_global_priors()

        # TIER 1: Global ML Model (0-3 cycles)
        if completed_count < cls.MIN_REQUIRED or not cycle_result or not period_result:
            if ml_predict_next_cycle:
                user_features = cls._build_user_ml_features(db, user_id)
                ml_pred = ml_predict_next_cycle(user_features)
                
                cycle_avg = ml_pred.get("predicted_cycle_length", 28)
                period_avg = ml_pred.get("predicted_period_length", 5)
                cycle_sd = 4.26  # Global MAE
                period_sd = 1.10
                confidence = 50.0
                mode_label = "Smart AI (Global ML Model)"
                
            elif priors:
                # Fallback to global priors
                cycle_avg = round(priors.cycle_mean)
                period_avg = round(priors.period_mean)
                cycle_sd = round(priors.cycle_std, 2)
                period_sd = round(priors.period_std, 2)
                confidence = 35.0
                mode_label = "Smart AI (Global Statistics)"
            else:
                return None
        
        # TIER 2: Bayesian Shrinkage (4-5 cycles)
        elif completed_count < cls.WINDOW_SIZE:
            cycle_avg_raw, cycle_sd_raw, cycle_n = cycle_result
            period_avg_raw, period_sd_raw, _ = period_result if period_result else (5, 1.0, 1)
            
            if priors:
                # Bayesian shrinkage: blend user data with global priors
                k = cls.PRIOR_STRENGTH
                cycle_avg = round((cycle_n * cycle_avg_raw + k * priors.cycle_mean) / (cycle_n + k))
                period_avg = round((cycle_n * period_avg_raw + k * priors.period_mean) / (cycle_n + k))
                cycle_sd = round((cycle_sd_raw + priors.cycle_std) / 2, 2)
                period_sd = round((period_sd_raw + priors.period_std) / 2, 2)
                mode_label = "Smart AI (Bayesian Hybrid)"
            else:
                cycle_avg = cycle_avg_raw
                period_avg = period_avg_raw
                cycle_sd = cycle_sd_raw
                period_sd = period_sd_raw
                mode_label = "Smart AI (Personalized)"
            
            confidence = 65.0
        
        # TIER 3: Weighted Moving Average (6+ cycles)
        else:
            cycle_avg, cycle_sd, cycle_n = cycle_result
            period_avg, period_sd, _ = period_result if period_result else (5, 1.0, 1)
            
            # Apply light Bayesian smoothing only if priors available
            if priors:
                k = 1  # Lower strength since we have rich data
                cycle_avg = round((cycle_n * cycle_avg + k * priors.cycle_mean) / (cycle_n + k))
            
            variability = max(0, 1 - (cycle_sd / cycle_avg)) if cycle_avg else 0
            data_score = min(1, cycle_n / cls.WINDOW_SIZE)
            confidence = round((variability * 0.7 + data_score * 0.3) * 100, 2)
            mode_label = "Smart AI (Weighted Personal History)"

        return cls._build_prediction_result(
            cycle_avg=cycle_avg,
            period_avg=period_avg,
            cycle_sd=cycle_sd,
            period_sd=period_sd,
            last_start_date=last_start_date,
            confidence=confidence,
            mode="smart",
            mode_label=mode_label
        )

    @staticmethod
    def _weighted_prediction(values: List[int]) -> Optional[tuple]:
        """
        Calculate weighted prediction with outlier removal (>2 SD).
        Returns (weighted_avg, std_dev, n) or None if insufficient data.
        """
        if not values or len(values) < 3:
            return None

        avg = mean(values)
        sd = stdev(values) if len(values) > 1 else 0

        # Remove outliers (>2 SD from mean)
        if sd > 0:
            filtered_values = [v for v in values if abs((v - avg) / sd) <= 2]
            # Ensure we still have data after filtering
            if len(filtered_values) >= 3:
                values = filtered_values
                avg = mean(values)
                sd = stdev(values) if len(values) > 1 else 0

        if len(values) < 3:
            return None

        # Weighted average (recent cycles have higher weight)
        weights = list(range(1, len(values) + 1))
        weighted_sum = sum(v * w for v, w in zip(values, weights))
        weighted_avg = round(weighted_sum / sum(weights))
        std_dev = round(stdev(values), 2) if len(values) > 1 else 0

        return weighted_avg, std_dev, len(values)

    @staticmethod
    def _build_user_ml_features(db, user_id: int) -> Dict[str, Any]:
        """Build feature dictionary for ML model."""
        from app.models.user_setup import UserSetup

        setup = db.query(UserSetup).filter(UserSetup.user_id == user_id).first()

        features = {
            "Age": 25,
            "BMI": 22.0,
            "Stress Level": 1,
            "Exercise Frequency": "Moderate",
            "Sleep Hours": 7.0,
            "Diet": "Balanced"
        }

        if setup:
            if setup.date_of_birth:
                today = date.today()
                age = today.year - setup.date_of_birth.year
                age -= ((today.month, today.day) < (setup.date_of_birth.month, setup.date_of_birth.day))
                features["Age"] = age

            if setup.weight_kg and setup.height_cm:
                height_m = setup.height_cm / 100.0
                bmi = setup.weight_kg / (height_m * height_m)
                features["BMI"] = round(bmi, 2)

        return features

    @staticmethod
    def _build_prediction_result(
        cycle_avg: int,
        period_avg: int,
        cycle_sd: float,
        period_sd: float,
        last_start_date: date,
        confidence: float,
        mode: str,
        mode_label: str
    ) -> Dict[str, Any]:
        """Build standardized prediction result dictionary."""
        
        predicted_start = last_start_date + timedelta(days=cycle_avg)
        predicted_end = predicted_start + timedelta(days=period_avg)

        # Ovulation prediction (typically 14 days before next period)
        ovulation_offset = max(10, min(18, cycle_avg - 14))
        predicted_ovulation = last_start_date + timedelta(days=cycle_avg - ovulation_offset)

        # Fertility window
        spread = min(2, int(cycle_sd))
        fertile_start = predicted_ovulation - timedelta(days=5 + spread)
        fertile_end = predicted_ovulation + timedelta(days=1 + spread)

        return {
            "predicted_next_start": predicted_start,
            "predicted_next_end": predicted_end,
            "cycle_length_prediction": cycle_avg,
            "period_length_prediction": period_avg,
            "cycle_std_dev": cycle_sd,
            "period_std_dev": period_sd,
            "confidence_score": confidence,
            "predicted_ovulation": predicted_ovulation,
            "fertile_window_start": fertile_start,
            "fertile_window_end": fertile_end,
            "prediction_mode": mode,
            "mode_label": mode_label
        }
