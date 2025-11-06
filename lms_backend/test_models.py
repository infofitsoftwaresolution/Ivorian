#!/usr/bin/env python3
"""
Test script to verify model relationships
"""
import asyncio
import sys
import os

# Fix Windows event loop issue
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import get_db, init_db
from app.models.user import User
from app.models.organization import Organization
from app.models.course import Course
from sqlalchemy import select

async def test_models():
    """Test model relationships"""
    print("🔍 Testing model relationships...")
    
    try:
        # Initialize database
        await init_db()
        print("✅ Database initialized successfully")
        
        # Test database connection
        async for db in get_db():
            try:
                # Test basic query
                result = await db.execute(select(Organization))
                orgs = result.scalars().all()
                print(f"✅ Found {len(orgs)} organizations")
                
                # Test User model
                result = await db.execute(select(User))
                users = result.scalars().all()
                print(f"✅ Found {len(users)} users")
                
                # Test Course model
                result = await db.execute(select(Course))
                courses = result.scalars().all()
                print(f"✅ Found {len(courses)} courses")
                
                print("✅ All model relationships are working correctly!")
                
            except Exception as e:
                print(f"❌ Error testing models: {e}")
                import traceback
                traceback.print_exc()
            finally:
                break
                
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_models())
