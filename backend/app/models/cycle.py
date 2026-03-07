from app.core.database import Base
from sqlalchemy import Column, Integer, Date, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

class Cycle(Base):
    __tablename__ = "cycles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)

    period_length = Column(Integer, nullable=True)
    cycle_length = Column(Integer, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")