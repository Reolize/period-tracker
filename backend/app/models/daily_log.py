from __future__ import annotations

from enum import Enum

from sqlalchemy import (
    Column,
    Date,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Integer,
    Numeric,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class BleedingFlow(str, Enum):
    none = "none"
    spotting = "spotting"
    light = "light"
    medium = "medium"
    heavy = "heavy"


class DischargeType(str, Enum):
    none = "none"
    dry = "dry"
    sticky = "sticky"
    creamy = "creamy"
    watery = "watery"
    eggwhite = "eggwhite"
    unusual = "unusual"


class DailyLog(Base):
    __tablename__ = "daily_logs"
    __table_args__ = (
        UniqueConstraint("user_id", "log_date", name="uq_daily_logs_user_date"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    log_date = Column(Date, nullable=False, index=True)

    bleeding_flow = Column(
        SAEnum(BleedingFlow, name="bleeding_flow", native_enum=False),
        nullable=False,
        default=BleedingFlow.none,
        server_default=BleedingFlow.none.value,
    )
    discharge_type = Column(
        SAEnum(DischargeType, name="discharge_type", native_enum=False),
        nullable=False,
        default=DischargeType.none,
        server_default=DischargeType.none.value,
    )

    # Arrays of codes (strings) for flexible taxonomy like Flo.
    physical_symptoms = Column(JSONB, nullable=False, server_default="[]")  # list[str]
    moods = Column(JSONB, nullable=False, server_default="[]")  # list[str]

    # Example shape:
    # { "had_sex": true, "protection": "condom", "orgasm": false, "pain": false }
    sex = Column(JSONB, nullable=False, server_default="{}")  # dict

    # Basal Body Temperature in °C, precision 2 decimals (e.g. 36.55)
    bbt_celsius = Column(Numeric(4, 2), nullable=True)

    # Pregnancy Tracking Data
    weight_kg = Column(Numeric(5, 2), nullable=True)
    pregnancy_week = Column(Integer, nullable=True)

    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User")

