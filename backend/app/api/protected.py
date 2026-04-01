from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.api.auth_deps import get_current_user
from app.core.database import get_db
from app.schemas.user_schema import UserResponse, UserUpdate
from app.models.user import User
from typing import Optional
import os
import uuid
from PIL import Image
import io

router = APIRouter(prefix="/users", tags=["users"])

# Predefined avatar options (URLs or base64)
PREDEFINED_AVATARS = [
    "https://api.dicebear.com/7.x/notionists/svg?seed=1&backgroundColor=ffdfbf",
    "https://api.dicebear.com/7.x/notionists/svg?seed=2&backgroundColor=c0aede",
    "https://api.dicebear.com/7.x/notionists/svg?seed=3&backgroundColor=b6e3f4",
    "https://api.dicebear.com/7.x/notionists/svg?seed=4&backgroundColor=ffd5dc",
    "https://api.dicebear.com/7.x/notionists/svg?seed=5&backgroundColor=d1d4f9",
    "https://api.dicebear.com/7.x/notionists/svg?seed=6&backgroundColor=ffdfbf",
]

AVATAR_UPLOAD_DIR = "uploads/avatars"
os.makedirs(AVATAR_UPLOAD_DIR, exist_ok=True)


@router.get("/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(get_current_user)):
    """Get current user profile with all fields."""
    return current_user


@router.put("/me", response_model=UserResponse)
def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile with username cooldown logic."""
    # Merge the user from dependency into this session
    user = db.merge(current_user)
    
    # Check if username is being changed
    if user_update.username is not None and user_update.username != user.username:
        # Check cooldown period (90 days)
        if user.last_username_change:
            days_since_change = (datetime.now() - user.last_username_change).days
            if days_since_change < 90:
                days_remaining = 90 - days_since_change
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Username can only be changed once every 3 months. You can change it again in {days_remaining} days."
                )
        
        # Check if username is already taken
        existing_user = db.query(User).filter(
            User.username == user_update.username,
            User.id != user.id
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username is already taken"
            )
        
        # Update username and set last change timestamp
        user.username = user_update.username
        user.last_username_change = datetime.now()
    
    # Update avatar_url if provided
    if user_update.avatar_url is not None:
        user.avatar_url = user_update.avatar_url
    
    # Update profile_pic_url if provided
    if user_update.profile_pic_url is not None:
        user.profile_pic_url = user_update.profile_pic_url
    
    # Update manual_cycle_length if provided
    if user_update.manual_cycle_length is not None:
        user.manual_cycle_length = user_update.manual_cycle_length
    
    # Update privacy settings if provided
    if user_update.share_anonymous_data is not None:
        user.share_anonymous_data = user_update.share_anonymous_data
    
    if user_update.is_anonymous_mode is not None:
        user.is_anonymous_mode = user_update.is_anonymous_mode
    
    db.commit()
    db.refresh(user)
    return user


@router.post("/me/avatar")
def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload and process avatar image - resize to 400x400 max, compress to WebP."""
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}"
        )
    
    try:
        # Read and process image
        contents = file.file.read()
        img = Image.open(io.BytesIO(contents))
        
        # Convert to RGB if necessary (for PNG with transparency)
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGBA")
            # Create white background
            background = Image.new("RGBA", img.size, (255, 255, 255, 255))
            img = Image.alpha_composite(background, img).convert("RGB")
        elif img.mode != "RGB":
            img = img.convert("RGB")
        
        # Resize to max 400x400 while maintaining aspect ratio
        max_size = (400, 400)
        img.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        # Generate unique filename
        file_id = str(uuid.uuid4())
        filename = f"{current_user.id}_{file_id}.webp"
        filepath = os.path.join(AVATAR_UPLOAD_DIR, filename)
        
        # Save as WebP with quality 80
        img.save(filepath, "WEBP", quality=80, method=6)
        
        # Generate URL (relative path)
        avatar_url = f"/uploads/avatars/{filename}"
        
        # Update user
        user = db.merge(current_user)
        user.avatar_url = avatar_url
        db.commit()
        db.refresh(user)
        
        return {
            "avatar_url": avatar_url,
            "message": "Avatar uploaded successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process image: {str(e)}"
        )
    finally:
        file.file.close()


@router.get("/avatars/predefined")
def get_predefined_avatars():
    """Get list of predefined avatar URLs."""
    return {"avatars": PREDEFINED_AVATARS}


@router.post("/me/avatar/predefined")
def set_predefined_avatar(
    avatar_index: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Set avatar from predefined options."""
    if avatar_index < 0 or avatar_index >= len(PREDEFINED_AVATARS):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid avatar index. Must be 0-{len(PREDEFINED_AVATARS)-1}"
        )
    
    user = db.merge(current_user)
    user.avatar_url = PREDEFINED_AVATARS[avatar_index]
    db.commit()
    db.refresh(user)
    
    return {
        "avatar_url": PREDEFINED_AVATARS[avatar_index],
        "message": "Avatar updated successfully"
    }


@router.get("/me/next-period-prediction")
def get_next_period_prediction(
    prediction_mode: str = "smart",
    manual_cycle_length: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Calculate next period prediction using PredictionEngine (unified with Insights).
    """
    from app.models.cycle import Cycle
    from app.models.user_setup import UserSetup
    from app.services.prediction_engine import PredictionEngine
    from datetime import datetime, timedelta
    
    # Get user's cycles sorted by start date (ascending for PredictionEngine)
    cycles = db.query(Cycle).filter(
        Cycle.user_id == current_user.id
    ).order_by(Cycle.start_date.asc()).all()
    
    # Get user setup for prediction settings
    user_setup = db.query(UserSetup).filter(
        UserSetup.user_id == current_user.id
    ).first()
    
    has_pcos_or_irregular = user_setup.has_pcos_or_irregular if user_setup else False
    db_manual_cycle_length = user_setup.manual_cycle_length if user_setup else 28
    db_prediction_mode = user_setup.prediction_mode if user_setup else "smart"
    
    print(f"[BACKEND API] UserSetup loaded from DB: mode={db_prediction_mode}, manual={db_manual_cycle_length}")
    
    # Use saved preference if not provided in query
    if prediction_mode == "smart" and user_setup and user_setup.prediction_mode:
        prediction_mode = user_setup.prediction_mode
    
    # Get last period date or return insufficient data
    if len(cycles) > 0:
        last_period_date = cycles[-1].start_date  # Most recent (last in asc order)
    else:
        return {
            "has_enough_data": False,
            "message": "Need at least one period log to predict",
            "min_required_cycles": 1,
            "current_cycles": 0,
            "prediction_mode": prediction_mode
        }
    
    today = datetime.now().date()
    
    # UNIFIED: Use PredictionEngine (same as Insights dashboard)
    result = PredictionEngine.predict(
        db=db,
        user_id=current_user.id,
        cycles=cycles,
        prediction_mode=prediction_mode,
        manual_cycle_length=db_manual_cycle_length if prediction_mode == "fixed" else None
    )
    
    if not result:
        # Fallback for insufficient data
        return {
            "has_enough_data": False,
            "message": "Not enough cycle data for prediction",
            "min_required_cycles": 3,
            "current_cycles": len(cycles),
            "prediction_mode": prediction_mode
        }
    
    # Extract values from PredictionEngine result
    avg_cycle_length = result["cycle_length_prediction"]
    predicted_next_date = result["predicted_next_start"]
    days_remaining = (predicted_next_date - today).days
    
    # Determine accuracy buffer based on data quality
    cycle_std_dev = result.get("cycle_std_dev", 2)
    confidence_score = result.get("confidence_score", 50)
    
    if cycle_std_dev < 1.0 and len(cycles) >= 6:
        accuracy_buffer = 1  # Very regular
    elif cycle_std_dev < 2.0:
        accuracy_buffer = 2  # Regular
    elif cycle_std_dev < 4.0:
        accuracy_buffer = 3  # Somewhat irregular
    else:
        accuracy_buffer = 4  # Irregular
    
    is_irregular_adjusted = False
    warning_message = None
    
    if has_pcos_or_irregular:
        accuracy_buffer = max(accuracy_buffer, 5)
        is_irregular_adjusted = True
        warning_message = "Warning: Cycle is unpredictable due to irregular patterns"
    
    # Calculate cycle lengths from history for display
    cycle_lengths = []
    for i in range(len(cycles) - 1):
        if cycles[i].cycle_length:
            cycle_lengths.append(cycles[i].cycle_length)
    
    mode_label = result.get("mode_label", prediction_mode)
    
    return {
        "has_enough_data": True,
        "prediction_mode": prediction_mode,
        "mode_label": mode_label,
        "last_period_date": last_period_date.isoformat(),
        "predicted_next_date": predicted_next_date.isoformat(),
        "predicted_days_remaining": days_remaining,
        "average_cycle_length": round(avg_cycle_length, 1),
        "accuracy_buffer": accuracy_buffer,
        "is_irregular_adjusted": is_irregular_adjusted,
        "has_pcos_or_irregular": has_pcos_or_irregular,
        "cycles_used_for_calculation": len(cycle_lengths),
        "warning_message": warning_message,
        "cycle_std_dev": cycle_std_dev,
        "confidence_score": confidence_score,
        "global_baseline": 28.5 if prediction_mode == "smart" else None,
        "manual_cycle_length": db_manual_cycle_length if prediction_mode == "fixed" else None
    }