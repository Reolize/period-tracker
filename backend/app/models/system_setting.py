from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.sql import func
from app.core.database import Base


class SystemSetting(Base):
    """Table for storing system-wide configuration settings (Key-Value store)"""
    __tablename__ = "system_settings"

    key = Column(String, primary_key=True, index=True, nullable=False)
    value = Column(Text, nullable=False)
    description = Column(String, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
