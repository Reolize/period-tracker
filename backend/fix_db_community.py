"""
Database migration script for Community Board feature.
Creates posts, comments, and reactions tables.
"""
from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.sql import func
import sys
import os

# Add parent directory to path to import models
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

DATABASE_URL = "postgresql://postgres:password@localhost:5433/period_tracker"

def create_community_tables():
    """Create community board tables."""
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    metadata = MetaData()
    
    # Define the tables
    posts = Table(
        'posts',
        metadata,
        Column('id', Integer, primary_key=True, index=True),
        Column('user_id', Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        Column('title', String(200), nullable=False),
        Column('content', Text, nullable=False),
        Column('category', String(50), nullable=False, server_default='general'),
        Column('is_anonymous', Boolean, default=False, nullable=False, server_default='false'),
        Column('created_at', DateTime(timezone=True), server_default=func.now(), nullable=False),
        Column('updated_at', DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False),
    )
    
    comments = Table(
        'comments',
        metadata,
        Column('id', Integer, primary_key=True, index=True),
        Column('post_id', Integer, ForeignKey('posts.id', ondelete='CASCADE'), nullable=False, index=True),
        Column('user_id', Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        Column('content', Text, nullable=False),
        Column('is_anonymous', Boolean, default=False, nullable=False, server_default='false'),
        Column('created_at', DateTime(timezone=True), server_default=func.now(), nullable=False),
        Column('updated_at', DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False),
    )
    
    reactions = Table(
        'reactions',
        metadata,
        Column('id', Integer, primary_key=True, index=True),
        Column('post_id', Integer, ForeignKey('posts.id', ondelete='CASCADE'), nullable=False, index=True),
        Column('user_id', Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        Column('reaction_type', String(20), nullable=False),
        Column('created_at', DateTime(timezone=True), server_default=func.now(), nullable=False),
        UniqueConstraint('post_id', 'user_id', name='uq_reactions_post_user'),
    )
    
    # Create all tables
    print("Creating community board tables...")
    metadata.create_all(engine)
    print("✅ Community tables created successfully!")
    print("  - posts")
    print("  - comments")
    print("  - reactions")

if __name__ == "__main__":
    try:
        create_community_tables()
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
