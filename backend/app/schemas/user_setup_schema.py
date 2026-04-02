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
    date_of_birth: Optional[date] = None
    height_cm: Optional[int] = None
    weight_kg: Optional[int] = None
    
    # Pregnancy Tracking Data
    pregnancy_due_date: Optional[date] = None
    pregnancy_weeks_override: Optional[int] = Field(default=None, ge=1, le=42)
    
    # Inclusivity & Health Conditions
    pronouns: Optional[str] = Field(default=None, max_length=50)  # e.g., "They/Them"
    has_pcos_or_irregular: bool = False

    # Prediction Mode Settings
    prediction_mode: str = Field(default="auto", pattern="^(auto|regular|fixed)$")
    manual_cycle_length: Optional[int] = Field(default=None, ge=21, le=45)


class UserGoalUpdate(BaseModel):
    app_goal: AppGoal
    pregnancy_due_date: Optional[date] = None
    pregnancy_weeks_override: Optional[int] = Field(default=None, ge=1, le=42)


class UserSetupResponse(BaseModel):
    id: int
    user_id: int

    last_period_start_date: Optional[date] = None
    avg_period_length_days: Optional[int] = None
    avg_cycle_length_days: Optional[int] = None
    contraception_method: ContraceptionMethod
    app_goal: AppGoal
    date_of_birth: Optional[date] = None
    height_cm: Optional[int] = None
    weight_kg: Optional[int] = None
    
    # Pregnancy Tracking Data
    pregnancy_due_date: Optional[date] = None
    pregnancy_weeks_override: Optional[int] = None
    
    # Inclusivity & Health Conditions
    pronouns: Optional[str] = None
    has_pcos_or_irregular: bool = False

    # Prediction Mode Settings
    prediction_mode: str = "auto"
    manual_cycle_length: Optional[int] = None

    class Config:
        from_attributes = True

