from __future__ import annotations

from enum import Enum

from sqlalchemy import Column, Date, DateTime, Enum as SAEnum, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class ContraceptionMethod(str, Enum):
    none = "none"
    condom = "condom"
    pill_combined = "pill_combined"
    pill_progestin_only = "pill_progestin_only"
    iud_hormonal = "iud_hormonal"
    iud_copper = "iud_copper"
    implant = "implant"
    injection = "injection"
    patch = "patch"
    ring = "ring"
    withdrawal = "withdrawal"
    fertility_awareness = "fertility_awareness"
    sterilization = "sterilization"
    other = "other"


class AppGoal(str, Enum):
    track_cycle = "track_cycle"
    predict_period = "predict_period"
    manage_symptoms = "manage_symptoms"
    conceive = "conceive"
    avoid_pregnancy = "avoid_pregnancy"
    general_health = "general_health"


class UserSetup(Base):
    """
    One row per user (latest setup). If you later want versioning/history,
    convert this to many rows per user with an 'effective_from' timestamp.
    """

    __tablename__ = "user_setups"
    __table_args__ = (
        UniqueConstraint("user_id", name="uq_user_setups_user_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # ML & Health Data
    date_of_birth = Column(Date, nullable=True)
    height_cm = Column(Integer, nullable=True)
    weight_kg = Column(Integer, nullable=True)

    last_period_start_date = Column(Date, nullable=True)
    avg_period_length_days = Column(Integer, nullable=True)  # e.g. 3-10
    avg_cycle_length_days = Column(Integer, nullable=True)  # e.g. 21-45

    contraception_method = Column(
        SAEnum(ContraceptionMethod, name="contraception_method", native_enum=False),
        nullable=False,
        default=ContraceptionMethod.none,
        server_default=ContraceptionMethod.none.value,
    )
    app_goal = Column(
        SAEnum(AppGoal, name="app_goal", native_enum=False),
        nullable=False,
        default=AppGoal.track_cycle,
        server_default=AppGoal.track_cycle.value,
    )

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User")

