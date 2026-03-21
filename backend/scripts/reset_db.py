import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine, Base
# Import all models to ensure they are registered with Base.metadata
from app.models import user
from app.models import cycle
from app.models import user_setup
from app.models import daily_log

def reset_db():
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    print("Database reset complete.")

if __name__ == "__main__":
    reset_db()