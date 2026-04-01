from sqlalchemy import Column, Integer, String, DateTime, Boolean, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Profile & Badges
    profile_pic_url = Column(String(500), nullable=True)
    username = Column(String(50), unique=True, nullable=True)
    avatar_url = Column(String(500), nullable=True)
    last_username_change = Column(DateTime(timezone=True), nullable=True)
    joined_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    badges = Column(JSON, nullable=True, default=list)  # e.g., ["verified_doctor", "admin", "1_year_veteran"]

    # Prediction Settings
    manual_cycle_length = Column(Integer, default=28, nullable=False)  # For Fixed Number mode

    # Privacy Settings
    share_anonymous_data = Column(Boolean, default=True, nullable=False)  # Allow AI training on anonymized data
    is_anonymous_mode = Column(Boolean, default=False, nullable=False)  # Hide real identity in community

    # Relationships
    notifications = relationship("Notification", foreign_keys="Notification.user_id", back_populates="user", cascade="all, delete-orphan")
    notification_settings = relationship("NotificationSetting", back_populates="user", uselist=False, cascade="all, delete-orphan")