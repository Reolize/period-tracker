"""
Admin API Module - System Configuration Management
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime

from app.api.deps import get_db
from app.api.auth_deps import get_current_admin_user
from app.models.system_setting import SystemSetting
from app.models.user import User

router = APIRouter(prefix="/admin", tags=["admin"])


# ============= Schemas =============

class SystemSettingResponse(BaseModel):
    key: str
    value: str
    description: str | None
    updated_at: datetime

    class Config:
        from_attributes = True


class SystemSettingUpdate(BaseModel):
    value: str
    description: str | None = None


class SystemSettingCreate(BaseModel):
    key: str
    value: str
    description: str | None = None


class UserListResponse(BaseModel):
    id: int
    email: str
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AdminStatsResponse(BaseModel):
    total_users: int
    total_admins: int
    total_settings: int
    recent_activities: List[dict]

    class Config:
        from_attributes = True


# ============= API Endpoints =============

@router.get("/settings", response_model=List[SystemSettingResponse])
def get_all_settings(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    """
    Get all system settings. Admin only.
    """
    settings = db.query(SystemSetting).all()
    return settings


@router.get("/settings/{key}", response_model=SystemSettingResponse)
def get_setting(
    key: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    """
    Get a specific system setting by key. Admin only.
    """
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if not setting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Setting with key '{key}' not found"
        )
    return setting


@router.put("/settings/{key}", response_model=SystemSettingResponse)
def update_setting(
    key: str,
    setting_update: SystemSettingUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    """
    Update a system setting by key. Admin only.
    Creates the setting if it doesn't exist.
    """
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    
    if setting:
        # Update existing setting
        setting.value = setting_update.value
        if setting_update.description is not None:
            setting.description = setting_update.description
    else:
        # Create new setting
        setting = SystemSetting(
            key=key,
            value=setting_update.value,
            description=setting_update.description
        )
        db.add(setting)
    
    db.commit()
    db.refresh(setting)
    return setting


@router.post("/settings", response_model=SystemSettingResponse, status_code=status.HTTP_201_CREATED)
def create_setting(
    setting_create: SystemSettingCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    """
    Create a new system setting. Admin only.
    """
    existing = db.query(SystemSetting).filter(SystemSetting.key == setting_create.key).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Setting with key '{setting_create.key}' already exists"
        )
    
    setting = SystemSetting(
        key=setting_create.key,
        value=setting_create.value,
        description=setting_create.description
    )
    db.add(setting)
    db.commit()
    db.refresh(setting)
    return setting


@router.delete("/settings/{key}", status_code=status.HTTP_204_NO_CONTENT)
def delete_setting(
    key: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    """
    Delete a system setting by key. Admin only.
    """
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if not setting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Setting with key '{key}' not found"
        )
    
    db.delete(setting)
    db.commit()
    return None


@router.get("/users", response_model=List[UserListResponse])
def get_all_users(
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    """
    Get all users. Admin only.
    Returns user data without password hash.
    """
    users = db.query(User).offset(offset).limit(limit).all()
    return users


@router.get("/stats", response_model=AdminStatsResponse)
def get_admin_stats(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    """
    Get admin dashboard statistics. Admin only.
    Returns real counts of users, admins, settings, and recent activities.
    """
    # Count total users
    total_users = db.query(User).count()
    
    # Count admins
    total_admins = db.query(User).filter(User.is_admin == True).count()
    
    # Count settings
    total_settings = db.query(SystemSetting).count()
    
    # Get 5 most recent users for activity log
    recent_users = db.query(User).order_by(User.created_at.desc()).limit(5).all()
    
    # Build recent activities list
    recent_activities = []
    for user in recent_users:
        recent_activities.append({
            "type": "user_registered",
            "message": f"New user registered: {user.email}",
            "timestamp": user.created_at.isoformat() if user.created_at else None
        })
    
    return {
        "total_users": total_users,
        "total_admins": total_admins,
        "total_settings": total_settings,
        "recent_activities": recent_activities
    }


# ============= Utility Functions =============

def initialize_default_settings(db: Session):
    """
    Initialize default system settings if they don't exist.
    Call this function on server startup or in a seed script.
    """
    default_settings = [
        {
            "key": "session_expire_minutes",
            "value": "10080",
            "description": "Session expiration time in minutes (7 days)"
        },
        {
            "key": "maintenance_mode",
            "value": "false",
            "description": "Turn on to disable user access"
        },
        {
            "key": "default_cycle_length",
            "value": "28",
            "description": "Default cycle length for new users"
        },
        {
            "key": "default_period_length",
            "value": "5",
            "description": "Default period length for new users"
        },
        {
            "key": "app_name",
            "value": "Period Tracker",
            "description": "Application name displayed in UI"
        },
        {
            "key": "max_notifications_per_user",
            "value": "100",
            "description": "Maximum number of notifications to store per user"
        },
        # ========== Prediction & ML Settings ==========
        {
            "key": "min_cycles_for_prediction",
            "value": "4",
            "description": "Minimum logs required before using user history instead of ML"
        },
        {
            "key": "prediction_window_size",
            "value": "6",
            "description": "Number of recent cycles used for calculation"
        },
        {
            "key": "enable_ml_fallback",
            "value": "true",
            "description": "Enable Machine Learning fallback for new users"
        },
        {
            "key": "ovulation_offset_days",
            "value": "14",
            "description": "Days before next period to estimate ovulation"
        },
        # ========== Health Thresholds ==========
        {
            "key": "cycle_short_threshold",
            "value": "21",
            "description": "Warning if cycle length is shorter than this (days)"
        },
        {
            "key": "cycle_long_threshold",
            "value": "35",
            "description": "Warning if cycle length is longer than this (days)"
        },
        {
            "key": "period_long_threshold",
            "value": "8",
            "description": "Warning if period lasts longer than this (days)"
        },
        {
            "key": "irregular_cv_threshold",
            "value": "0.25",
            "description": "Coefficient of variation > this means irregular cycle"
        },
        # ========== AI Insights Configuration ==========
        {
            "key": "ai_regularity_strict_sd",
            "value": "2.0",
            "description": "SD threshold for Very Regular cycle."
        },
        {
            "key": "ai_regularity_moderate_sd",
            "value": "4.0",
            "description": "SD threshold for Moderate Variation."
        },
        {
            "key": "ai_symptom_base_prob",
            "value": "30",
            "description": "Default probability (%) for symptoms if no user data."
        },
    ]
    
    created_count = 0
    for setting_data in default_settings:
        existing = db.query(SystemSetting).filter(
            SystemSetting.key == setting_data["key"]
        ).first()
        
        if not existing:
            setting = SystemSetting(
                key=setting_data["key"],
                value=setting_data["value"],
                description=setting_data["description"]
            )
            db.add(setting)
            created_count += 1
    
    if created_count > 0:
        db.commit()
        print(f"✅ Created {created_count} default system settings")
    else:
        print("ℹ️ All default system settings already exist")
    
    return created_count
