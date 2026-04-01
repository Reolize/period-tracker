"""
Database Migration Script: Recreate notifications table from SQLAlchemy model
Drops and recreates the notifications table to match the current Notification model exactly

Run: python fix_db_unified_notifications.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.core.database import DATABASE_URL, engine
from app.models.community import Notification, Post
from app.models.user import User

def recreate_notifications_table():
    """Drop and recreate notifications table using SQLAlchemy model."""
    print("🔧 Recreating notifications table from SQLAlchemy model...")
    
    with engine.connect() as conn:
        # Step 1: Drop existing table
        print("   Dropping existing notifications table...")
        conn.execute(text("DROP TABLE IF EXISTS notifications CASCADE"))
        conn.commit()
        print("   ✓ Old table dropped")
        
        # Step 2: Create table from SQLAlchemy model
        print("   Creating new notifications table from model...")
        Notification.__table__.create(engine)
        print("   ✓ Table created from model")
        
        # Step 3: Verify table structure
        print("\n📋 Verifying table structure...")
        result = conn.execute(text("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'notifications'
            ORDER BY ordinal_position
        """))
        
        columns = result.fetchall()
        print("   Table columns:")
        for col in columns:
            print(f"      - {col[0]}: {col[1]} (nullable: {col[2]})")
        
        # Step 4: Verify foreign key constraints
        print("\n🔑 Verifying foreign key constraints...")
        result = conn.execute(text("""
            SELECT
                tc.constraint_name,
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
                AND tc.table_name = 'notifications'
        """))
        
        fks = result.fetchall()
        print("   Foreign keys:")
        for fk in fks:
            print(f"      - {fk[0]}: {fk[1]} -> {fk[2]}.{fk[3]}")

def main():
    """Run the recreation script."""
    print("=" * 60)
    print("🚀 Database Recreation Script: notifications table")
    print("=" * 60)
    print(f"\nDatabase URL: {DATABASE_URL}")
    print("\n⚠️  WARNING: This will DROP the existing notifications table!")
    print("   All existing notification data will be lost.")
    print()
    
    try:
        recreate_notifications_table()
        
        print("\n" + "=" * 60)
        print("✅ Table recreated successfully!")
        print("=" * 60)
        print("\nThe notifications table now matches the SQLAlchemy model exactly.")
        print("Columns: id, user_id, sender_id, post_id, type, title, message, link, is_read, created_at")
        print("\nYou can now restart the backend server.")
        
    except Exception as e:
        print(f"\n❌ Recreation failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
