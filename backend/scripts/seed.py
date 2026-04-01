import sys
import os
from datetime import date, timedelta
from random import choice, randint, sample, seed as random_seed
from sqlalchemy.orm import Session

# Add the project root to sys.path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User
from app.models.cycle import Cycle
from app.models.daily_log import DailyLog
from app.models.user_setup import UserSetup
from app.models.community import Notification, NotificationSetting  # Import for User relationships

# Set random seed for reproducibility
random_seed(42)

# Test account configurations
TEST_ACCOUNTS = [
    {
        "email": "regular.28days@test.com",
        "name": "Regular 28-Day Cycle",
        "description": "Highly regular 28-day cycles (Medical baseline)",
        "has_pcos": False,
        "cycle_pattern": "regular",
        "avg_cycle_days": 28,
        "period_length": 5,
        "variation": 0,
    },
    {
        "email": "regular.29days@test.com",
        "name": "Regular 29-Day Cycle",
        "description": "Consistent 29-day cycles with minimal variation",
        "has_pcos": False,
        "cycle_pattern": "regular",
        "avg_cycle_days": 29,
        "period_length": 5,
        "variation": 1,
    },
    {
        "email": "short.21days@test.com",
        "name": "Short 21-Day Cycle",
        "description": "Short cycles (21-24 days) - frequent periods",
        "has_pcos": False,
        "cycle_pattern": "short",
        "avg_cycle_days": 23,
        "period_length": 4,
        "variation": 2,
    },
    {
        "email": "long.35days@test.com",
        "name": "Long 35-Day Cycle",
        "description": "Long cycles (35-40 days) - infrequent periods",
        "has_pcos": False,
        "cycle_pattern": "long",
        "avg_cycle_days": 37,
        "period_length": 6,
        "variation": 3,
    },
    {
        "email": "irregular.mild@test.com",
        "name": "Mild Irregularity",
        "description": "Slightly irregular (25-32 days variation)",
        "has_pcos": False,
        "cycle_pattern": "irregular_mild",
        "avg_cycle_days": 28,
        "period_length": 5,
        "variation": 5,
    },
    {
        "email": "irregular.moderate@test.com",
        "name": "Moderate Irregularity",
        "description": "Moderately irregular (22-38 days variation)",
        "has_pcos": False,
        "cycle_pattern": "irregular_moderate",
        "avg_cycle_days": 30,
        "period_length": 5,
        "variation": 8,
    },
    {
        "email": "pcos.severe@test.com",
        "name": "PCOS - Severe Irregularity",
        "description": "Very irregular cycles (20-60+ days, unpredictable)",
        "has_pcos": True,
        "cycle_pattern": "pcos",
        "avg_cycle_days": 35,
        "period_length": 7,
        "variation": 15,
    },
    {
        "email": "newuser.2cycles@test.com",
        "name": "New User - 2 Cycles",
        "description": "Only 2 cycles logged (insufficient data)",
        "has_pcos": False,
        "cycle_pattern": "new_user",
        "avg_cycle_days": 28,
        "period_length": 5,
        "num_cycles": 2,
    },
    {
        "email": "newuser.1cycle@test.com",
        "name": "New User - 1 Cycle",
        "description": "Only 1 cycle logged (baseline fallback)",
        "has_pcos": False,
        "cycle_pattern": "new_user",
        "avg_cycle_days": 28,
        "period_length": 5,
        "num_cycles": 1,
    },
    {
        "email": "variable.period@test.com",
        "name": "Variable Period Length",
        "description": "Regular cycle length but varying period duration (3-7 days)",
        "has_pcos": False,
        "cycle_pattern": "variable_period",
        "avg_cycle_days": 29,
        "period_length": 5,
        "variation": 1,
    },
]

# Pools for realistic data generation
SYMPTOMS_POOL = [
    "cramps", "back_pain", "headache", "bloating", "breast_tenderness",
    "fatigue", "nausea", "acne", "appetite_changes", "sleep_issues",
    "constipation", "mood_swings"
]
MOODS_POOL = [
    "happy", "calm", "sad", "anxious", "irritable", "stressed",
    "energetic", "tired", "emotional"
]
DISCHARGE_TYPES = ["none", "dry", "sticky", "creamy", "egg_white"]


def generate_daily_log(log_date: date, day_of_period: int, total_period_days: int, has_flow: bool) -> dict:
    """Generate realistic daily log data."""
    
    if not has_flow:
        flow = "none"
    elif day_of_period == 1:
        flow = choice(["spotting", "light", "medium"])
    elif day_of_period == 2:
        flow = choice(["medium", "heavy"])
    elif day_of_period == 3:
        flow = choice(["medium", "heavy", "light"])
    elif day_of_period >= total_period_days:
        flow = choice(["light", "spotting"])
    else:
        flow = choice(["light", "medium"])
    
    symptoms = []
    if flow in ["heavy", "medium"]:
        symptoms.extend(["cramps", choice(["back_pain", "fatigue"])])
    if flow == "heavy":
        symptoms.append("headache")
    
    if randint(1, 3) == 1:
        symptoms.append(choice(SYMPTOMS_POOL))
    
    symptoms = list(set(symptoms))[:4]
    
    if flow in ["heavy", "medium"]:
        moods = [choice(["tired", "irritable"]), choice(["emotional", "sad"])]
    else:
        moods = sample(MOODS_POOL, randint(1, 2))
    
    discharge = choice(DISCHARGE_TYPES) if flow == "none" else "none"
    
    return {
        "date": log_date,
        "flow": flow,
        "symptoms": symptoms,
        "moods": moods[:2],
        "discharge": discharge,
    }


def generate_cycles(config: dict, end_date: date = None):
    """Generate cycle data for a user, ending before or on end_date."""
    if end_date is None:
        end_date = date.today()
    
    cycles = []
    num_cycles = config.get("num_cycles", 12)
    
    # Calculate backwards from end_date to generate historical cycles
    # Start from the most recent cycle and work backwards
    current_end = end_date
    
    for i in range(num_cycles):
        # Calculate cycle length with variation
        if config["cycle_pattern"] == "pcos":
            cycle_length = randint(20, 65)
        elif config["cycle_pattern"] == "irregular_moderate":
            cycle_length = config["avg_cycle_days"] + randint(-8, 8)
        elif config["cycle_pattern"] == "irregular_mild":
            cycle_length = config["avg_cycle_days"] + randint(-5, 5)
        elif config["cycle_pattern"] == "short":
            cycle_length = randint(21, 25)
        elif config["cycle_pattern"] == "long":
            cycle_length = randint(35, 42)
        else:
            # Regular with minimal variation
            cycle_length = config["avg_cycle_days"] + randint(-config.get("variation", 2), config.get("variation", 2))
        
        cycle_length = max(18, min(cycle_length, 70))
        
        # Period length
        if config["cycle_pattern"] == "variable_period":
            period_length = randint(3, 7)
        elif config["cycle_pattern"] == "pcos":
            period_length = randint(4, 10)
        else:
            period_length = config["period_length"] + randint(-1, 1)
        
        period_length = max(2, min(period_length, 10))
        
        # Calculate period dates (working backwards)
        period_end = current_end
        period_start = period_end - timedelta(days=period_length - 1)
        
        # For the first cycle (most recent), if we're in the middle of a period,
        # only generate logs up to today
        logs_end_date = min(period_end, end_date) if i == 0 else period_end
        
        # Generate daily logs only for dates that are not in the future
        daily_logs = []
        actual_period_length = 0
        for day in range(period_length):
            log_date = period_start + timedelta(days=day)
            if log_date > end_date:
                # Don't generate logs for future dates
                break
            actual_period_length += 1
            log_data = generate_daily_log(
                log_date=log_date,
                day_of_period=day + 1,
                total_period_days=period_length,
                has_flow=True
            )
            daily_logs.append(log_data)
        
        # Only add cycle if it has at least one log (period started before or on end_date)
        if daily_logs:
            # Adjust period_end to the last log date if we truncated
            actual_end_date = daily_logs[-1]["date"] if daily_logs else period_end
            
            cycles.insert(0, {  # Insert at beginning to maintain chronological order
                "start_date": period_start,
                "end_date": actual_end_date,
                "period_length": actual_period_length,
                "cycle_length": cycle_length,
                "daily_logs": daily_logs,
            })
        
        # Move to the previous cycle
        current_end = period_start - timedelta(days=1)
    
    return cycles


def create_user_and_data(db: Session, config: dict):
    """Create a test user with complete cycle data."""
    
    user = db.query(User).filter(User.email == config["email"]).first()
    
    if user:
        print(f"  Clearing existing data for {config['email']}...")
        db.query(DailyLog).filter(DailyLog.user_id == user.id).delete()
        db.query(Cycle).filter(Cycle.user_id == user.id).delete()
        db.query(UserSetup).filter(UserSetup.user_id == user.id).delete()
        db.commit()
    else:
        print(f"  Creating user: {config['email']}")
        hashed_pw = hash_password("test123")
        user = User(email=config["email"], password_hash=hashed_pw)
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # Create UserSetup
    setup = UserSetup(
        user_id=user.id,
        avg_cycle_length_days=config["avg_cycle_days"],
        avg_period_length_days=config["period_length"],
        has_pcos_or_irregular=config["has_pcos"],
        prediction_mode="smart",
    )
    db.add(setup)
    
    # Generate and insert cycle data (ending on today)
    cycles_data = generate_cycles(config, end_date=date.today())
    
    for cycle_data in cycles_data:
        cycle = Cycle(
            user_id=user.id,
            start_date=cycle_data["start_date"],
            end_date=cycle_data["end_date"],
            period_length=cycle_data["period_length"],
            cycle_length=cycle_data["cycle_length"],
        )
        db.add(cycle)
        
        # Insert all daily logs for this cycle
        for log_data in cycle_data["daily_logs"]:
            daily_log = DailyLog(
                user_id=user.id,
                log_date=log_data["date"],
                bleeding_flow=log_data["flow"],
                physical_symptoms=log_data["symptoms"],
                moods=log_data["moods"],
                discharge_type=log_data["discharge"],
            )
            db.add(daily_log)
    
    db.commit()
    total_logs = sum(len(c["daily_logs"]) for c in cycles_data)
    print(f"    ✓ {len(cycles_data)} cycles, {total_logs} daily logs")
    
    return user


def seed_database():
    """Main seed function."""
    db: Session = SessionLocal()
    
    try:
        print("=" * 60)
        print("🌱 COMPREHENSIVE TEST DATA SEEDING")
        print("=" * 60)
        print(f"Creating {len(TEST_ACCOUNTS)} test accounts...\n")
        
        for i, config in enumerate(TEST_ACCOUNTS, 1):
            print(f"\n{i}. {config['name']}")
            print(f"   {config['description']}")
            create_user_and_data(db, config)
        
        print("\n" + "=" * 60)
        print("✅ SEEDING COMPLETED!")
        print("=" * 60)
        print("\n📋 Test Accounts:")
        for config in TEST_ACCOUNTS:
            print(f"  📧 {config['email']}")
        print("\n🔑 Password: test123 (for all accounts)")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()