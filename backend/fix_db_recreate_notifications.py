"""
Database Recreation Script: Notifications Table
Drops and recreates the notifications table with correct schema

Run: python fix_db_recreate_notifications.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.core.database import DATABASE_URL, engine

def recreate_notifications_table():
    """Drop and recreate notifications table with correct schema."""
    print("🔧 Recreating notifications table...")
    
    with engine.connect() as conn:
        # Step 1: Drop existing table
        print("   Dropping existing notifications table...")
        conn.execute(text("DROP TABLE IF EXISTS notifications CASCADE"))
        conn.commit()
        print("   ✓ Old table dropped")
        
        # Step 2: Create new table with correct schema
        print("   Creating new notifications table...")
        conn.execute(text("""
            CREATE TABLE notifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
                type VARCHAR(20) NOT NULL,
                is_read BOOLEAN DEFAULT FALSE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
            )
        """))
        conn.commit()
        print("   ✓ Table created")
        
        # Step 3: Create indexes
        print("   Creating indexes...")
        conn.execute(text("CREATE INDEX idx_notifications_user_id ON notifications(user_id)"))
        conn.execute(text("CREATE INDEX idx_notifications_sender_id ON notifications(sender_id)"))
        conn.execute(text("CREATE INDEX idx_notifications_post_id ON notifications(post_id)"))
        conn.execute(text("CREATE INDEX idx_notifications_is_read ON notifications(is_read)"))
        conn.execute(text("CREATE INDEX idx_notifications_created_at ON notifications(created_at)"))
        conn.commit()
        print("   ✓ Indexes created")
        
        # Step 4: Verify table structure
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
        
        # Step 5: Verify foreign keys
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
        
        # Step 6: Verify indexes
        print("\n📊 Verifying indexes...")
        result = conn.execute(text("""
            SELECT indexname, indexdef
            FROM pg_indexes
            WHERE tablename = 'notifications'
        """))
        
        indexes = result.fetchall()
        print("   Indexes:")
        for idx in indexes:
            print(f"      - {idx[0]}")

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
        print("\nYou can now restart the backend server.")
        print("The notifications table is ready for use.")
        
    except Exception as e:
        print(f"\n❌ Recreation failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
