#!/usr/bin/env python3
"""
Debug script for token verification
"""
import asyncio
import sys
import os

# Fix Windows event loop issue
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import get_db
from app.core.security import verify_token
from app.models.user import User
from sqlalchemy import select

async def debug_token():
    """Debug token verification"""
    print("🔍 Debugging token verification...")
    
    # Get database session
    async for db in get_db():
        try:
            # Test token verification
            test_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3N..."  # This will be invalid
            print(f"Testing token verification...")
            
            user_id = verify_token(test_token)
            print(f"Token verification result: {user_id}")
            
            if user_id:
                # Test user lookup
                print(f"Looking up user with ID: {user_id}")
                user = await User.get_by_id(db, user_id)
                if user:
                    print(f"✅ User found: {user.email}")
                else:
                    print(f"❌ User not found for ID: {user_id}")
            else:
                print("❌ Token verification failed")
            
            # Test getting all users
            result = await db.execute(select(User))
            users = result.scalars().all()
            print(f"📊 Found {len(users)} users in database:")
            for user in users:
                print(f"  - ID: {user.id}, Email: {user.email}, Role: {user.role}")
                
        except Exception as e:
            print(f"❌ Error during debug: {e}")
            import traceback
            traceback.print_exc()
        finally:
            break

if __name__ == "__main__":
    asyncio.run(debug_token())
