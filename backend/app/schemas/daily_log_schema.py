from __future__ import annotations

from datetime import date
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from app.models.daily_log import BleedingFlow, DischargeType


class DailyLogUpsert(BaseModel):
    log_date: date

    bleeding_flow: BleedingFlow = BleedingFlow.none
    discharge_type: DischargeType = DischargeType.none

    physical_symptoms: List[str] = Field(default_factory=list)
    moods: List[str] = Field(default_factory=list)
    sex: Dict[str, Any] = Field(default_factory=dict)

    bbt_celsius: Optional[float] = Field(default=None, ge=30.0, le=45.0)
    notes: Optional[str] = None


class DailyLogResponse(DailyLogUpsert):
    id: int
    user_id: int

    class Config:
        from_attributes = True

