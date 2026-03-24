import sys
import os
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

# Add the project root to sys.path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.user import User
from app.models.notification import Notification


def seed_notifications():
    db: Session = SessionLocal()
    try:
        # 1. Fetch all users from database
        users = db.query(User).all()
        
        if not users:
            print("❌ No users found in database. Please create users first.")
            return
        
        print(f"Found {len(users)} user(s) in database.")
        
        # 2. Define mock notifications (in English)
        base_time = datetime.utcnow()
        
        mock_notifications = [
            # Type 1: Period prediction (cycle) - Unread with action button
            {
                "type": "cycle",
                "title": "Period coming soon",
                "message": "Your period is expected to start in 2 days. Prepare your essentials and stay comfortable!",
                "is_read": False,
                "action_label": "Log Symptoms",
                "action_url": "/dashboard",
                "time_offset": timedelta(hours=2),  # 2 hours ago
            },
            # Type 2: AI Insight - Unread
            {
                "type": "ai_insight",
                "title": "AI Health Insight",
                "message": "We noticed your cycle has become more regular over the past 3 months. Great job tracking consistently!",
                "is_read": False,
                "action_label": None,
                "action_url": None,
                "time_offset": timedelta(days=1),  # 1 day ago
            },
            # Type 3: Reminder - Read (to test UI separation)
            {
                "type": "reminder",
                "title": "Daily Reminder",
                "message": "Don't forget to log your symptoms for today. Tracking regularly helps improve predictions!",
                "is_read": True,
                "action_label": None,
                "action_url": None,
                "time_offset": timedelta(days=1, hours=5),  # 1 day, 5 hours ago
            },
            # Type 4: Late period alert (cycle) - Unread
            {
                "type": "cycle",
                "title": "Late Period Alert",
                "message": "Your period is 3 days late. This might be normal due to stress or lifestyle changes, but consider taking a pregnancy test if concerned.",
                "is_read": False,
                "action_label": "Update Cycle",
                "action_url": "/dashboard",
                "time_offset": timedelta(days=2),  # 2 days ago
            },
            # Type 5: Fertility window - Unread with action
            {
                "type": "fertility",
                "title": "Fertile Window Approaching",
                "message": "Your fertile window is expected to start in 2 days. If you're trying to conceive, now is a good time to prepare.",
                "is_read": False,
                "action_label": "View Calendar",
                "action_url": "/trends",
                "time_offset": timedelta(hours=5),  # 5 hours ago
            },
        ]
        
        total_created = 0
        
        # 3. Create notifications for each user
        for user in users:
            print(f"\nCreating notifications for user: {user.email} (ID: {user.id})")
            
            # Check if user already has notifications (optional: skip if exists)
            existing_count = db.query(Notification).filter(
                Notification.user_id == user.id
            ).count()
            
            if existing_count > 0:
                print(f"  User already has {existing_count} notification(s). Skipping...")
                continue
            
            for mock in mock_notifications:
                notification = Notification(
                    user_id=user.id,
                    type=mock["type"],
                    title=mock["title"],
                    message=mock["message"],
                    is_read=mock["is_read"],
                    action_label=mock["action_label"],
                    action_url=mock["action_url"],
                    # Note: created_at uses server_default, but we can simulate different times
                )
                db.add(notification)
                total_created += 1
            
            print(f"  ✓ Created {len(mock_notifications)} notifications")
        
        # 4. Commit all changes
        db.commit()
        
        print(f"\n✅ Notification Seeding Completed Successfully!")
        print(f"   Total users processed: {len(users)}")
        print(f"   Total notifications created: {total_created}")
        
        if total_created > 0:
            print(f"\n📋 Notification Summary:")
            print(f"   - Period prediction (unread, with action button)")
            print(f"   - AI Insight (unread)")
            print(f"   - Daily Reminder (read - for testing UI separation)")
            print(f"   - Late Period Alert (unread)")
            print(f"   - Fertility Window (unread, with action button)")
        
    except Exception as e:
        print(f"❌ Error seeding notifications: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_notifications()
