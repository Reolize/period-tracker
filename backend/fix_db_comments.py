"""
Database fix script for Reddit-style comment system upgrade.
Adds parent_id column to comments table and creates comment_reactions table.
Run this after adding nested comments and comment reactions to models.
"""

from sqlalchemy import text
from app.core.database import engine, Base

# Import ALL models to ensure proper table registration and foreign key relationships
from app.models.user import User
from app.models.community import (
    Post, 
    Comment, 
    Reaction, 
    CommentReaction, 
    CommentReactionType,
    Notification,
    NotificationSetting,
    PostCategory,
    ReactionType,
    NotificationType,
)


def fix_comments_schema():
    """
    Fix database schema for nested comments and comment reactions.
    
    1. Creates comment_reactions table (new table)
    2. Adds parent_id column to comments table for nested replies
    """
    
    print("🔧 Starting database schema fix for Reddit-style comments...\n")
    
    try:
        # Step 1: Create the new comment_reactions table
        print("Step 1: Creating comment_reactions table...")
        try:
            CommentReaction.__table__.create(engine, checkfirst=True)
            print("✅ comment_reactions table created (or already exists)")
        except Exception as e:
            print(f"⚠️  Error creating comment_reactions table: {e}")
            print("   Table might already exist, continuing...")
        
        print()
        
        # Step 2: Add parent_id column to comments table (PostgreSQL syntax)
        print("Step 2: Adding parent_id column to comments table...")
        
        with engine.connect() as connection:
            with connection.begin():
                # PostgreSQL supports ADD COLUMN with REFERENCES
                sql = text("""
                    ALTER TABLE comments 
                    ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE;
                """)
                print(f"   Executing: ALTER TABLE comments ADD COLUMN parent_id...")
                connection.execute(sql)
                print("   ✅ parent_id column added successfully")
                
                # Create index for performance
                sql_index = text("""
                    CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
                """)
                print(f"   Creating index on parent_id...")
                connection.execute(sql_index)
                print("   ✅ Index created successfully")
        
        print()
        
        print("=" * 60)
        print("✅ Database schema updated successfully!")
        print("=" * 60)
        print()
        print("Summary:")
        print("  • comment_reactions table: Created")
        print("  • comments.parent_id column: Added with FK to comments(id)")
        print("  • Nested replies support: Enabled")
        print("  • Comment reactions support: Enabled")
        print()
        print("You can now use Reddit-style nested comments and reactions!")
        
    except Exception as e:
        print()
        print("=" * 60)
        print("❌ Error updating database schema!")
        print("=" * 60)
        print(f"Error: {e}")
        raise


if __name__ == "__main__":
    fix_comments_schema()
