from __future__ import annotations

from enum import Enum

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class PostCategory(str, Enum):
    pcos = "PCOS"
    tips = "Tips"
    support = "Support"
    general = "General"
    questions = "Questions"


class ReactionType(str, Enum):
    hug = "hug"  # 🫂
    me_too = "me_too"  # ✋
    support = "support"  # 💪
    celebrate = "celebrate"  # 🎉


class Post(Base):
    """Community post with privacy-aware anonymous posting support."""
    
    __tablename__ = "posts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(
        SAEnum(PostCategory, name="post_category", native_enum=False),
        nullable=False,
        default=PostCategory.general,
        server_default=PostCategory.general.value,
    )
    is_anonymous = Column(Boolean, default=False, nullable=False, server_default="false")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")
    reactions = relationship("Reaction", back_populates="post", cascade="all, delete-orphan")
    
    @property
    def comment_count(self):
        return len(self.comments) if self.comments else 0
    
    @property
    def reaction_summary(self):
        """Returns a summary of reactions by type."""
        summary = {"hug": 0, "me_too": 0, "support": 0, "celebrate": 0}
        if self.reactions:
            for reaction in self.reactions:
                summary[reaction.reaction_type.value] += 1
        return summary


class Comment(Base):
    """Comment on a post with anonymous support."""
    
    __tablename__ = "comments"
    
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    content = Column(Text, nullable=False)
    is_anonymous = Column(Boolean, default=False, nullable=False, server_default="false")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    post = relationship("Post", back_populates="comments")
    user = relationship("User")


class Reaction(Base):
    """Empathetic reactions to posts (hug, me_too, etc.) - one reaction per user per post."""
    
    __tablename__ = "reactions"
    __table_args__ = (
        UniqueConstraint("post_id", "user_id", name="uq_reactions_post_user"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    reaction_type = Column(
        SAEnum(ReactionType, name="reaction_type", native_enum=False),
        nullable=False,
    )
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    post = relationship("Post", back_populates="reactions")
    user = relationship("User")
