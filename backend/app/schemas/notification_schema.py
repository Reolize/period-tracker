from datetime import datetime
from typing import Optional
from pydantic import BaseModel


# ============= Notification Schemas =============

class NotificationBase(BaseModel):
    type: str
    title: str
    message: str
    action_label: Optional[str] = None
    action_url: Optional[str] = None


class NotificationCreate(NotificationBase):
    """Schema for creating a new notification"""
    user_id: int


class NotificationUpdate(BaseModel):
    """Schema for updating notification status"""
    is_read: bool


class NotificationResponse(NotificationBase):
    """Schema for notification response"""
    id: int
    user_id: int
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    """Schema for list of notifications"""
    notifications: list[NotificationResponse]
    unread_count: int
    total_count: int


# ============= Notification Settings Schemas =============

class NotificationSettingsBase(BaseModel):
    period_predictions: bool = True
    late_period: bool = True
    fertile_window: bool = True
    log_symptoms: bool = True
    drink_water: bool = True
    ai_patterns: bool = True


class NotificationSettingsCreate(NotificationSettingsBase):
    """Schema for creating notification settings (usually auto-created)"""
    user_id: int


class NotificationSettingsUpdate(BaseModel):
    """Schema for updating notification settings - all fields optional"""
    period_predictions: Optional[bool] = None
    late_period: Optional[bool] = None
    fertile_window: Optional[bool] = None
    log_symptoms: Optional[bool] = None
    drink_water: Optional[bool] = None
    ai_patterns: Optional[bool] = None


class NotificationSettingsResponse(NotificationSettingsBase):
    """Schema for notification settings response"""
    user_id: int

    class Config:
        from_attributes = True
