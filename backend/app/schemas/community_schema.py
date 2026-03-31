from __future__ import annotations

from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field

from app.models.community import PostCategory, ReactionType


# ============== Request Schemas ==============

class PostCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1, max_length=5000)
    category: PostCategory = PostCategory.general
    is_anonymous: bool = False


class CommentCreate(BaseModel):
    content: str = Field(min_length=1, max_length=2000)
    is_anonymous: bool = False


class ReactionCreate(BaseModel):
    reaction_type: ReactionType


# ============== Response Schemas ==============

class AuthorInfo(BaseModel):
    """Author info with privacy handling for anonymous posts."""
    id: Optional[int] = None
    display_name: str
    is_anonymous: bool
    
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


class CommentResponse(BaseModel):
    id: int
    content: str
    author: AuthorInfo
    created_at: datetime
    
    class Config:
        from_attributes = True


class PostResponse(BaseModel):
    id: int
    title: str
    content: str
    category: PostCategory
    author: AuthorInfo
    comment_count: int
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
