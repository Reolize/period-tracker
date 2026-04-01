from pydantic import BaseModel, Field
from pydantic import EmailStr
from datetime import datetime
from typing import Optional, List

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)

class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)

class UserUpdate(BaseModel):
    profile_pic_url: Optional[str] = None
    username: Optional[str] = None
    avatar_url: Optional[str] = None
    manual_cycle_length: Optional[int] = 28
    share_anonymous_data: Optional[bool] = None
    is_anonymous_mode: Optional[bool] = None

class UserResponse(BaseModel):
    id: int
    email: str
    is_admin: bool
    profile_pic_url: Optional[str] = None
    username: Optional[str] = None
    avatar_url: Optional[str] = None
    last_username_change: Optional[datetime] = None
    joined_at: Optional[datetime] = None
    badges: Optional[List[str]] = None
    manual_cycle_length: int = 28
    share_anonymous_data: bool = True
    is_anonymous_mode: bool = False

    class Config:
        from_attributes = True


# Badge definitions with icons and labels
BADGE_CONFIG = {
    "verified_doctor": {"icon": "", "label": "Verified Doctor", "color": "blue"},
    "admin": {"icon": "", "label": "Admin", "color": "gold"},
    "1_year_veteran": {"icon": "", "label": "1 Year Veteran", "color": "purple"},
}