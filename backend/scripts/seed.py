import sys
import os
from datetime import date
from sqlalchemy.orm import Session

# Add the project root to sys.path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User
from app.models.cycle import Cycle
from app.models.daily_log import DailyLog, BleedingFlow
from app.models.user_setup import UserSetup

def seed_database():
    db: Session = SessionLocal()
    try:
        # 1. Define Target User
        target_email = "jane.test@example.com"
        
        print(f"Checking for existing user: {target_email}")
        user = db.query(User).filter(User.email == target_email).first()
        
        # 2. Clear old data or create new user
        if user:
            print("User found. Clearing old cycles and daily logs...")
            db.query(DailyLog).filter(DailyLog.user_id == user.id).delete()
            db.query(Cycle).filter(Cycle.user_id == user.id).delete()
            db.query(UserSetup).filter(UserSetup.user_id == user.id).delete()
            db.commit()
        else:
            print("User not found. Creating new user...")
            hashed_pw = hash_password("password123")
            user = User(email=target_email, password_hash=hashed_pw)
            db.add(user)
            db.commit()
            db.refresh(user)
            
        print(f"User ID: {user.id}")

        # 3. Create Basic UserSetup
        print("Creating UserSetup...")
        setup = UserSetup(
            user_id=user.id,
            avg_cycle_length_days=28,
            avg_period_length_days=5
        )
        db.add(setup)
        
        # 4. Define Mock Data
        # Format: (start_date, end_date, [daily_logs])
        mock_data = [
            # Oct 2025
            (date(2025, 10, 24), date(2025, 10, 28), [
                {"date": date(2025, 10, 24), "flow": "heavy", "symptoms": ["cramps"], "moods": []},
                {"date": date(2025, 10, 28), "flow": "light", "symptoms": [], "moods": []},
                {"date": date(2025, 11, 20), "flow": "none", "symptoms": ["bloating"], "moods": ["irritable"]},
            ]),
            # Nov 2025
            (date(2025, 11, 22), date(2025, 11, 26), [
                {"date": date(2025, 11, 22), "flow": "medium", "symptoms": ["back_pain"], "moods": []},
            ]),
            # Dec 2025
            (date(2025, 12, 20), date(2025, 12, 25), [
                {"date": date(2025, 12, 20), "flow": "spotting", "symptoms": [], "moods": []},
                {"date": date(2025, 12, 21), "flow": "heavy", "symptoms": ["fatigue"], "moods": []},
            ]),
            # Jan 2026
            (date(2026, 1, 19), date(2026, 1, 23), [
                {"date": date(2026, 1, 19), "flow": "medium", "symptoms": ["headache"], "moods": []},
                {"date": date(2026, 2, 14), "flow": "none", "symptoms": ["acne"], "moods": ["sad"]},
            ]),
            # Feb 2026
            (date(2026, 2, 16), date(2026, 2, 20), [
                {"date": date(2026, 2, 16), "flow": "heavy", "symptoms": ["cramps", "nausea"], "moods": []},
            ]),
        ]

        print("Inserting 5 months of Cycle & Daily Logs data...")
        
        # Calculate lengths and insert cycles
        for i in range(len(mock_data)):
            start_date, end_date, logs = mock_data[i]
            
            # Calculate period_length
            period_length = (end_date - start_date).days + 1
            
            # Calculate cycle_length (days until next cycle start)
            cycle_length = None
            if i < len(mock_data) - 1:
                next_start = mock_data[i+1][0]
                cycle_length = (next_start - start_date).days
                
            cycle = Cycle(
                user_id=user.id,
                start_date=start_date,
                end_date=end_date,
                period_length=period_length,
                cycle_length=cycle_length
            )
            db.add(cycle)
            
            # Insert Daily Logs for this cycle
            for log_data in logs:
                daily_log = DailyLog(
                    user_id=user.id,
                    log_date=log_data["date"],
                    bleeding_flow=log_data["flow"],
                    physical_symptoms=log_data["symptoms"],
                    moods=log_data["moods"]
                )
                db.add(daily_log)

        db.commit()
        print("✅ Database Seeding Completed Successfully!")
        print("Login with:")
        print("Email: jane.test@example.com")
        print("Password: password123")

    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()