from datetime import date
from pydantic import BaseModel
from typing import Dict, Optional


class HealthAlert(BaseModel):
    code: str
    level: str
    message: str


class SymptomProbability(BaseModel):
    probability: int
    based_on_cycles: int
    is_personalized: bool
    user_occurrence_rate: Optional[int] = None


class LutealPhaseData(BaseModel):
    learned_luteal_phase: int
    ovulation_offset: int
    calculation_method: str
    cycle_deviation_from_standard: float


class AIRecommendation(BaseModel):
    type: str  # "positive", "warning", "info"
    message: str
    action: Optional[str] = None
    priority: str  # "low", "medium", "high"


class CycleRegularity(BaseModel):
    std_dev: float
    regularity_level: str  # "very_regular", "moderate_variation", "high_variation"
    cycles_logged: int


class AIInsightsResponse(BaseModel):
    symptom_probabilities: Dict[str, SymptomProbability]
    luteal_phase: Optional[LutealPhaseData] = None
    recommendation: AIRecommendation
    cycle_regularity: Optional[CycleRegularity] = None


class PredictionResponse(BaseModel):
    predicted_next_start: date
    predicted_next_end: date
    cycle_length_prediction: int
    period_length_prediction: int
    cycle_std_dev: float
    period_std_dev: float
    confidence_score: float | None
    predicted_ovulation: date
    fertile_window_start: date
    fertile_window_end: date
    health_alerts: list[HealthAlert] | None = None
    prediction_mode: str | None = None
    mode_label: str | None = None

class CycleCreate(BaseModel):
    start_date: date
    end_date: date


class CycleResponse(BaseModel):
    id: int
    start_date: date
    end_date: date
    cycle_length: int | None
    period_length: int | None

    class Config:
        from_attributes = True