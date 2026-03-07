from pydantic import BaseModel
from datetime import date

class PredictionResponse(BaseModel):
    next_period: date
    ovulation_day: date
    fertile_start: date
    fertile_end: date