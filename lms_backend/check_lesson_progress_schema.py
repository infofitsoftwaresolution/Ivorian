#!/usr/bin/env python3
"""
Check the actual schema of lesson_progress table
"""

import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def check_lesson_progress_schema():
    """Check the actual schema of lesson_progress table"""
    
    # Get database URL from environment
    database_url = os.getenv('DATABASE_URL', 'postgresql+asyncpg://postgres:infofitlabs%23123@infofitlabs.c7yic444gxi0.ap-south-1.rds.amazonaws.com:5432/infofitlabs')
    
    # Convert to sync connection
    sync_url = database_url.replace('postgresql+asyncpg://', 'postgresql://')
    
    print(f"🔗 Connecting to database...")
    
    try:
        # Create engine
        engine = create_engine(sync_url)
        
        with engine.connect() as conn:
            print("🔍 Checking lesson_progress table schema...")
            print("=" * 50)
            
            # Check if table exists
            result = conn.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'lesson_progress'
                );
            """))
            table_exists = result.scalar()
            
            if not table_exists:
                print("❌ 'lesson_progress' table does not exist!")
                return
            
            print("✅ 'lesson_progress' table exists")
            
            # Get current columns
            result = conn.execute(text("""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'lesson_progress'
                ORDER BY ordinal_position;
            """))
            columns = result.fetchall()
            
            print(f"\n📋 Current columns in 'lesson_progress' table:")
            print("-" * 50)
            for col in columns:
                print(f"  {col[0]:<25} {col[1]:<15} nullable: {col[2]}")
            
            # Check if status column exists
            status_exists = any(col[0] == 'status' for col in columns)
            
            if status_exists:
                print("\n✅ 'status' column already exists!")
            else:
                print("\n❌ 'status' column is missing!")
            
            # Check alembic_version table
            print(f"\n📊 Checking alembic_version table:")
            print("-" * 50)
            result = conn.execute(text("SELECT version_num FROM alembic_version;"))
            version = result.scalar()
            print(f"Current migration version: {version}")
        
    except Exception as e:
        print(f"❌ Error connecting to database: {e}")

if __name__ == "__main__":
    check_lesson_progress_schema()
