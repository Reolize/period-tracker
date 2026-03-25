#!/usr/bin/env python3
"""
Create Admin User Script

This script creates a new admin user or upgrades an existing user to admin.
Run this from the backend directory: python create_admin.py
"""

import sys
import os

# Add the current directory to Python path to allow imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User
from app.models.notification import Notification, NotificationSetting

def create_admin():
    """Create or upgrade a user to admin."""
    
    print("=" * 50)
    print("   Create Admin Account")
    print("=" * 50)
    print()
    
    # Get input from user
    email = input("Enter admin email: ").strip()
    password = input("Enter admin password: ").strip()
    
    # Validate input
    if not email or not password:
        print("\n❌ Error: Email and password are required!")
        return
    
    if len(password) < 8:
        print("\n❌ Error: Password must be at least 8 characters long!")
        return
    
    # Create database session
    db = SessionLocal()
    
    try:
        # Check if user exists
        existing_user = db.query(User).filter(User.email == email).first()
        
        if existing_user:
            # Update existing user to admin
            existing_user.is_admin = True
            existing_user.password_hash = hash_password(password)
            db.commit()
            print(f"\n✅ Admin account updated successfully!")
            print(f"   Email: {email}")
            print(f"   Status: Existing user upgraded to admin")
        else:
            # Create new admin user
            new_user = User(
                email=email,
                password_hash=hash_password(password),
                is_admin=True
            )
            db.add(new_user)
            db.commit()
            print(f"\n✅ Admin account created successfully!")
            print(f"   Email: {email}")
            print(f"   Status: New admin user created")
        
        print("\n" + "=" * 50)
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    create_admin()
