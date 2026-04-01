from __future__ import annotations

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from pydantic import EmailStr

from app.models.community import PostCategory, ReactionType, NotificationType, CommentReactionType


# ============== Request Schemas ==============

class PostCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1, max_length=5000)
    category: PostCategory = PostCategory.general
    is_anonymous: bool = False


class CommentCreate(BaseModel):
    content: str = Field(min_length=1, max_length=2000)
    is_anonymous: bool = False
    parent_id: Optional[int] = None  # For nested replies


class ReactionCreate(BaseModel):
    reaction_type: ReactionType


# ============== Response Schemas ==============

class AuthorInfo(BaseModel):
    """Author info with privacy handling for anonymous posts."""
    id: Optional[int] = None
    display_name: str
    username: Optional[str] = None
    avatar_url: Optional[str] = None
    is_anonymous: bool
    profile_pic_url: Optional[str] = None
    badges: Optional[List[str]] = None
    
    class Config:
        from_attributes = True


class ReactionSummary(BaseModel):
    hug: int = 0
    me_too: int = 0
    support: int = 0
    celebrate: int = 0
    
    @property
    def total(self) -> int:
        return self.hug + self.me_too + self.support + self.celebrate


class ReactionResponse(BaseModel):
    id: int
    user_id: int
    reaction_type: ReactionType
    created_at: datetime
    
    class Config:
        from_attributes = True


class CommentReactionSummary(BaseModel):
    like: int = 0
    heart: int = 0
    hug: int = 0
    support: int = 0


class CommentReactionCreate(BaseModel):
    reaction_type: CommentReactionType


class CommentResponse(BaseModel):
    id: int
    content: str
    author: AuthorInfo
    created_at: datetime
    parent_id: Optional[int] = None
    replies: List["CommentResponse"] = []  # Nested replies
    reactions: CommentReactionSummary = CommentReactionSummary()
    user_reaction: Optional[CommentReactionType] = None  # Current user's reaction
    reply_count: int = 0  # Total nested replies count
    is_deleted: bool = False  # Soft delete flag
    
    class Config:
        from_attributes = True


class PostResponse(BaseModel):
    id: int
    title: str
    content: str
    category: PostCategory
    author: AuthorInfo
    comment_count: int
    comments: List[CommentResponse] = []  # Latest 2 comments for feed view
    reactions: ReactionSummary
    user_reaction: Optional[ReactionType] = None  # Current user's reaction to this post
    is_author: bool = False  # Whether current user is the author of this post
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class PostDetailResponse(PostResponse):
    comments: List[CommentResponse] = []


class PostListResponse(BaseModel):
    posts: List[PostResponse]
    total: int
    page: int
    per_page: int


# ============== Notification Schemas ==============

class NotificationResponse(BaseModel):
    id: int
    sender_id: Optional[int] = None
    sender_name: Optional[str] = None
    sender_profile_pic: Optional[str] = None
    post_id: Optional[int] = None
    post_title: Optional[str] = None
    type: NotificationType
    title: str
    message: str
    link: Optional[str] = None
    is_read: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    notifications: List[NotificationResponse]
    unread_count: int
    total: int


# Rebuild models with forward references for Pydantic V2 compatibility
# This resolves self-referencing models like CommentResponse
from pydantic import VERSION as PYDANTIC_VERSION

if PYDANTIC_VERSION.startswith("2."):
    # Pydantic V2 uses model_rebuild()
    CommentResponse.model_rebuild()
else:
    # Pydantic V1 uses update_forward_refs()
    CommentResponse.update_forward_refs()
