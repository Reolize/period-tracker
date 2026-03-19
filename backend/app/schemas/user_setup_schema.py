from __future__ import annotations

from datetime import date
from typing import Optional

from pydantic import BaseModel, Field

from app.models.user_setup import AppGoal, ContraceptionMethod


class UserSetupUpsert(BaseModel):
    last_period_start_date: Optional[date] = None

    avg_period_length_days: Optional[int] = Field(default=None, ge=1, le=21)
    avg_cycle_length_days: Optional[int] = Field(default=None, ge=10, le=120)

    contraception_method: ContraceptionMethod = ContraceptionMethod.none
    app_goal: AppGoal = AppGoal.track_cycle


class UserSetupResponse(BaseModel):
    id: int
    user_id: int

    last_period_start_date: Optional[date] = None
    avg_period_length_days: Optional[int] = None
    avg_cycle_length_days: Optional[int] = None
    contraception_method: ContraceptionMethod
    app_goal: AppGoal

    class Config:
        from_attributes = True

