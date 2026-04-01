"""
Migration script v3: Add last_username_change column for username cooldown feature.
Run this script from the backend directory:
    python migrate_profile_v3.py
"""

import os
import sys

# Add the app directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.core.database import engine

def migrate():
    """Add last_username_change column to users table."""
    print("[MIGRATION v3] Starting profile fields migration...")
    
    with engine.connect() as conn:
        # Check if last_username_change column already exists
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'last_username_change'
        """))
        
        last_change_exists = result.fetchone() is not None
        
        if not last_change_exists:
            print("[MIGRATION v3] Adding 'last_username_change' column...")
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN last_username_change TIMESTAMP WITH TIME ZONE
            """))
            conn.commit()
            print("[MIGRATION v3] ✓ 'last_username_change' column added")
        else:
            print("[MIGRATION v3] 'last_username_change' column already exists, skipping...")
        
        # Ensure username has unique index
        result = conn.execute(text("""
            SELECT indexname 
            FROM pg_indexes 
            WHERE tablename = 'users' AND indexname = 'ix_users_username'
        """))
        
        index_exists = result.fetchone() is not None
        
        if not index_exists:
            print("[MIGRATION v3] Creating unique index on 'username'...")
            conn.execute(text("""
                CREATE UNIQUE INDEX ix_users_username ON users(username) 
                WHERE username IS NOT NULL
            """))
            conn.commit()
            print("[MIGRATION v3] ✓ Unique index on username created")
        else:
            print("[MIGRATION v3] Username index already exists, skipping...")
    
    print("[MIGRATION v3] ✓ Migration completed successfully!")

if __name__ == "__main__":
    migrate()
