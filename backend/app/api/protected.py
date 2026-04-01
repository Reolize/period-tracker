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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Calculate next period prediction using 3 distinct tiers:
    
    - Smart AI: Hybrid (Global Baseline 28.5 + Weighted Personal Average)
    - Regular Calendar: Pure Personal History (Simple Average)
    - Fixed Number: User-Defined Cycle Length
    """
    from app.models.cycle import Cycle
    from app.models.user_setup import UserSetup
    from datetime import datetime, timedelta
    
    # Global medical baseline
    GLOBAL_BASELINE = 28.5
    
    # Get user's cycles sorted by start date (most recent first)
    cycles = db.query(Cycle).filter(
        Cycle.user_id == current_user.id
    ).order_by(Cycle.start_date.desc()).all()
    
    # Get user setup for PCOS/irregular flag
    user_setup = db.query(UserSetup).filter(
        UserSetup.user_id == current_user.id
    ).first()
    
    has_pcos_or_irregular = user_setup.has_pcos_or_irregular if user_setup else False
    
    # Calculate cycle lengths from history
    cycle_lengths = []
    for i in range(len(cycles) - 1):
        current_cycle = cycles[i]
        next_cycle = cycles[i + 1]
        days_diff = (current_cycle.start_date - next_cycle.start_date).days
        if days_diff > 0 and days_diff < 90:
            cycle_lengths.append(days_diff)
    
    # Get last period date or return insufficient data
    if len(cycles) > 0:
        last_period_date = cycles[0].start_date
    else:
        return {
            "has_enough_data": False,
            "message": "Need at least one period log to predict",
            "min_required_cycles": 1,
            "current_cycles": 0,
            "prediction_mode": prediction_mode
        }
    
    today = datetime.now().date()
    days_since_last = (today - last_period_date).days
    
    # Initialize response variables
    avg_cycle_length = GLOBAL_BASELINE
    accuracy_buffer = 2
    is_irregular_adjusted = False
    mode_label = ""
    warning_message = None
    
    # ===================== TIER 1: SMART AI (Hybrid Intelligence) =====================
    if prediction_mode == "smart":
        mode_label = "Smart AI Hybrid"
        
        if len(cycle_lengths) >= 2:
            # Weighted Moving Average - recent cycles weighted more heavily
            # Use last 6 cycles max, with exponential weighting
            recent_cycles = cycle_lengths[:6]
            weights = []
            for i in range(len(recent_cycles)):
                # More recent = higher weight (exponential)
                weight = 2 ** (len(recent_cycles) - i - 1)
                weights.append(weight)
            
            weighted_personal = sum(c * w for c, w in zip(recent_cycles, weights)) / sum(weights)
            
            # Hybrid: Blend global baseline with weighted personal average
            # Weight: 30% global, 70% personal (adjustable based on data confidence)
            confidence = min(1.0, len(recent_cycles) / 6)  # More data = higher confidence in personal
            avg_cycle_length = (GLOBAL_BASELINE * (1 - confidence * 0.7)) + (weighted_personal * (confidence * 0.7 + 0.3))
        else:
            # Not enough history, use global baseline
            avg_cycle_length = GLOBAL_BASELINE
        
        # PCOS/Irregular adjustment
        if has_pcos_or_irregular:
            accuracy_buffer = 5  # Wider buffer for irregular cycles
            is_irregular_adjusted = True
            warning_message = "Warning: Cycle is unpredictable due to irregular patterns"
        elif len(cycle_lengths) >= 4:
            # Calculate variance for dynamic buffer
            variance = sum((x - avg_cycle_length) ** 2 for x in cycle_lengths[:4]) / 4
            std_dev = variance ** 0.5
            accuracy_buffer = max(2, min(4, int(std_dev / 2)))
        else:
            accuracy_buffer = 3  # Medium buffer for limited data
    
    # ===================== TIER 2: REGULAR CALENDAR (Pure Personal) =====================
    elif prediction_mode == "strict":
        mode_label = "Regular Calendar"
        
        if len(cycle_lengths) >= 2:
            # Simple arithmetic mean of last 3-6 cycles
            recent_cycles = cycle_lengths[:6]
            avg_cycle_length = sum(recent_cycles) / len(recent_cycles)
            accuracy_buffer = 2
        elif len(cycle_lengths) == 1:
            # Only one cycle, use it but with caution
            avg_cycle_length = cycle_lengths[0]
            accuracy_buffer = 3
        else:
            # No history - fallback to 28 days
            avg_cycle_length = 28
            accuracy_buffer = 3
            warning_message = "Calculating from your history... (Using default 28 days)"
    
    # ===================== TIER 3: FIXED NUMBER (User-Defined) =====================
    elif prediction_mode == "fixed":
        mode_label = "Fixed Number"
        
        # Use user's manual cycle length setting
        manual_length = current_user.manual_cycle_length or 28
        avg_cycle_length = manual_length
        accuracy_buffer = 2  # Fixed mode has standard buffer
    
    # Calculate predicted next period date
    predicted_next_date = last_period_date + timedelta(days=int(avg_cycle_length))
    days_remaining = (predicted_next_date - today).days
    
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
        "cycles_used_for_calculation": len(cycle_lengths[:6]),
        "warning_message": warning_message,
        "global_baseline": GLOBAL_BASELINE if prediction_mode == "smart" else None,
        "manual_cycle_length": current_user.manual_cycle_length if prediction_mode == "fixed" else None
    }