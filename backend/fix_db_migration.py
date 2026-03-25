#!/usr/bin/env python3
"""
Database Migration Script - Add is_admin column to users table

This script runs raw SQL to add the missing column to existing database.
Run this from the backend directory: python fix_db_migration.py
"""

import sys
import os

# Add the current directory to Python path to allow imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.core.database import engine


def migrate_database():
    """Add is_admin column to users table if it doesn't exist."""
    
    print("Running database migration...")
    print()
    
    with engine.connect() as connection:
        # Execute raw SQL to add the column
        connection.execute(text("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
        """))
        connection.commit()
    
    print("✅ Database updated!")
    print("   - Column 'is_admin' added to 'users' table")
    print()
    print("You can now restart the FastAPI server.")


if __name__ == "__main__":
    migrate_database()
