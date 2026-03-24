from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Notification(Base):
    """Table for storing user notifications"""
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String, nullable=False)  # 'cycle', 'ai_insight', 'reminder', 'fertility'
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    action_label = Column(String, nullable=True)  # Optional action button label
    action_url = Column(String, nullable=True)  # Optional action URL
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationship
    user = relationship("User", back_populates="notifications")


class NotificationSetting(Base):
    """Table for storing user notification preferences"""
    __tablename__ = "notification_settings"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    
    # Cycle Alerts
    period_predictions = Column(Boolean, default=True, nullable=False)
    late_period = Column(Boolean, default=True, nullable=False)
    
    # Fertility & Ovulation
    fertile_window = Column(Boolean, default=True, nullable=False)
    
    # Daily Reminders
    log_symptoms = Column(Boolean, default=True, nullable=False)
    drink_water = Column(Boolean, default=True, nullable=False)
    
    # AI Insights
    ai_patterns = Column(Boolean, default=True, nullable=False)
    
    # Relationship
    user = relationship("User", back_populates="notification_settings")
