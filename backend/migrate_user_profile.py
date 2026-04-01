"""
Migration script to add username and avatar_url columns to users table.
Run this script from the backend directory:
    python migrate_user_profile.py
"""

import os
import sys

# Add the app directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.core.database import engine, SessionLocal

def migrate():
    """Add username and avatar_url columns to users table."""
    print("[MIGRATION] Starting user profile fields migration...")
    
    with engine.connect() as conn:
        # Check if columns already exist
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'username'
        """))
        
        username_exists = result.fetchone() is not None
        
        if not username_exists:
            print("[MIGRATION] Adding 'username' column...")
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN username VARCHAR(50) UNIQUE
            """))
            conn.commit()
            print("[MIGRATION] ✓ 'username' column added")
        else:
            print("[MIGRATION] 'username' column already exists, skipping...")
        
        # Check if avatar_url exists
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'avatar_url'
        """))
        
        avatar_url_exists = result.fetchone() is not None
        
        if not avatar_url_exists:
            print("[MIGRATION] Adding 'avatar_url' column...")
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN avatar_url VARCHAR(500)
            """))
            conn.commit()
            print("[MIGRATION] ✓ 'avatar_url' column added")
        else:
            print("[MIGRATION] 'avatar_url' column already exists, skipping...")
    
    print("[MIGRATION] ✓ Migration completed successfully!")

if __name__ == "__main__":
    migrate()
