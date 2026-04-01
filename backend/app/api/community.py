"""
Community Board API - Privacy-first community sharing with empathetic reactions.
"""
from datetime import datetime, timedelta
from typing import List, Literal
import random

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, and_

from app.api.deps import get_db
from app.api.auth_deps import get_current_user
from app.models.community import Post, Comment, Reaction, PostCategory, ReactionType, Notification, NotificationType, CommentReaction, CommentReactionType
from app.models.user import User
from app.schemas.community_schema import (
    PostCreate,
    CommentCreate,
    ReactionCreate,
    PostResponse,
    PostDetailResponse,
    PostListResponse,
    CommentResponse,
    CommentReactionCreate,
    CommentReactionSummary,
    AuthorInfo,
    ReactionSummary,
    NotificationResponse,
    NotificationListResponse,
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
            username=None,
            avatar_url=None,
            is_anonymous=True,
            profile_pic_url=None,
            badges=None
        )
    else:
        return AuthorInfo(
            id=user.id,
            display_name=user.username or user.email.split("@")[0],  # Use username if available, otherwise email prefix
            username=user.username,
            avatar_url=user.avatar_url,
            is_anonymous=False,
            profile_pic_url=user.profile_pic_url,
            badges=user.badges or []
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


def get_user_comment_reaction(reactions: List[CommentReaction], user_id: int) -> CommentReactionType | None:
    """Get the current user's reaction to a comment if any."""
    for reaction in reactions:
        if reaction.user_id == user_id:
            return reaction.reaction_type
    return None


def build_comment_reaction_summary(reactions: List[CommentReaction]) -> CommentReactionSummary:
    """Build reaction summary from list of comment reactions."""
    summary = CommentReactionSummary()
    for reaction in reactions:
        if reaction.reaction_type == CommentReactionType.like:
            summary.like += 1
        elif reaction.reaction_type == CommentReactionType.heart:
            summary.heart += 1
        elif reaction.reaction_type == CommentReactionType.hug:
            summary.hug += 1
        elif reaction.reaction_type == CommentReactionType.support:
            summary.support += 1
    return summary


def build_comment_response(
    comment: Comment,
    current_user_id: int,
    db: Session,  # Add db session parameter for fresh user queries
    include_replies: bool = True,
    reply_depth: int = 0,
    max_reply_depth: int = 10,
    _visited_ids: set | None = None  # Track visited comments to prevent cycles
) -> CommentResponse:
    """Build a comment response with optional nested replies."""
    # Initialize visited set on first call
    if _visited_ids is None:
        _visited_ids = set()
    
    # Prevent infinite recursion - skip if already visited
    if comment.id in _visited_ids:
        # Query fresh user data for cycle break case too
        fresh_user = db.query(User).filter(User.id == comment.user_id).first() if comment.user_id else None
        author = build_author_info(
            fresh_user or comment.user,
            comment.is_anonymous,
            comment.id,
            current_user_id
        )
        return CommentResponse(
            id=comment.id,
            content=comment.content,
            author=author,
            created_at=comment.created_at,
            parent_id=comment.parent_id,
            replies=[],  # Empty to break cycle
            reactions=CommentReactionSummary(),
            user_reaction=None,
            reply_count=0,
            is_deleted=comment.is_deleted,
        )
    
    _visited_ids.add(comment.id)
    
    # Query FRESH user data from database to ensure latest avatar/username
    fresh_user = db.query(User).filter(User.id == comment.user_id).first() if comment.user_id else None
    author = build_author_info(
        fresh_user or comment.user,
        comment.is_anonymous,
        comment.id,
        current_user_id
    )
    
    # Build reactions summary
    reaction_summary = build_comment_reaction_summary(comment.reactions)
    user_reaction = get_user_comment_reaction(comment.reactions, current_user_id)
    
    # Count total replies - safely handle unloaded relationships
    def count_replies(c: Comment, visited: set) -> int:
        if c.id in visited:
            return 0  # Prevent double counting in cycles
        visited.add(c.id)
        count = len(c.replies) if c.replies else 0
        for reply in (c.replies or []):
            count += count_replies(reply, visited.copy())
        return count
    
    reply_count = count_replies(comment, set())
    
    # Build nested replies if requested and within depth limit
    reply_responses = []
    if include_replies and reply_depth < max_reply_depth:
        for reply in sorted(comment.replies or [], key=lambda r: r.created_at):
            reply_responses.append(build_comment_response(
                reply,
                current_user_id,
                db,  # Pass db session for fresh queries
                include_replies=True,
                reply_depth=reply_depth + 1,
                max_reply_depth=max_reply_depth,
                _visited_ids=_visited_ids.copy()  # Pass copy to isolate branches
            ))
    
    return CommentResponse(
        id=comment.id,
        content=comment.content,
        author=author,
        created_at=comment.created_at,
        parent_id=comment.parent_id,
        replies=reply_responses,
        reactions=reaction_summary,
        user_reaction=user_reaction,
        reply_count=reply_count,
        is_deleted=comment.is_deleted,
    )


@router.get("/posts", response_model=PostListResponse)
def list_posts(
    category: PostCategory | None = Query(None, description="Filter by category"),
    sort_by: Literal["latest", "most_reactions", "most_comments"] = Query("latest", description="Sort posts by"),
    timeframe: Literal["1d", "7d", "30d", "all"] = Query("all", description="Filter by timeframe"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=50, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List community posts with privacy-aware author info, sorting and filtering.
    Anonymous posts show cute animal names instead of real identities.
    """
    query = db.query(Post)
    
    if category:
        query = query.filter(Post.category == category)
    
    # Apply timeframe filter
    if timeframe != "all":
        now = datetime.utcnow()
        if timeframe == "1d":
            cutoff = now - timedelta(days=1)
        elif timeframe == "7d":
            cutoff = now - timedelta(days=7)
        elif timeframe == "30d":
            cutoff = now - timedelta(days=30)
        query = query.filter(Post.created_at >= cutoff)
    
    total = query.count()
    
    # Apply sorting
    if sort_by == "latest":
        query = query.order_by(desc(Post.created_at))
    elif sort_by == "most_reactions":
        # Count reactions per post and sort
        query = query.outerjoin(Reaction).group_by(Post.id).order_by(desc(func.count(Reaction.id)))
    elif sort_by == "most_comments":
        # Count comments per post and sort
        query = query.outerjoin(Comment).group_by(Post.id).order_by(desc(func.count(Comment.id)))
    
    posts = (
        query
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
        
        # Build comment responses - get latest 2 top-level comments only (no replies)
        comment_responses = []
        top_level_comments = [c for c in post.comments if c.parent_id is None]
        latest_comments = sorted(top_level_comments, key=lambda c: c.created_at, reverse=True)[:2]
        for comment in latest_comments:
            comment_responses.append(build_comment_response(
                comment,
                current_user.id,
                db,  # Pass db session for fresh user data
                include_replies=False,  # Don't include nested replies in feed
            ))
        
        # Count only non-deleted comments
        active_comments = [c for c in post.comments if not c.is_deleted]
        
        post_responses.append(PostResponse(
            id=post.id,
            title=post.title,
            content=post.content,
            category=post.category,
            author=author,
            comment_count=len(active_comments),
            comments=comment_responses,
            reactions=reaction_summary,
            user_reaction=user_reaction,
            is_author=post.user_id == current_user.id,
            created_at=post.created_at,
            updated_at=post.updated_at,
        ))
    
    return PostListResponse(
        posts=post_responses,
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/my-posts", response_model=PostListResponse)
def list_my_posts(
    sort_by: Literal["latest", "most_reactions", "most_comments"] = Query("latest", description="Sort posts by"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=50, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List posts created by the current user."""
    query = db.query(Post).filter(Post.user_id == current_user.id)
    
    total = query.count()
    
    # Apply sorting
    if sort_by == "latest":
        query = query.order_by(desc(Post.created_at))
    elif sort_by == "most_reactions":
        query = query.outerjoin(Reaction).group_by(Post.id).order_by(desc(func.count(Reaction.id)))
    elif sort_by == "most_comments":
        query = query.outerjoin(Comment).group_by(Post.id).order_by(desc(func.count(Comment.id)))
    
    posts = (
        query
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
        
        # Build comment responses - get latest 2 top-level comments only (no replies)
        comment_responses = []
        top_level_comments = [c for c in post.comments if c.parent_id is None]
        latest_comments = sorted(top_level_comments, key=lambda c: c.created_at, reverse=True)[:2]
        for comment in latest_comments:
            comment_responses.append(build_comment_response(
                comment,
                current_user.id,
                db,  # Pass db session for fresh user data
                include_replies=False,  # Don't include nested replies in feed
            ))
        
        # Count only non-deleted comments
        active_comments = [c for c in post.comments if not c.is_deleted]
        
        post_responses.append(PostResponse(
            id=post.id,
            title=post.title,
            content=post.content,
            category=post.category,
            author=author,
            comment_count=len(active_comments),
            comments=comment_responses,
            reactions=reaction_summary,
            user_reaction=user_reaction,
            is_author=True,  # Always true for user's own posts
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
    # If user has anonymous mode enabled in their profile, force anonymous posts
    is_anonymous = payload.is_anonymous or current_user.is_anonymous_mode
    
    print(f"📝 [create_post] User {current_user.id} creating post: title='{payload.title[:50]}...', category={payload.category}, anonymous={is_anonymous}")
    
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
        is_anonymous=is_anonymous,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    print(f"✅ [create_post] Post {post.id} created successfully")
    
    author = build_author_info(
        current_user,
        is_anonymous,
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
    
    # Build author info for post with FRESH user data
    fresh_post_user = db.query(User).filter(User.id == post.user_id).first() if post.user_id else None
    post_author = build_author_info(
        fresh_post_user or post.user,
        post.is_anonymous,
        post.id,
        current_user.id
    )
    
    # Build nested comment responses - only top-level comments with their replies
    comment_responses = []
    top_level_comments = [c for c in post.comments if c.parent_id is None]
    for comment in sorted(top_level_comments, key=lambda c: c.created_at):
        comment_responses.append(build_comment_response(
            comment,
            current_user.id,
            db,  # Pass db session for fresh user data
            include_replies=True,
            max_reply_depth=10
        ))
    
    reactions = post.reactions
    reaction_summary = build_reaction_summary(reactions)
    user_reaction = get_user_reaction(reactions, current_user.id)
    
    # Count only non-deleted comments
    active_comment_count = len([c for c in post.comments if not c.is_deleted])
    
    return PostDetailResponse(
        id=post.id,
        title=post.title,
        content=post.content,
        category=post.category,
        author=post_author,
        comment_count=active_comment_count,
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
    
    # If user has anonymous mode enabled in their profile, force anonymous comments
    is_anonymous = payload.is_anonymous or current_user.is_anonymous_mode
    
    comment = Comment(
        post_id=post_id,
        user_id=current_user.id,
        content=payload.content,
        is_anonymous=is_anonymous,
        parent_id=payload.parent_id,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    
    # Create notification for post author or comment parent (if not replying to own comment)
    if payload.parent_id:
        # This is a reply - notify the parent comment author
        parent_comment = db.query(Comment).filter(Comment.id == payload.parent_id).first()
        if parent_comment and parent_comment.user_id != current_user.id:
            sender_name = current_user.email.split("@")[0]
            notification = Notification(
                user_id=parent_comment.user_id,
                sender_id=current_user.id,
                post_id=post_id,
                type=NotificationType.comment,
                title="New reply to your comment",
                message=f"{sender_name} replied to your comment",
                link=f"/community/post/{post_id}"
            )
            db.add(notification)
            db.commit()
    else:
        # This is a top-level comment - notify post author
        if post.user_id != current_user.id:
            sender_name = current_user.email.split("@")[0]
            notification = Notification(
                user_id=post.user_id,
                sender_id=current_user.id,
                post_id=post_id,
                type=NotificationType.comment,
                title="New comment on your post",
                message=f"{sender_name} commented on your post",
                link=f"/community/post/{post_id}"
            )
            db.add(notification)
            db.commit()
    
    return build_comment_response(comment, current_user.id, db, include_replies=False)


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
    
    # Create notification for post author (if new reaction and not reacting to own post)
    if not existing and post.user_id != current_user.id:
        sender_name = current_user.email.split("@")[0]
        reaction_emoji = {
            ReactionType.hug: "🫂",
            ReactionType.me_too: "✋",
            ReactionType.support: "💪",
            ReactionType.celebrate: "🎉"
        }.get(payload.reaction_type, "❤️")
        notification = Notification(
            user_id=post.user_id,
            sender_id=current_user.id,
            post_id=post_id,
            type=NotificationType.reaction,
            title="New reaction on your post",
            message=f"{sender_name} reacted {reaction_emoji} to your post",
            link=f"/community?post={post_id}"
        )
        db.add(notification)
        db.commit()
    
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
    
    # Count only non-deleted comments for the response
    active_comment_count = len([c for c in post.comments if not c.is_deleted])
    
    return PostResponse(
        id=post.id,
        title=post.title,
        content=post.content,
        category=post.category,
        author=author,
        comment_count=active_comment_count,
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


# ============== Comment Reaction Endpoints ==============

@router.post("/comments/{comment_id}/react", response_model=CommentResponse)
def react_to_comment(
    comment_id: int,
    payload: CommentReactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Add or update a reaction to a comment.
    Users can only have one reaction per comment - adding a new one replaces the old.
    """
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Check if user already has a reaction
    existing = (
        db.query(CommentReaction)
        .filter(CommentReaction.comment_id == comment_id, CommentReaction.user_id == current_user.id)
        .first()
    )
    
    if existing:
        # Update existing reaction
        existing.reaction_type = payload.reaction_type
    else:
        # Create new reaction
        reaction = CommentReaction(
            comment_id=comment_id,
            user_id=current_user.id,
            reaction_type=payload.reaction_type,
        )
        db.add(reaction)
    
    db.commit()
    db.refresh(comment)
    
    return build_comment_response(comment, current_user.id, db, include_replies=True)


@router.delete("/comments/{comment_id}/react", response_model=CommentResponse)
def remove_comment_reaction(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove the current user's reaction from a comment."""
    reaction = (
        db.query(CommentReaction)
        .filter(CommentReaction.comment_id == comment_id, CommentReaction.user_id == current_user.id)
        .first()
    )
    
    if reaction:
        db.delete(reaction)
        db.commit()
    
    # Return updated comment
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    return build_comment_response(comment, current_user.id, db, include_replies=True)


@router.delete("/comments/{comment_id}", response_model=CommentResponse)
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Soft delete a comment and all its replies. Only the author can delete their own comment.
    The comment and all replies are marked as deleted but remain in the database to preserve tree structure.
    """
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Check if current user is the author (or admin - could be extended)
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own comments")
    
    # Recursive function to soft delete all replies
    def delete_replies_recursive(parent_comment: Comment):
        for reply in parent_comment.replies or []:
            # Soft delete this reply
            reply.is_deleted = True
            reply.content = ""
            # Recursively delete nested replies
            delete_replies_recursive(reply)
    
    # Soft delete all replies first
    delete_replies_recursive(comment)
    
    # Soft delete the parent comment
    comment.is_deleted = True
    comment.content = ""  # Clear content for privacy
    db.commit()
    db.refresh(comment)
    
    return build_comment_response(comment, current_user.id, db, include_replies=True)


# ============== Notification Endpoints ==============

@router.get("/notifications", response_model=NotificationListResponse)
def list_notifications(
    unread_only: bool = Query(False, description="Only return unread notifications"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=50, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List notifications for the current user."""
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    
    if unread_only:
        query = query.filter(Notification.is_read == False)
    
    total = query.count()
    unread_count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()
    
    notifications = (
        query
        .order_by(desc(Notification.created_at))
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    
    notification_responses = []
    for notif in notifications:
        # Build sender info if available
        sender_name = None
        sender_profile_pic = None
        if notif.sender:
            sender_name = notif.sender.email.split("@")[0]
            sender_profile_pic = notif.sender.profile_pic_url
        
        # Build post info if available
        post_title = None
        if notif.post:
            post_title = notif.post.title[:50] + "..." if len(notif.post.title) > 50 else notif.post.title
        
        notification_responses.append(NotificationResponse(
            id=notif.id,
            sender_id=notif.sender_id,
            sender_name=sender_name,
            sender_profile_pic=sender_profile_pic,
            post_id=notif.post_id,
            post_title=post_title,
            type=notif.type,
            title=notif.title,
            message=notif.message,
            link=notif.link,
            is_read=notif.is_read,
            created_at=notif.created_at,
        ))
    
    return NotificationListResponse(
        notifications=notification_responses,
        unread_count=unread_count,
        total=total,
    )


@router.put("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a notification as read."""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.is_read = True
    db.commit()
    
    return {"message": "Notification marked as read"}


@router.put("/notifications/read-all")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark all notifications as read for the current user."""
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    
    return {"message": "All notifications marked as read"}
