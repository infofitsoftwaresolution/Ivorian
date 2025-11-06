#!/usr/bin/env python3
"""
Debug script for authentication issues
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
from app.models.user import User
from app.models.organization import Organization
from app.schemas.auth import UserRegister, OrganizationRegister
from app.services.auth import AuthService
from sqlalchemy import select

async def debug_registration():
    """Debug the registration process"""
    print("🔍 Debugging registration process...")
    
    # Get database session
    async for db in get_db():
        try:
            # Check if organizations exist
            orgs = await db.execute(select(Organization))
            orgs_list = orgs.scalars().all()
            print(f"📊 Found {len(orgs_list)} organizations in database")
            
            if orgs_list:
                print("Organizations:")
                for org in orgs_list:
                    print(f"  - ID: {org.id}, Name: {org.name}")
            
            # Check if user already exists
            existing_user = await db.execute(
                select(User).where(User.email == "test@example.com")
            )
            user_exists = existing_user.scalar_one_or_none()
            print(f"👤 User test@example.com exists: {user_exists is not None}")
            
            if user_exists:
                print(f"  - User ID: {user_exists.id}")
                print(f"  - Organization ID: {user_exists.organization_id}")
            
            # Try to create a test organization if none exist
            if not orgs_list:
                print("🏢 Creating test organization...")
                test_org = Organization(
                    name="Test Organization",
                    description="Test organization for debugging",
                    domain="test.com"
                )
                db.add(test_org)
                await db.commit()
                await db.refresh(test_org)
                print(f"✅ Created organization with ID: {test_org.id}")
                org_id = test_org.id
            else:
                org_id = orgs_list[0].id
            
            # Test organization registration
            print("🏢 Testing organization registration...")
            org_data = OrganizationRegister(
                name="Test University",
                description="A test university for learning management",
                website="https://testuniversity.com",
                contact_email="admin@testuniversity.com",
                contact_phone="+1234567890",
                address="123 Test Street, Test City, TC 12345",
                industry="Education",
                size="51-200",
                admin_email="admin@testuniversity.com",
                admin_password="adminpassword123",
                admin_first_name="Admin",
                admin_last_name="User"
            )
            
            auth_service = AuthService(db)
            result = await auth_service.register_organization(org_data)
            print("✅ Organization registration successful!")
            print(f"Organization ID: {result['organization']['id']}")
            print(f"Admin User ID: {result['admin_user']['id']}")
            print(f"Access Token: {result['tokens']['access_token'][:50]}...")
            
            # Test user registration with the created organization
            print(f"🔐 Testing user registration with organization_id: {result['organization']['id']}")
            user_data = UserRegister(
                email="student@testuniversity.com",
                password="studentpassword123",
                first_name="Student",
                last_name="User",
                role="student",
                organization_id=result['organization']['id']
            )
            
            result = await auth_service.register_user(user_data)
            print("✅ User registration successful!")
            print(f"User ID: {result['user']['id']}")
            print(f"Access Token: {result['tokens']['access_token'][:50]}...")
            
        except Exception as e:
            print(f"❌ Error during debug: {e}")
            import traceback
            traceback.print_exc()
        finally:
            break

if __name__ == "__main__":
    asyncio.run(debug_registration())
