"""
AI Insights Service for Period Tracker
Calculates personalized AI predictions including:
- Symptom probabilities based on user's historical data
- Dynamic luteal phase calculation
- Smart recommendations based on cycle patterns

All configuration values are fetched from SystemSetting in the database.
"""

from typing import Dict, List, Optional
from statistics import mean, stdev
from collections import defaultdict
from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.models.cycle import Cycle
from app.models.daily_log import DailyLog
from app.models.system_setting import SystemSetting


# Default fallback values (used only if DB settings are not available)
DEFAULTS = {
    "ovulation_offset_days": 14,
    "ai_regularity_strict_sd": 2.0,
    "ai_regularity_moderate_sd": 4.0,
    "ai_symptom_base_prob": 30,
}


def get_setting(db: Session, key: str, default_value=None):
    """
    Helper function to get a setting from SystemSetting.
    Returns default_value if setting doesn't exist.
    """
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if setting:
        return setting.value
    return default_value


def get_float_setting(db: Session, key: str, default_value: float = 0.0) -> float:
    """Get a setting and convert to float."""
    value = get_setting(db, key)
    if value is not None:
        try:
            return float(value)
        except (ValueError, TypeError):
            pass
    return default_value


def get_int_setting(db: Session, key: str, default_value: int = 0) -> int:
    """Get a setting and convert to int."""
    value = get_setting(db, key)
    if value is not None:
        try:
            return int(value)
        except (ValueError, TypeError):
            pass
    return default_value


# Base probabilities for new users (global statistics)
# These are now fetched from DB or use ai_symptom_base_prob as base
BASE_SYMPTOM_PROBABILITIES = {
    "Cramps": 65,      # ~65% of menstruating people experience cramps
    "Acne": 40,        # Hormonal acne is common
    "Mood Swing": 50,  # PMS mood changes
    "Bloating": 55,    # Common luteal phase symptom
    "Fatigue": 60,     # Tiredness before period
}

# Map daily log symptoms to our AI prediction categories
SYMPTOM_MAPPING = {
    "cramps": "Cramps",
    "cramping": "Cramps",
    "abdominal_pain": "Cramps",
    "period_pain": "Cramps",
    "acne": "Acne",
    "pimples": "Acne",
    "breakout": "Acne",
    "skin_breakout": "Acne",
    "mood_swing": "Mood Swing",
    "moody": "Mood Swing",
    "irritable": "Mood Swing",
    "anxiety": "Mood Swing",
    "depressed": "Mood Swing",
    "sad": "Mood Swing",
    "emotional": "Mood Swing",
    "bloating": "Bloating",
    "bloated": "Bloating",
    "water_retention": "Bloating",
    "stomach_bloating": "Bloating",
    "fatigue": "Fatigue",
    "tired": "Fatigue",
    "exhausted": "Fatigue",
    "low_energy": "Fatigue",
    "sleepy": "Fatigue",
    "lethargic": "Fatigue",
}


class SymptomProbabilityEngine:
    """Calculates symptom probabilities based on user's historical data"""
    
    MIN_CYCLES_FOR_PERSONALIZED = 2
    LOOKBACK_CYCLES = 6  # Look at last 6 cycles
    
    @classmethod
    def calculate_probabilities(
        cls,
        db: Session,
        user_id: int,
        cycles: List[Cycle]
    ) -> Dict[str, dict]:
        """
        Calculate symptom probabilities for the next cycle.
        Uses ai_symptom_base_prob from DB as fallback base probability.
        """
        # Get base probability from settings (default 30%)
        base_prob = get_int_setting(db, "ai_symptom_base_prob", DEFAULTS["ai_symptom_base_prob"])
        
        # Build base probabilities using the configured base
        # Scale the original proportions relative to the base
        base_probs = {
            "Cramps": min(95, int(base_prob * 2.17)),      # ~65% if base=30
            "Acne": min(95, int(base_prob * 1.33)),        # ~40% if base=30
            "Mood Swing": min(95, int(base_prob * 1.67)),  # ~50% if base=30
            "Bloating": min(95, int(base_prob * 1.83)),    # ~55% if base=30
            "Fatigue": min(95, int(base_prob * 2.0)),      # ~60% if base=30
        }
        
        if len(cycles) < cls.MIN_CYCLES_FOR_PERSONALIZED:
            # Not enough data, return base probabilities from DB config
            return {
                symptom: {
                    "probability": prob,
                    "based_on_cycles": 0,
                    "is_personalized": False
                }
                for symptom, prob in base_probs.items()
            }
        
        # Get recent cycles (last LOOKBACK_CYCLES)
        recent_cycles = cycles[-cls.LOOKBACK_CYCLES:]
        
        # Get all daily logs for these cycles
        symptom_counts = defaultdict(int)
        total_cycles_with_data = 0
        
        for cycle in recent_cycles:
            # Get logs within this cycle period
            start_date = cycle.start_date
            end_date = cycle.end_date or (start_date + timedelta(days=7))
            
            logs = db.query(DailyLog).filter(
                DailyLog.user_id == user_id,
                DailyLog.log_date >= start_date,
                DailyLog.log_date <= end_date
            ).all()
            
            if logs:
                total_cycles_with_data += 1
                cycle_symptoms = set()
                
                for log in logs:
                    # Check physical symptoms
                    for symptom in (log.physical_symptoms or []):
                        mapped = cls._map_symptom(symptom.lower())
                        if mapped:
                            cycle_symptoms.add(mapped)
                    
                    # Check moods for mood-related symptoms
                    for mood in (log.moods or []):
                        if cls._is_mood_symptom(mood.lower()):
                            cycle_symptoms.add("Mood Swing")
                
                # Count each symptom occurrence
                for symptom in cycle_symptoms:
                    symptom_counts[symptom] += 1
        
        # Calculate probabilities
        probabilities = {}
        for symptom in base_probs.keys():
            if total_cycles_with_data > 0:
                # Calculate frequency from user's data
                count = symptom_counts.get(symptom, 0)
                user_probability = round((count / total_cycles_with_data) * 100)
                
                # Blend with base probability from DB (weighted average)
                # More weight to user data as they have more cycles
                weight = min(0.8, total_cycles_with_data / 6)  # Max 80% weight to user data
                blended_prob = round(user_probability * weight + 
                                   base_probs[symptom] * (1 - weight))
                
                probabilities[symptom] = {
                    "probability": min(95, max(5, blended_prob)),  # Cap between 5-95%
                    "based_on_cycles": total_cycles_with_data,
                    "is_personalized": True,
                    "user_occurrence_rate": user_probability
                }
            else:
                # No daily log data yet, use base from DB
                probabilities[symptom] = {
                    "probability": base_probs[symptom],
                    "based_on_cycles": 0,
                    "is_personalized": False
                }
        
        return probabilities
    
    @staticmethod
    def _map_symptom(symptom: str) -> Optional[str]:
        """Map a logged symptom to our AI prediction categories"""
        symptom_lower = symptom.lower()
        
        # Direct mapping
        if symptom_lower in SYMPTOM_MAPPING:
            return SYMPTOM_MAPPING[symptom_lower]
        
        # Partial matching
        for key, mapped in SYMPTOM_MAPPING.items():
            if key in symptom_lower or symptom_lower in key:
                return mapped
        
        return None
    
    @staticmethod
    def _is_mood_symptom(mood: str) -> bool:
        """Check if a mood entry indicates a mood swing symptom"""
        mood_indicators = [
            "irritable", "anxious", "depressed", "sad", "emotional",
            "moody", "angry", "stressed", "overwhelmed", "cry",
            "crying", "mood_swing", "swing"
        ]
        return any(ind in mood for ind in mood_indicators)


class DynamicLutealPhaseCalculator:
    """Calculates personalized luteal phase based on user data and DB settings"""
    
    @classmethod
    def calculate(
        cls,
        db: Session,
        cycles: List[Cycle],
        cycle_std_dev: float,
        avg_cycle_length: float
    ) -> dict:
        """
        Calculate learned luteal phase based on:
        - User's cycle regularity (from DB settings)
        - Deviation from standard 28-day cycle
        
        Uses ovulation_offset_days from DB as base, ai_regularity_strict_sd 
        and ai_regularity_moderate_sd for classification.
        """
        # Get settings from DB
        base_luteal_phase = get_int_setting(db, "ovulation_offset_days", DEFAULTS["ovulation_offset_days"])
        strict_sd = get_float_setting(db, "ai_regularity_strict_sd", DEFAULTS["ai_regularity_strict_sd"])
        moderate_sd = get_float_setting(db, "ai_regularity_moderate_sd", DEFAULTS["ai_regularity_moderate_sd"])
        
        # Standard luteal phase is typically 14 days (from DB)
        # Adjust based on user's cycle length deviation from 28 days
        
        cycle_deviation = avg_cycle_length - 28  # e.g., +2 if 30-day cycles
        
        # If cycles are regular (low SD), adjust luteal phase slightly
        # If cycles are irregular, keep closer to standard value from DB
        
        if cycle_std_dev <= strict_sd:
            # Regular cycles - adjust luteal phase based on cycle length
            # Longer cycles usually = longer follicular phase, luteal stays ~base
            # But we'll adjust slightly based on data
            adjustment = round(cycle_deviation * 0.3)  # 30% of deviation
            learned_phase = base_luteal_phase + adjustment
            method = "learned_from_regular_cycles"
        elif cycle_std_dev <= moderate_sd:
            # Moderate variation - conservative adjustment
            adjustment = round(cycle_deviation * 0.15)
            learned_phase = base_luteal_phase + adjustment
            method = "learned_from_moderate_variation"
        else:
            # High variation - stick close to standard from DB
            learned_phase = base_luteal_phase
            method = "standard_fallback_high_variation"
        
        # Clamp to biological reality (10-18 days is typical)
        learned_phase = max(10, min(18, learned_phase))
        
        return {
            "learned_luteal_phase": learned_phase,
            "ovulation_offset": learned_phase,  # Days before period
            "calculation_method": method,
            "cycle_deviation_from_standard": round(cycle_deviation, 1),
            "settings_used": {
                "ovulation_offset_days": base_luteal_phase,
                "strict_sd_threshold": strict_sd,
                "moderate_sd_threshold": moderate_sd
            }
        }


class SmartRecommendationEngine:
    """Generates AI recommendations based on cycle patterns and DB settings"""
    
    @classmethod
    def generate_recommendation(
        cls,
        db: Session,
        cycle_std_dev: float,
        confidence_score: float,
        cycle_count: int,
        symptom_probabilities: Dict
    ) -> dict:
        """
        Generate personalized recommendation based on:
        - Cycle regularity (SD) with thresholds from DB
        - Data confidence
        - Number of logged cycles
        """
        # Get thresholds from DB
        strict_sd = get_float_setting(db, "ai_regularity_strict_sd", DEFAULTS["ai_regularity_strict_sd"])
        moderate_sd = get_float_setting(db, "ai_regularity_moderate_sd", DEFAULTS["ai_regularity_moderate_sd"])
        
        # Rule 1: New user / Insufficient data
        if cycle_count < 2 or confidence_score < 40:
            return {
                "type": "info",
                "message": "Keep logging your cycles. AI learns more with each entry to give better predictions.",
                "action": "Log next cycle",
                "priority": "medium"
            }
        
        # Rule 2: High variability cycles (using DB threshold)
        if cycle_std_dev > moderate_sd:
            high_prob_symptoms = [
                s for s, data in symptom_probabilities.items()
                if data.get("probability", 0) > 70
            ]
            
            if high_prob_symptoms:
                return {
                    "type": "warning",
                    "message": f"AI detected cycle variability. You often experience {', '.join(high_prob_symptoms[:2])}. Tracking more consistently may help identify triggers.",
                    "action": "Log daily symptoms",
                    "priority": "high"
                }
            else:
                return {
                    "type": "warning",
                    "message": "AI detected cycle variability. Tracking more consistently may help improve predictions.",
                    "action": "Log daily symptoms",
                    "priority": "high"
                }
        
        # Rule 3: Very regular cycles (using DB threshold)
        if cycle_std_dev <= strict_sd and confidence_score > 75:
            return {
                "type": "positive",
                "message": "Your cycle is very regular! Great data logging. AI predictions are highly accurate for you.",
                "action": None,
                "priority": "low"
            }
        
        # Rule 4: Moderate regularity with high symptom probability
        if cycle_std_dev <= moderate_sd:
            high_prob_symptoms = [
                s for s, data in symptom_probabilities.items()
                if data.get("probability", 0) > 65
            ]
            
            if high_prob_symptoms:
                return {
                    "type": "info",
                    "message": f"Your cycle pattern shows you typically experience {', '.join(high_prob_symptoms[:2])}. Plan ahead for self-care during these times.",
                    "action": "View self-care tips",
                    "priority": "medium"
                }
        
        # Default recommendation
        return {
            "type": "info",
            "message": "Continue logging your cycles and symptoms for more personalized AI insights.",
            "action": "Log symptoms",
            "priority": "low"
        }


class AIInsightsService:
    """Main service class that aggregates all AI insights"""
    
    @classmethod
    def generate_insights(
        cls,
        db: Session,
        user_id: int,
        cycles: List[Cycle],
        cycle_std_dev: float = None,
        avg_cycle_length: float = None,
        confidence_score: float = None
    ) -> dict:
        """
        Generate comprehensive AI insights for the user.
        All configuration values are fetched from SystemSetting.
        
        Returns:
            {
                "symptom_probabilities": {...},
                "luteal_phase": {...},
                "recommendation": {...},
                "cycle_regularity": {...}
            }
        """
        # Calculate symptom probabilities (with DB settings)
        symptom_probs = SymptomProbabilityEngine.calculate_probabilities(
            db, user_id, cycles
        )
        
        # Calculate luteal phase if we have cycle data (with DB settings)
        luteal_data = None
        if avg_cycle_length and cycle_std_dev is not None:
            luteal_data = DynamicLutealPhaseCalculator.calculate(
                db, cycles, cycle_std_dev, avg_cycle_length
            )
        
        # Calculate cycle regularity metrics (with DB thresholds)
        regularity = None
        if cycle_std_dev is not None:
            strict_sd = get_float_setting(db, "ai_regularity_strict_sd", DEFAULTS["ai_regularity_strict_sd"])
            moderate_sd = get_float_setting(db, "ai_regularity_moderate_sd", DEFAULTS["ai_regularity_moderate_sd"])
            
            # Determine regularity level based on DB thresholds
            if cycle_std_dev <= strict_sd:
                level = "very_regular"
            elif cycle_std_dev <= moderate_sd:
                level = "moderate_variation"
            else:
                level = "high_variation"
            
            regularity = {
                "std_dev": round(cycle_std_dev, 2),
                "regularity_level": level,
                "cycles_logged": len(cycles),
                "thresholds_used": {
                    "strict_sd": strict_sd,
                    "moderate_sd": moderate_sd
                }
            }
        
        # Generate recommendation (with DB settings)
        recommendation = SmartRecommendationEngine.generate_recommendation(
            db, cycle_std_dev or 5.0, confidence_score or 50.0, len(cycles), symptom_probs
        )
        
        return {
            "symptom_probabilities": symptom_probs,
            "luteal_phase": luteal_data,
            "recommendation": recommendation,
            "cycle_regularity": regularity
        }
    
    @staticmethod
    def _classify_regularity(std_dev: float) -> str:
        """Classify cycle regularity based on standard deviation"""
        if std_dev <= 2:
            return "very_regular"
        elif std_dev <= 4:
            return "moderate_variation"
        else:
            return "high_variation"
