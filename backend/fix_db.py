"""
Database fix script to add missing columns to user_setups table.
Run this when you've added new fields to SQLAlchemy models but haven't set up Alembic migrations.
"""

from sqlalchemy import text
from app.core.database import engine


def fix_database_schema():
    """Add missing columns to user_setups table"""
    
    # SQL statements to add missing columns
    alter_statements = [
        "ALTER TABLE user_setups ADD COLUMN IF NOT EXISTS pronouns VARCHAR;",
        "ALTER TABLE user_setups ADD COLUMN IF NOT EXISTS has_pcos_or_irregular BOOLEAN DEFAULT FALSE;"
    ]
    
    try:
        with engine.connect() as connection:
            with connection.begin():  # Auto-commit transaction
                for sql in alter_statements:
                    print(f"Executing: {sql}")
                    connection.execute(text(sql))
                
            print("✅ Database schema updated successfully!")
            
    except Exception as e:
        print(f"❌ Error updating database schema: {e}")
        raise


if __name__ == "__main__":
    fix_database_schema()
