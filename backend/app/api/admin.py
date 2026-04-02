"""
Admin API Module - System Configuration Management
"""
import csv
import uuid
from io import StringIO
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from pydantic import BaseModel

from app.api.deps import get_db
from app.api.auth_deps import get_current_admin_user
from app.models.system_setting import SystemSetting
from app.models.user import User
from app.models.cycle import Cycle

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


@router.get("/export-ml-data")
def export_ml_data(
    min_cycles: int = 6,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    """
    Export ALL anonymized data for ML model training.
    Admin only.
    
    Returns a CSV file containing ALL current non-PII data from users
    who have logged at least `min_cycles` completed cycles.
    
    Columns include:
    - User profile data (demographics, health conditions, preferences)
    - Cycle data (timing, lengths)
    - Daily log aggregates (symptoms, flow, BBT, etc.)
    
    All PII (email, real user_id, names) is stripped.
    """
    from app.models.user_setup import UserSetup
    from app.models.daily_log import DailyLog
    import statistics
    
    # Query users with at least min_cycles completed cycles
    qualified_users = (
        db.query(User.id)
        .join(Cycle, User.id == Cycle.user_id)
        .filter(Cycle.cycle_length.isnot(None))
        .filter(Cycle.period_length.isnot(None))
        .group_by(User.id)
        .having(func.count(Cycle.id) >= min_cycles)
        .all()
    )
    
    qualified_user_ids = [u.id for u in qualified_users]
    
    if not qualified_user_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No users found with at least {min_cycles} completed cycles"
        )
    
    # Fetch ALL relevant data for qualified users in bulk
    # 1. User setup data
    setups_data = (
        db.query(UserSetup)
        .filter(UserSetup.user_id.in_(qualified_user_ids))
        .all()
    )
    setups_by_user = {s.user_id: s for s in setups_data}
    
    # 2. All cycles for these users
    cycles_data = (
        db.query(Cycle)
        .filter(Cycle.user_id.in_(qualified_user_ids))
        .filter(Cycle.cycle_length.isnot(None))
        .filter(Cycle.period_length.isnot(None))
        .order_by(Cycle.user_id, Cycle.start_date)
        .all()
    )
    
    # 3. All daily logs for these users (for symptom/flow aggregation)
    daily_logs_data = (
        db.query(DailyLog)
        .filter(DailyLog.user_id.in_(qualified_user_ids))
        .all()
    )
    logs_by_user = {}
    for log in daily_logs_data:
        if log.user_id not in logs_by_user:
            logs_by_user[log.user_id] = []
        logs_by_user[log.user_id].append(log)
    
    # Create anonymized ID mapping
    user_id_mapping = {uid: f"anon_{i:08d}" for i, uid in enumerate(qualified_user_ids, 1)}
    
    # Group cycles by user for sequence numbering and stats
    cycles_by_user = {}
    for cycle in cycles_data:
        anon_id = user_id_mapping.get(cycle.user_id)
        if anon_id:
            if anon_id not in cycles_by_user:
                cycles_by_user[anon_id] = []
            cycles_by_user[anon_id].append(cycle)
    
    # Generate CSV
    output = StringIO()
    writer = csv.writer(output)
    
    # Write CLEAN CSV header - only 40 highly relevant ML features
    writer.writerow([
        # === Target & Context (10 columns) ===
        "anonymous_user_id",
        "cycle_sequence_number",
        "total_user_cycles",
        "cycle_start_date",
        "cycle_end_date",
        "cycle_length_days",
        "period_length_days",
        "cycle_start_month",
        "cycle_start_year",
        "cycle_start_day_of_week",
        
        # === Health Profile (6 columns) ===
        "setup_has_pcos_or_irregular",
        "setup_contraception_method",
        "setup_app_goal",
        "setup_prediction_mode",
        "setup_avg_period_length_days",
        "setup_avg_cycle_length_days",
        
        # === Daily Logs (16 columns) ===
        "log_count_during_cycle",
        "log_days_with_bleeding",
        "log_days_with_spotting",
        "log_bleeding_flow_sum",
        "log_bbt_readings_count",
        "log_physical_symptoms_count",
        "log_mood_entries_count",
        "log_days_with_cramps",
        "log_days_with_headache",
        "log_days_with_bloating",
        "log_days_with_sex",
        "log_days_with_protection",
        "log_discharge_eggwhite_days",
        "log_discharge_creamy_days",
        "log_discharge_watery_days",
        "log_discharge_sticky_days",
        "log_discharge_dry_days",
        
        # === Calculated Stats (7 columns) ===
        "cycle_length_zscore",
        "period_length_zscore",
        "user_cycle_mean",
        "user_cycle_std",
        "user_period_mean",
        "user_period_std",
        "data_quality_score",
    ])
    
    # Process each user's cycles
    for anon_id, user_cycles in cycles_by_user.items():
        # Get original user_id from reverse mapping
        original_user_id = None
        for uid, aid in user_id_mapping.items():
            if aid == anon_id:
                original_user_id = uid
                break
        
        if not original_user_id:
            continue
        
        # Get user setup data
        setup = setups_by_user.get(original_user_id)
        
        # Get user's logs
        user_logs = logs_by_user.get(original_user_id, [])
        
        # Calculate user-level statistics for z-scores
        cycle_lengths = [c.cycle_length for c in user_cycles if c.cycle_length]
        period_lengths = [c.period_length for c in user_cycles if c.period_length]
        
        cycle_mean = statistics.mean(cycle_lengths) if cycle_lengths else 28
        cycle_std = statistics.stdev(cycle_lengths) if len(cycle_lengths) > 1 else 0
        period_mean = statistics.mean(period_lengths) if period_lengths else 5
        period_std = statistics.stdev(period_lengths) if len(period_lengths) > 1 else 0
        
        # Data quality score
        data_quality = min(len(user_cycles) / 12, 1.0)
        
        # Process each cycle
        for seq_num, cycle in enumerate(user_cycles, 1):
            start_date = cycle.start_date
            end_date = cycle.end_date
            
            # Calculate z-scores
            cycle_zscore = 0.0
            if cycle_std > 0 and cycle.cycle_length:
                cycle_zscore = (cycle.cycle_length - cycle_mean) / cycle_std
            
            period_zscore = 0.0
            if period_std > 0 and cycle.period_length:
                period_zscore = (cycle.period_length - period_mean) / period_std
            
            # Aggregate daily logs that fall within this cycle period
            cycle_logs = []
            if start_date and end_date and user_logs:
                for log in user_logs:
                    if log.log_date and start_date <= log.log_date <= end_date:
                        cycle_logs.append(log)
            
            # Calculate log aggregates
            log_count = len(cycle_logs)
            
            bleeding_days = 0
            spotting_days = 0
            bleeding_flow_sum = 0
            bbt_readings = []
            physical_symptoms_total = 0
            mood_entries_total = 0
            cramp_days = 0
            headache_days = 0
            bloating_days = 0
            sex_days = 0
            protection_days = 0
            discharge_counts = {"eggwhite": 0, "creamy": 0, "watery": 0, "sticky": 0, "dry": 0, "none": 0}
            
            for log in cycle_logs:
                # Bleeding flow
                if log.bleeding_flow == "spotting":
                    spotting_days += 1
                    bleeding_flow_sum += 1
                elif log.bleeding_flow in ["light", "medium", "heavy"]:
                    bleeding_days += 1
                    flow_values = {"light": 2, "medium": 3, "heavy": 4}
                    bleeding_flow_sum += flow_values.get(log.bleeding_flow, 0)
                
                # BBT
                if log.bbt_celsius:
                    bbt_readings.append(float(log.bbt_celsius))
                
                # Physical symptoms
                if log.physical_symptoms:
                    physical_symptoms_total += len(log.physical_symptoms)
                    if "cramps" in log.physical_symptoms or "cramping" in log.physical_symptoms:
                        cramp_days += 1
                    if "headache" in log.physical_symptoms or "migraine" in log.physical_symptoms:
                        headache_days += 1
                    if "bloating" in log.physical_symptoms:
                        bloating_days += 1
                
                # Moods
                if log.moods:
                    mood_entries_total += len(log.moods)
                
                # Sex activity
                if log.sex and isinstance(log.sex, dict):
                    if log.sex.get("had_sex") or log.sex.get("sex"):
                        sex_days += 1
                        if log.sex.get("protection") and log.sex.get("protection") != "none":
                            protection_days += 1
                
                # Discharge
                if log.discharge_type:
                    discharge_counts[log.discharge_type] = discharge_counts.get(log.discharge_type, 0) + 1
            
            # Format dates as YYYY-MM-DD
            def fmt_date(d):
                return d.strftime("%Y-%m-%d") if d else ""
            
            writer.writerow([
                # === Target & Context (10 columns) ===
                anon_id,
                seq_num,
                len(user_cycles),
                fmt_date(start_date),
                fmt_date(end_date),
                cycle.cycle_length,
                cycle.period_length,
                start_date.month if start_date else "",
                start_date.year if start_date else "",
                start_date.weekday() if start_date else "",
                
                # === Health Profile (6 columns) ===
                setup.has_pcos_or_irregular if setup else False,
                setup.contraception_method.value if setup and setup.contraception_method else "none",
                setup.app_goal.value if setup and setup.app_goal else "track_cycle",
                setup.prediction_mode if setup else "smart",
                setup.avg_period_length_days if setup else "",
                setup.avg_cycle_length_days if setup else "",
                
                # === Daily Logs (16 columns) ===
                log_count,
                bleeding_days,
                spotting_days,
                bleeding_flow_sum,
                len(bbt_readings),
                physical_symptoms_total,
                mood_entries_total,
                cramp_days,
                headache_days,
                bloating_days,
                sex_days,
                protection_days,
                discharge_counts.get("eggwhite", 0),
                discharge_counts.get("creamy", 0),
                discharge_counts.get("watery", 0),
                discharge_counts.get("sticky", 0),
                discharge_counts.get("dry", 0),
                
                # === Calculated Stats (7 columns) ===
                round(cycle_zscore, 4),
                round(period_zscore, 4),
                round(cycle_mean, 2),
                round(cycle_std, 2),
                round(period_mean, 2),
                round(period_std, 2),
                round(data_quality, 4),
            ])
    
    # Prepare CSV for streaming
    output.seek(0)
    csv_content = output.getvalue()
    output.close()
    
    # Generate filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"ml_training_data_complete_{timestamp}_min{min_cycles}.csv"
    
    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Content-Type": "text/csv; charset=utf-8",
        }
    )

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
