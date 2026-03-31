"""
Community Board API - Privacy-first community sharing with empathetic reactions.
"""
from __future__ import annotations

import random
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from app.api.deps import get_db
from app.api.auth_deps import get_current_user
from app.models.community import Post, Comment, Reaction, PostCategory, ReactionType
from app.models.user import User
from app.schemas.community_schema import (
    PostCreate,
    CommentCreate,
    ReactionCreate,
    PostResponse,
    PostDetailResponse,
    PostListResponse,
    CommentResponse,
    AuthorInfo,
    ReactionSummary,
)
from app.services.llm_service import LLMService

router = APIRouter(prefix="/community", tags=["community"])

# Cute animal names for anonymous posts
ANONYMOUS_NAMES = [
    "Shy Panda", "Gentle Rabbit", "Cozy Cat", "Warm Puppy", 
    "Peaceful Owl", "Kind Deer", "Soft Bunny", "Friendly Fox",
    "Caring Bear", "Gentle Swan", "Sweet Hamster", "Brave Butterfly",
    "Calm Turtle", "Happy Penguin", "Wise Elephant", "Gentle Giraffe"
]


def get_anonymous_name(seed: int) -> str:
    """Get a consistent anonymous name based on seed (post/comment id)."""
    rng = random.Random(seed)
    return rng.choice(ANONYMOUS_NAMES)


def build_author_info(
    user: User, 
    is_anonymous: bool, 
    anonymous_seed: int,
    current_user_id: int
) -> AuthorInfo:
    """Build author info with privacy handling."""
    if is_anonymous:
        return AuthorInfo(
            id=None,
            display_name=get_anonymous_name(anonymous_seed),
            is_anonymous=True
        )
    else:
        return AuthorInfo(
            id=user.id,
            display_name=user.email.split("@")[0],  # Use part before @ as display name
            is_anonymous=False
        )


def build_reaction_summary(reactions: List[Reaction]) -> ReactionSummary:
    """Build reaction summary from list of reactions."""
    summary = ReactionSummary()
    for reaction in reactions:
        if reaction.reaction_type == ReactionType.hug:
            summary.hug += 1
        elif reaction.reaction_type == ReactionType.me_too:
            summary.me_too += 1
        elif reaction.reaction_type == ReactionType.support:
            summary.support += 1
        elif reaction.reaction_type == ReactionType.celebrate:
            summary.celebrate += 1
    return summary


def get_user_reaction(reactions: List[Reaction], user_id: int) -> ReactionType | None:
    """Get the current user's reaction to a post if any."""
    for reaction in reactions:
        if reaction.user_id == user_id:
            return reaction.reaction_type
    return None


@router.get("/posts", response_model=PostListResponse)
def list_posts(
    category: PostCategory | None = Query(None, description="Filter by category"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=50, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List community posts with privacy-aware author info.
    Anonymous posts show cute animal names instead of real identities.
    """
    query = db.query(Post)
    
    if category:
        query = query.filter(Post.category == category)
    
    total = query.count()
    
    posts = (
        query
        .order_by(desc(Post.created_at))
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    
    post_responses = []
    for post in posts:
        author = build_author_info(
            post.user, 
            post.is_anonymous, 
            post.id,
            current_user.id
        )
        
        reactions = post.reactions
        reaction_summary = build_reaction_summary(reactions)
        user_reaction = get_user_reaction(reactions, current_user.id)
        
        post_responses.append(PostResponse(
            id=post.id,
            title=post.title,
            content=post.content,
            category=post.category,
            author=author,
            comment_count=len(post.comments),
            reactions=reaction_summary,
            user_reaction=user_reaction,
            is_author=post.user_id == current_user.id,  # Check if current user is the author
            created_at=post.created_at,
            updated_at=post.updated_at,
        ))
    
    return PostListResponse(
        posts=post_responses,
        total=total,
        page=page,
        per_page=per_page,
    )


@router.post("/posts", response_model=PostResponse)
def create_post(
    payload: PostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new community post. Can be posted anonymously. Content is moderated by AI."""
    print(f"📝 [create_post] User {current_user.id} creating post: title='{payload.title[:50]}...', category={payload.category}, anonymous={payload.is_anonymous}")
    
    # Combine title and content for moderation
    content_to_moderate = f"{payload.title}\n\n{payload.content}"
    print(f"🔍 [create_post] Sending to AI moderation (length: {len(content_to_moderate)} chars)")
    
    # AI Content Moderation
    is_safe = LLMService.moderate_content(content_to_moderate)
    print(f"🔍 [create_post] AI moderation result: {'SAFE ✓' if is_safe else 'UNSAFE ✗'}")
    
    if not is_safe:
        print(f"🚫 [create_post] Post blocked by AI moderation")
        raise HTTPException(
            status_code=400, 
            detail="เนื้อหาขัดต่อมาตรฐานชุมชน (Inappropriate content detected by AI)"
        )
    
    post = Post(
        user_id=current_user.id,
        title=payload.title,
        content=payload.content,
        category=payload.category,
        is_anonymous=payload.is_anonymous,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    print(f"✅ [create_post] Post {post.id} created successfully")
    
    author = build_author_info(
        current_user,
        post.is_anonymous,
        post.id,
        current_user.id
    )
    
    return PostResponse(
        id=post.id,
        title=post.title,
        content=post.content,
        category=post.category,
        author=author,
        comment_count=0,
        reactions=ReactionSummary(),
        user_reaction=None,
        is_author=True,  # User is always author of their own newly created post
        created_at=post.created_at,
        updated_at=post.updated_at,
    )


@router.get("/posts/{post_id}", response_model=PostDetailResponse)
def get_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single post with all comments."""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Build author info for post
    post_author = build_author_info(
        post.user,
        post.is_anonymous,
        post.id,
        current_user.id
    )
    
    # Build comment responses
    comment_responses = []
    for comment in post.comments:
        comment_author = build_author_info(
            comment.user,
            comment.is_anonymous,
            comment.id,
            current_user.id
        )
        comment_responses.append(CommentResponse(
            id=comment.id,
            content=comment.content,
            author=comment_author,
            created_at=comment.created_at,
        ))
    
    reactions = post.reactions
    reaction_summary = build_reaction_summary(reactions)
    user_reaction = get_user_reaction(reactions, current_user.id)
    
    return PostDetailResponse(
        id=post.id,
        title=post.title,
        content=post.content,
        category=post.category,
        author=post_author,
        comment_count=len(post.comments),
        reactions=reaction_summary,
        user_reaction=user_reaction,
        is_author=post.user_id == current_user.id,  # Check if current user is the author
        created_at=post.created_at,
        updated_at=post.updated_at,
        comments=comment_responses,
    )


@router.post("/posts/{post_id}/comments", response_model=CommentResponse)
def add_comment(
    post_id: int,
    payload: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a comment to a post. Can be posted anonymously. Content is moderated by AI."""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # AI Content Moderation
    is_safe = LLMService.moderate_content(payload.content)
    if not is_safe:
        raise HTTPException(
            status_code=400, 
            detail="เนื้อหาขัดต่อมาตรฐานชุมชน (Inappropriate content detected by AI)"
        )
    
    comment = Comment(
        post_id=post_id,
        user_id=current_user.id,
        content=payload.content,
        is_anonymous=payload.is_anonymous,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    
    author = build_author_info(
        current_user,
        comment.is_anonymous,
        comment.id,
        current_user.id
    )
    
    return CommentResponse(
        id=comment.id,
        content=comment.content,
        author=author,
        created_at=comment.created_at,
    )


@router.post("/posts/{post_id}/react", response_model=PostResponse)
def react_to_post(
    post_id: int,
    payload: ReactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Add or update an empathetic reaction to a post.
    Users can only have one reaction per post - adding a new one replaces the old.
    """
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Check if user already has a reaction
    existing = (
        db.query(Reaction)
        .filter(Reaction.post_id == post_id, Reaction.user_id == current_user.id)
        .first()
    )
    
    if existing:
        # Update existing reaction
        existing.reaction_type = payload.reaction_type
    else:
        # Create new reaction
        reaction = Reaction(
            post_id=post_id,
            user_id=current_user.id,
            reaction_type=payload.reaction_type,
        )
        db.add(reaction)
    
    db.commit()
    db.refresh(post)
    
    # Return updated post
    author = build_author_info(
        post.user,
        post.is_anonymous,
        post.id,
        current_user.id
    )
    
    reactions = post.reactions
    reaction_summary = build_reaction_summary(reactions)
    user_reaction = get_user_reaction(reactions, current_user.id)
    
    return PostResponse(
        id=post.id,
        title=post.title,
        content=post.content,
        category=post.category,
        author=author,
        comment_count=len(post.comments),
        reactions=reaction_summary,
        user_reaction=user_reaction,
        is_author=post.user_id == current_user.id,  # Check if current user is the author
        created_at=post.created_at,
        updated_at=post.updated_at,
    )


@router.delete("/posts/{post_id}/react")
def remove_reaction(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove the current user's reaction from a post."""
    reaction = (
        db.query(Reaction)
        .filter(Reaction.post_id == post_id, Reaction.user_id == current_user.id)
        .first()
    )
    
    if reaction:
        db.delete(reaction)
        db.commit()
    
    return {"message": "Reaction removed"}


@router.delete("/posts/{post_id}")
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a post. Only the author can delete their own post."""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Check if current user is the author
    if post.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own posts")
    
    # Delete all comments first (cascade delete)
    for comment in post.comments:
        db.delete(comment)
    
    # Delete all reactions
    for reaction in post.reactions:
        db.delete(reaction)
    
    # Delete the post
    db.delete(post)
    db.commit()
    
    return {"message": "Post deleted successfully"}
