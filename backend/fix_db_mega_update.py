"""
Database Migration Script for Mega Update
Adds new columns to User table and creates Notification table

Run: python fix_db_mega_update.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, JSON, ForeignKey, Index, text
from sqlalchemy.orm import sessionmaker
from app.core.database import DATABASE_URL, Base, engine
from app.models.community import NotificationType

def add_user_columns():
    """Add new columns to users table."""
    print("🔧 Adding new columns to users table...")
    
    with engine.connect() as conn:
        # Check if columns exist
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'profile_pic_url'
        """))
        
        if result.fetchone() is None:
            print("   Adding profile_pic_url column...")
            conn.execute(text("ALTER TABLE users ADD COLUMN profile_pic_url VARCHAR(500)"))
            conn.commit()
            print("   ✓ profile_pic_url added")
        else:
            print("   ✓ profile_pic_url already exists")
        
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'joined_at'
        """))
        
        if result.fetchone() is None:
            print("   Adding joined_at column...")
            conn.execute(text("ALTER TABLE users ADD COLUMN joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL"))
            conn.commit()
            print("   ✓ joined_at added")
        else:
            print("   ✓ joined_at already exists")
        
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'badges'
        """))
        
        if result.fetchone() is None:
            print("   Adding badges column...")
            conn.execute(text("ALTER TABLE users ADD COLUMN badges JSON DEFAULT '[]'"))
            conn.commit()
            print("   ✓ badges added")
        else:
            print("   ✓ badges already exists")

def create_notification_table():
    """Create notifications table."""
    print("\n🔧 Creating notifications table...")
    
    with engine.connect() as conn:
        # Check if table exists
        result = conn.execute(text("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_name = 'notifications'
            )
        """))
        
        exists = result.scalar()
        
        if not exists:
            print("   Creating notifications table...")
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
            
            # Create indexes
            conn.execute(text("CREATE INDEX idx_notifications_user_id ON notifications(user_id)"))
            conn.execute(text("CREATE INDEX idx_notifications_sender_id ON notifications(sender_id)"))
            conn.execute(text("CREATE INDEX idx_notifications_post_id ON notifications(post_id)"))
            conn.execute(text("CREATE INDEX idx_notifications_is_read ON notifications(is_read)"))
            conn.execute(text("CREATE INDEX idx_notifications_created_at ON notifications(created_at)"))
            
            conn.commit()
            print("   ✓ notifications table created")
        else:
            print("   ✓ notifications table already exists")

def migrate_data():
    """Migrate existing data if needed."""
    print("\n🔧 Migrating existing data...")
    
    with engine.connect() as conn:
        # Set joined_at for existing users who don't have it
        conn.execute(text("""
            UPDATE users 
            SET joined_at = created_at 
            WHERE joined_at IS NULL
        """))
        conn.commit()
        print("   ✓ Set joined_at for existing users")
        
        # Initialize badges as empty array for existing users
        conn.execute(text("""
            UPDATE users 
            SET badges = '[]'::json 
            WHERE badges IS NULL
        """))
        conn.commit()
        print("   ✓ Initialized badges for existing users")

def add_sample_badges():
    """Add sample badges for testing (optional)."""
    print("\n🔧 Adding sample badges (optional)...")
    
    with engine.connect() as conn:
        # Add admin badge to admin users
        conn.execute(text("""
            UPDATE users 
            SET badges = '["admin"]'::json 
            WHERE is_admin = TRUE AND (badges::text = '[]' OR badges IS NULL)
        """))
        conn.commit()
        print("   ✓ Added admin badge to admin users")

def main():
    """Run all migrations."""
    print("=" * 60)
    print("🚀 Database Migration Script for Mega Update")
    print("=" * 60)
    print(f"\nDatabase URL: {DATABASE_URL}")
    print()
    
    try:
        add_user_columns()
        create_notification_table()
        migrate_data()
        add_sample_badges()
        
        print("\n" + "=" * 60)
        print("✅ Migration completed successfully!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
