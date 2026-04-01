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
    """Comment on a post with anonymous support and nested replies."""
    
    __tablename__ = "comments"
    
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey("comments.id", ondelete="CASCADE"), nullable=True, index=True)  # For nested replies
    
    content = Column(Text, nullable=False)
    is_anonymous = Column(Boolean, default=False, nullable=False, server_default="false")
    is_deleted = Column(Boolean, default=False, nullable=False, server_default="false")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    post = relationship("Post", back_populates="comments")
    user = relationship("User")
    parent = relationship("Comment", remote_side=[id], back_populates="replies")
    replies = relationship("Comment", back_populates="parent", cascade="all, delete-orphan")
    reactions = relationship("CommentReaction", back_populates="comment", cascade="all, delete-orphan")


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


class CommentReactionType(str, Enum):
    like = "like"  # 👍
    heart = "heart"  # ❤️
    hug = "hug"  # 🫂
    support = "support"  # 💪


class CommentReaction(Base):
    """Reactions to comments (like Reddit upvotes or emoji reactions)."""
    
    __tablename__ = "comment_reactions"
    __table_args__ = (
        UniqueConstraint("comment_id", "user_id", name="uq_comment_reactions_comment_user"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    comment_id = Column(Integer, ForeignKey("comments.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    reaction_type = Column(
        SAEnum(CommentReactionType, name="comment_reaction_type", native_enum=False),
        nullable=False,
    )
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    comment = relationship("Comment", back_populates="reactions")
    user = relationship("User")


class NotificationType(str, Enum):
    reaction = "reaction"
    comment = "comment"
    cycle_prediction = "cycle_prediction"
    symptom_alert = "symptom_alert"
    system = "system"


class Notification(Base):
    """Unified notification system for all app notifications."""
    
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)  # Recipient
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)  # Who performed the action (nullable for system notifications)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=True, index=True)  # Optional: related post
    
    type = Column(
        SAEnum(NotificationType, name="notification_type", native_enum=False),
        nullable=False,
    )
    title = Column(String(100), nullable=False)  # Short title
    message = Column(String(500), nullable=False)  # Full message
    link = Column(String(200), nullable=True)  # Optional navigation link
    is_read = Column(Boolean, default=False, nullable=False, server_default="false")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="notifications")
    sender = relationship("User", foreign_keys=[sender_id])
    post = relationship("Post")


class NotificationSetting(Base):
    """Table for storing user notification preferences"""
    __tablename__ = "notification_settings"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    
    # Cycle Alerts
    period_predictions = Column(Boolean, default=True, nullable=False)
    late_period = Column(Boolean, default=True, nullable=False)
    
    # Fertility & Ovulation
    fertile_window = Column(Boolean, default=True, nullable=False)
    
    # Daily Reminders
    log_symptoms = Column(Boolean, default=True, nullable=False)
    drink_water = Column(Boolean, default=True, nullable=False)
    
    # AI Insights
    ai_patterns = Column(Boolean, default=True, nullable=False)
    
    # Relationship
    user = relationship("User", back_populates="notification_settings")
