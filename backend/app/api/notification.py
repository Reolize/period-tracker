from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.api.deps import get_db
from app.api.auth_deps import get_current_user
from app.models.notification import Notification, NotificationSetting
from app.models.user import User
from app.schemas.notification_schema import (
    NotificationResponse,
    NotificationListResponse,
    NotificationUpdate,
    NotificationSettingsResponse,
    NotificationSettingsUpdate,
)

router = APIRouter(prefix="/notifications", tags=["notifications"])


# ============= Notification Endpoints =============

@router.get("/", response_model=NotificationListResponse)
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    unread_only: bool = Query(False, description="Filter only unread notifications"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of notifications to return"),
    offset: int = Query(0, ge=0, description="Number of notifications to skip"),
):
    """
    Get all notifications for the current user.
    Returns notifications sorted by newest first, with counts.
    """
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    
    if unread_only:
        query = query.filter(Notification.is_read == False)
    
    # Get total counts
    total_count = query.count()
    unread_count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()
    
    # Get notifications with pagination, sorted by newest first
    notifications = query.order_by(Notification.created_at.desc()).offset(offset).limit(limit).all()
    
    return NotificationListResponse(
        notifications=notifications,
        unread_count=unread_count,
        total_count=total_count
    )


@router.put("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Mark a specific notification as read.
    """
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    
    return notification


@router.put("/read-all")
def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Mark all notifications for the current user as read.
    """
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    
    db.commit()
    
    return {"message": "All notifications marked as read"}


@router.delete("/clear-all")
def clear_all_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete all notifications for the current user.
    """
    deleted_count = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).delete(synchronize_session=False)
    
    db.commit()
    
    return {
        "message": "All notifications cleared",
        "deleted_count": deleted_count
    }


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a specific notification.
    """
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    db.delete(notification)
    db.commit()
    
    return {"message": "Notification deleted"}


# ============= Notification Settings Endpoints =============

@router.get("/settings", response_model=NotificationSettingsResponse)
def get_notification_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get notification settings for the current user.
    Creates default settings if none exist.
    """
    settings = db.query(NotificationSetting).filter(
        NotificationSetting.user_id == current_user.id
    ).first()
    
    if not settings:
        # Create default settings for the user
        settings = NotificationSetting(user_id=current_user.id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    
    return settings


@router.put("/settings", response_model=NotificationSettingsResponse)
def update_notification_settings(
    settings_update: NotificationSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update notification settings for the current user.
    Only updates fields that are provided (partial update).
    """
    settings = db.query(NotificationSetting).filter(
        NotificationSetting.user_id == current_user.id
    ).first()
    
    if not settings:
        # Create new settings with defaults, then update
        settings = NotificationSetting(user_id=current_user.id)
        db.add(settings)
        db.flush()  # Get the ID without committing
    
    # Update only provided fields
    update_data = settings_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(settings, field, value)
    
    db.commit()
    db.refresh(settings)
    
    return settings


# ============= Admin/Internal Endpoints =============

@router.post("/", response_model=NotificationResponse, include_in_schema=False)
def create_notification(
    user_id: int,
    type: str,
    title: str,
    message: str,
    action_label: Optional[str] = None,
    action_url: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Create a new notification for a user.
    This is an internal endpoint for services to call.
    """
    # Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    notification = Notification(
        user_id=user_id,
        type=type,
        title=title,
        message=message,
        action_label=action_label,
        action_url=action_url,
        is_read=False,
    )
    
    db.add(notification)
    db.commit()
    db.refresh(notification)
    
    return notification
