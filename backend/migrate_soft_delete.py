#!/usr/bin/env python3
"""
Database migration script to add is_deleted column to comments table.
Run this to enable soft delete functionality for comments.
"""

from sqlalchemy import text
from app.core.database import engine
from app.models.community import Comment


def add_is_deleted_column():
    """Add is_deleted column to comments table for soft delete support."""
    print("=" * 60)
    print("Adding is_deleted column to comments table")
    print("=" * 60)
    print()
    
    try:
        with engine.connect() as connection:
            with connection.begin():
                # Check if column already exists (PostgreSQL)
                check_sql = text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'comments' AND column_name = 'is_deleted';
                """)
                result = connection.execute(check_sql)
                column_exists = result.fetchone() is not None
                
                if column_exists:
                    print("✅ is_deleted column already exists, skipping...")
                else:
                    # Add is_deleted column with default FALSE
                    sql = text("""
                        ALTER TABLE comments 
                        ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE NOT NULL;
                    """)
                    print("Adding is_deleted column...")
                    connection.execute(sql)
                    print("✅ is_deleted column added successfully")
                    
                    # Create index for performance
                    sql_index = text("""
                        CREATE INDEX IF NOT EXISTS idx_comments_is_deleted ON comments(is_deleted);
                    """)
                    print("Creating index on is_deleted...")
                    connection.execute(sql_index)
                    print("✅ Index created successfully")
        
        print()
        print("=" * 60)
        print("✅ Migration completed successfully!")
        print("=" * 60)
        print()
        print("Summary:")
        print("  • is_deleted column: Added")
        print("  • Soft delete support: Enabled")
        print("  • Index on is_deleted: Created")
        print()
        print("Comments can now be soft-deleted while preserving the reply tree.")
        
    except Exception as e:
        print()
        print("=" * 60)
        print("❌ Migration failed!")
        print("=" * 60)
        print(f"Error: {e}")
        raise


if __name__ == "__main__":
    add_is_deleted_column()
