#!/usr/bin/env python3
"""
Create Admin User Script
Creates an admin user for InfoFit Labs organization
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
from app.models.organization import Organization
from app.models.user import User
from app.models.rbac import Role
from app.core.security import get_password_hash
from sqlalchemy import select

async def create_admin_user():
    """Create an admin user for InfoFit Labs organization"""
    print("👤 Creating Admin User for InfoFit Labs...")
    
    # Initialize database
    await init_db()
    
    async for db in get_db():
        try:
            # Check if InfoFit Labs organization exists, create if not
            org_result = await db.execute(
                select(Organization).where(Organization.name == "InfoFit Labs")
            )
            organization = org_result.scalar_one_or_none()
            
            if not organization:
                print("🏢 Creating InfoFit Labs organization...")
                organization = Organization(
                    name="InfoFit Labs",
                    description="InfoFit Labs - Modern AI-Integrated Learning Management System",
                    website="https://infofitlabs.com",
                    contact_email="admin@infofitlabs.com",
                    contact_phone="+1-555-0123",
                    address="123 Innovation Drive, Tech City, TC 12345",
                    industry="Education Technology",
                    size="1-10"
                )
                db.add(organization)
                await db.commit()
                await db.refresh(organization)
                print(f"✅ Created organization: {organization.name} (ID: {organization.id})")
            else:
                print(f"✅ Found existing organization: {organization.name} (ID: {organization.id})")
            
            # Check if admin user already exists
            admin_result = await db.execute(
                select(User).where(User.email == "admin@infofitlabs.com")
            )
            admin_user = admin_result.scalar_one_or_none()
            
            if admin_user:
                print("⚠️  Admin user already exists!")
                print(f"   Email: {admin_user.email}")
                print(f"   Name: {admin_user.first_name} {admin_user.last_name}")
                print(f"   Role: {admin_user.role}")
                return
            
            # Get the super_admin role
            role_result = await db.execute(
                select(Role).where(Role.name == "super_admin")
            )
            super_admin_role = role_result.scalar_one_or_none()
            
            if not super_admin_role:
                print("❌ Super admin role not found. Please run seed_rbac.py first!")
                return
            
            # Create admin user
            print("👤 Creating admin user...")
            admin_user = User(
                email="admin@infofitlabs.com",
                hashed_password=get_password_hash("Admin@123!"),
                first_name="InfoFit",
                last_name="Admin",
                role="super_admin",
                organization_id=organization.id,
                is_active=True,
                is_verified=True
            )
            
            db.add(admin_user)
            await db.commit()
            await db.refresh(admin_user)
            
            print("✅ Admin user created successfully!")
            print(f"   Email: {admin_user.email}")
            print(f"   Name: {admin_user.first_name} {admin_user.last_name}")
            print(f"   Role: {admin_user.role}")
            print(f"   Organization: {organization.name}")
            print(f"   User ID: {admin_user.id}")
            print("\n🔑 Login Credentials:")
            print(f"   Email: admin@infofitlabs.com")
            print(f"   Password: Admin@123!")
            print("\n⚠️  Please change the password after first login!")
            
        except Exception as e:
            print(f"❌ Error creating admin user: {str(e)}")
            await db.rollback()
            raise

if __name__ == "__main__":
    asyncio.run(create_admin_user())
