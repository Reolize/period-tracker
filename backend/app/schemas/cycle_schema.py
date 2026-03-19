from datetime import date
from pydantic import BaseModel


class HealthAlert(BaseModel):
    code: str
    level: str
    message: str


class PredictionResponse(BaseModel):
    predicted_next_start: date
    predicted_next_end: date
    cycle_length_prediction: int
    period_length_prediction: int
    cycle_std_dev: float
    period_std_dev: float
    confidence_score: float
    predicted_ovulation: date
    fertile_window_start: date
    fertile_window_end: date
    health_alerts: list[HealthAlert] | None = None

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