from statistics import mean, stdev
from datetime import timedelta, date
from app.services.global_priors import load_global_priors
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

    WINDOW_SIZE = 6
    MIN_REQUIRED = 4
    PRIOR_STRENGTH = 3  # pseudo-observations for shrinkage

    @staticmethod
    def _build_user_ml_features(db, user_id: int) -> dict:
        """
        Builds the feature dictionary required by the ML model.
        Extracts data from UserSetup and DailyLog.
        """
        from app.models.user_setup import UserSetup
        from app.models.daily_log import DailyLog
        
        setup = db.query(UserSetup).filter(UserSetup.user_id == user_id).first()
        
        # Default fallback features
        features = {
            "Age": 25,
            "BMI": 22.0,
            "Stress Level": 1,  # 0=Low, 1=Medium, 2=High
            "Exercise Frequency": "Moderate",
            "Sleep Hours": 7.0,
            "Diet": "Balanced"
        }
        
        if setup:
            # Calculate Age
            if setup.date_of_birth:
                today = date.today()
                age = today.year - setup.date_of_birth.year - ((today.month, today.day) < (setup.date_of_birth.month, setup.date_of_birth.day))
                features["Age"] = age
                
            # Calculate BMI
            if setup.weight_kg and setup.height_cm:
                height_m = setup.height_cm / 100.0
                bmi = setup.weight_kg / (height_m * height_m)
                features["BMI"] = round(bmi, 2)
                
        # Try to get latest daily logs for stress and sleep (mocking logic since we don't have these exact columns in DailyLog yet)
        # Assuming we might add them later, or we use defaults.
        # For now, we just return the defaults + calculated Age/BMI
        
        return features

    @staticmethod
    def weighted_prediction(values):
        avg = mean(values)
        sd = stdev(values) if len(values) > 1 else 0

        # Remove outliers
        if sd > 0:
            values = [
                v for v in values
                if abs((v - avg) / sd) <= 2
            ]

        if len(values) < 3:
            return None

        weights = list(range(1, len(values) + 1))
        weighted_sum = sum(v * w for v, w in zip(values, weights))
        weighted_avg = round(weighted_sum / sum(weights))
        std_dev = round(stdev(values), 2) if len(values) > 1 else 0

        return weighted_avg, std_dev, len(values)

    @classmethod
    def predict(cls, db, user_id, cycles):
        from app.models.user_setup import UserSetup

        if cycles:
            cycles = cycles[-cls.WINDOW_SIZE:]
            last_start_date = cycles[-1].start_date
            cycle_lengths = [c.cycle_length for c in cycles if c.cycle_length]
            period_lengths = [c.period_length for c in cycles if c.period_length]
        else:
            setup = db.query(UserSetup).filter(UserSetup.user_id == user_id).first()
            last_start_date = (
                setup.last_period_start_date
                if setup and setup.last_period_start_date
                else date.today()
            )
            cycle_lengths = []
            period_lengths = []

        cycle_result = cls.weighted_prediction(cycle_lengths)
        period_result = cls.weighted_prediction(period_lengths)

        priors = load_global_priors()

        # Fallback: if user has insufficient history, use global ML model
        if len(cycles or []) < cls.MIN_REQUIRED or not cycle_result or not period_result:
            if ml_predict_next_cycle:
                # Use our new HistGradientBoosting model!
                user_features = cls._build_user_ml_features(db, user_id)
                ml_pred = ml_predict_next_cycle(user_features)
                
                cycle_avg = ml_pred.get("predicted_cycle_length", 28)
                period_avg = ml_pred.get("predicted_period_length", 5)
                cycle_sd = 4.26  # Global MAE from our new model
                period_sd = 1.10 # Global MAE from our new model
                cycle_n = 1
                confidence = 50.0 # Moderate confidence for ML fallback
            elif priors:
                # Fallback to old global priors if ML model fails to load
                cycle_avg = round(priors.cycle_mean)
                period_avg = round(priors.period_mean)
                cycle_sd = round(priors.cycle_std, 2)
                period_sd = round(priors.period_std, 2)
                cycle_n = min(len(cycle_lengths), cls.WINDOW_SIZE)
                confidence = round(35 + min(20, cycle_n * 5), 2)
            else:
                return None
        else:
            cycle_avg, cycle_sd, cycle_n = cycle_result
            period_avg, period_sd, _ = period_result

            # Shrink user estimates toward global priors (when available)
            if priors:
                k = cls.PRIOR_STRENGTH
                cycle_avg = round((cycle_n * cycle_avg + k * priors.cycle_mean) / (cycle_n + k))
                period_avg = round((cycle_n * period_avg + k * priors.period_mean) / (cycle_n + k))
                cycle_sd = round((cycle_sd + priors.cycle_std) / 2, 2)
                period_sd = round((period_sd + priors.period_std) / 2, 2)

        predicted_start = last_start_date + timedelta(days=cycle_avg)
        predicted_end = predicted_start + timedelta(days=period_avg)

        # Ovulation prediction
        ovulation_offset = cycle_avg - 14
        predicted_ovulation = last_start_date + timedelta(days=ovulation_offset)

        # Fertility window
        spread = min(2, int(cycle_sd))
        fertile_start = predicted_ovulation - timedelta(days=5 + spread)
        fertile_end = predicted_ovulation + timedelta(days=1 + spread)

        if "confidence" not in locals():
            variability = max(0, 1 - (cycle_sd / cycle_avg)) if cycle_avg else 0
            data_score = min(1, cycle_n / cls.WINDOW_SIZE)
            confidence = round((variability * 0.7 + data_score * 0.3) * 100, 2)

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
        }
    
    
