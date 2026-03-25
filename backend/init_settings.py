#!/usr/bin/env python3
"""
Initialize Default System Settings Script

This script initializes the default system settings in the database.
Run this from the backend directory: python init_settings.py
"""

import sys
import os

# Add the current directory to Python path to allow imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import notification models first to ensure they're registered before User model
from app.models import notification  # noqa: F401
from app.models import system_setting  # noqa: F401

from app.core.database import SessionLocal
from app.api.admin import initialize_default_settings


def init_settings():
    """Initialize default system settings."""
    
    print("Initializing default system settings...")
    print()
    
    # Create database session
    db = SessionLocal()
    
    try:
        # Initialize default settings
        count = initialize_default_settings(db)
        
        if count > 0:
            print(f"✅ Default system settings initialized successfully!")
            print(f"   Created {count} new settings.")
        else:
            print(f"✅ All default system settings already exist.")
        
        print()
        print("You can now use the Admin Dashboard to manage settings.")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    init_settings()
