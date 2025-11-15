#!/usr/bin/env python3
"""
Test script for tutor creation
"""
import asyncio
import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import get_db
from app.services.user import UserService
from app.models.user import User
from app.schemas.user import UserResponse

async def test_tutor_creation():
    """Test creating a tutor"""
    try:
        # Get database session
        async for db in get_db():
            # Create a mock current user (organization admin)
            current_user = User(
                id=1,
                email="admin@test.com",
                role="organization_admin",
                organization_id=1,
                is_active=True
            )
            
            # Test data
            tutor_data = {
                "email": "tutor@test.com",
                "password": "testpass123",
                "first_name": "Test",
                "last_name": "Tutor",
                "phone": "1234567890",
                "bio": "Test bio",
                "is_active": True
            }
            
            print("Creating tutor...")
            tutor = await UserService.create_tutor(
                db=db,
                tutor_data=tutor_data,
                organization_id=1,
                current_user=current_user
            )
            
            print(f"Tutor created successfully: {tutor.email} (ID: {tutor.id})")
            print(f"Tutor role: {tutor.role}")
            print(f"Tutor organization_id: {tutor.organization_id}")
            print(f"Tutor is_active: {tutor.is_active}")
            print(f"Tutor created_at: {tutor.created_at}")
            print(f"Tutor updated_at: {tutor.updated_at}")
            
            # Test the response schema
            try:
                response_data = {
                    "id": tutor.id,
                    "first_name": tutor.first_name,
                    "last_name": tutor.last_name,
                    "email": tutor.email,
                    "phone": tutor.phone,
                    "bio": tutor.bio,
                    "avatar_url": tutor.avatar_url,
                    "date_of_birth": tutor.date_of_birth,
                    "timezone": tutor.timezone,
                    "language": tutor.language,
                    "status": tutor.status,
                    "is_active": tutor.is_active,
                    "is_verified": tutor.is_verified,
                    "organization_id": tutor.organization_id,
                    "roles": [tutor.role] if tutor.role else [],
                    "created_at": tutor.created_at,
                    "updated_at": tutor.updated_at,
                    "last_login": tutor.last_login
                }
                
                # Validate with UserResponse schema
                user_response = UserResponse(**response_data)
                print("✅ UserResponse validation successful!")
                print(f"Response: {user_response.model_dump()}")
                
            except Exception as e:
                print(f"❌ UserResponse validation failed: {str(e)}")
            
            break
            
    except Exception as e:
        print(f"Error creating tutor: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_tutor_creation())
