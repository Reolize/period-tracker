"""
Database Patch Script: Add missing columns to notifications table
Fixes: column notifications.sender_id does not exist

Run: python fix_db_patch_sender_id.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, JSON, ForeignKey, Index, text
from sqlalchemy.orm import sessionmaker
from app.core.database import DATABASE_URL, Base, engine

def patch_notifications_table():
    """Add missing columns to notifications table."""
    print("🔧 Patching notifications table...")
    
    with engine.connect() as conn:
        # Check if sender_id column exists
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'notifications' AND column_name = 'sender_id'
        """))
        
        if result.fetchone() is None:
            print("   Adding sender_id column...")
            conn.execute(text("""
                ALTER TABLE notifications 
                ADD COLUMN sender_id INTEGER NOT NULL DEFAULT 1
            """))
            conn.commit()
            
            # Add foreign key constraint
            try:
                conn.execute(text("""
                    ALTER TABLE notifications 
                    ADD CONSTRAINT fk_notifications_sender 
                    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
                """))
                conn.commit()
                print("   ✓ Foreign key constraint added for sender_id")
            except Exception as e:
                print(f"   ⚠️ Could not add foreign key (might already exist or constraint issue): {e}")
            
            # Create index for sender_id
            try:
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_notifications_sender_id 
                    ON notifications(sender_id)
                """))
                conn.commit()
                print("   ✓ Index created for sender_id")
            except Exception as e:
                print(f"   ⚠️ Could not create index: {e}")
            
            print("   ✓ sender_id added successfully")
        else:
            print("   ✓ sender_id already exists")
        
        # Verify all columns exist
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'notifications'
            ORDER BY ordinal_position
        """))
        
        columns = [row[0] for row in result.fetchall()]
        print(f"\n📋 Current notifications columns: {columns}")
        
        # Check for other potential missing columns
        expected_columns = ['id', 'user_id', 'sender_id', 'post_id', 'type', 'is_read', 'created_at']
        missing = [col for col in expected_columns if col not in columns]
        
        if missing:
            print(f"⚠️  Missing columns detected: {missing}")
        else:
            print("✅ All expected columns present")

def verify_foreign_keys():
    """Verify foreign key constraints exist."""
    print("\n🔧 Verifying foreign key constraints...")
    
    with engine.connect() as conn:
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
        
        fk_constraints = result.fetchall()
        if fk_constraints:
            print("   Foreign key constraints:")
            for fk in fk_constraints:
                print(f"      - {fk[0]}: {fk[1]} -> {fk[2]}.{fk[3]}")
        else:
            print("   ⚠️ No foreign key constraints found")

def main():
    """Run all patches."""
    print("=" * 60)
    print("🚀 Database Patch Script: notifications table")
    print("=" * 60)
    print(f"\nDatabase URL: {DATABASE_URL}")
    print()
    
    try:
        patch_notifications_table()
        verify_foreign_keys()
        
        print("\n" + "=" * 60)
        print("✅ Patch completed successfully!")
        print("=" * 60)
        print("\nYou can now restart the backend server and test the API.")
        
    except Exception as e:
        print(f"\n❌ Patch failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
