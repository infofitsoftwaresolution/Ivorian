#!/usr/bin/env python3
"""
Complete Setup Script for InfoFit Labs LMS
This script will:
1. Seed the RBAC system with roles and permissions
2. Create InfoFit Labs organization
3. Create admin user with super_admin role
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
from app.models.rbac import Role, Permission, role_permissions
from app.core.security import get_password_hash
from sqlalchemy import select

async def setup_complete():
    """Complete setup for InfoFit Labs LMS"""
    print("🚀 Setting up InfoFit Labs LMS...")
    print("=" * 50)
    
    # Initialize database
    await init_db()
    
    async for db in get_db():
        try:
            # Step 1: Seed RBAC
            print("\n1️⃣ Seeding RBAC system...")
            await seed_rbac(db)
            
            # Step 2: Create Organization
            print("\n2️⃣ Setting up InfoFit Labs organization...")
            organization = await create_organization(db)
            
            # Step 3: Create Admin User
            print("\n3️⃣ Creating admin user...")
            await create_admin_user(db, organization)
            
            print("\n" + "=" * 50)
            print("✅ Setup completed successfully!")
            print("\n🔑 Admin Login Credentials:")
            print("   Email: admin@infofitlabs.com")
            print("   Password: Admin@123!")
            print("\n⚠️  Please change the password after first login!")
            print("\n🎉 You can now start developing and testing the LMS!")
            
        except Exception as e:
            print(f"❌ Error during setup: {str(e)}")
            await db.rollback()
            raise

async def seed_rbac(db):
    """Seed the database with initial roles and permissions"""
    # Check if roles already exist
    result = await db.execute(select(Role))
    existing_roles = result.scalars().all()
    
    if existing_roles:
        print("   ✅ Roles already exist, skipping RBAC seeding")
        return
    
    print("   📝 Creating initial roles...")
    
    # Create roles
    roles = {
        "super_admin": Role(
            name="super_admin",
            description="InfoFit Labs Super Administrator - Full platform access"
        ),
        "organization_admin": Role(
            name="organization_admin", 
            description="Organization Administrator - Manages organization, tutors, and students"
        ),
        "tutor": Role(
            name="tutor",
            description="Tutor/Instructor - Creates and manages courses, assessments"
        ),
        "student": Role(
            name="student",
            description="Student - Enrolls in courses, takes assessments"
        )
    }
    
    # Add roles to database
    for role in roles.values():
        db.add(role)
    await db.commit()
    
    # Refresh roles to get IDs
    for role in roles.values():
        await db.refresh(role)
    
    print("   🔐 Creating initial permissions...")
    
    # Create permissions
    permissions = {
        # Super Admin permissions
        "platform_manage": Permission(
            name="platform_manage",
            resource="platform",
            action="manage",
            description="Full platform management access"
        ),
        "organization_manage": Permission(
            name="organization_manage",
            resource="organization", 
            action="manage",
            description="Manage all organizations"
        ),
        "user_manage": Permission(
            name="user_manage",
            resource="user",
            action="manage", 
            description="Manage all users across platform"
        ),
        "role_manage": Permission(
            name="role_manage",
            resource="role",
            action="manage",
            description="Manage roles and permissions"
        ),
        
        # Organization Admin permissions
        "org_user_manage": Permission(
            name="org_user_manage",
            resource="user",
            action="manage_org",
            description="Manage users within organization"
        ),
        "org_course_manage": Permission(
            name="org_course_manage",
            resource="course",
            action="manage_org",
            description="Manage courses within organization"
        ),
        "org_analytics_read": Permission(
            name="org_analytics_read",
            resource="analytics",
            action="read_org",
            description="View organization analytics"
        ),
        
        # Tutor permissions
        "course_manage": Permission(
            name="course_manage",
            resource="course",
            action="manage",
            description="Manage own courses"
        ),
        "assessment_manage": Permission(
            name="assessment_manage",
            resource="assessment",
            action="manage",
            description="Manage assessments for own courses"
        ),
        "student_progress_read": Permission(
            name="student_progress_read",
            resource="progress",
            action="read",
            description="View student progress in own courses"
        ),
        
        # Student permissions
        "course_enroll": Permission(
            name="course_enroll",
            resource="course",
            action="enroll",
            description="Enroll in courses"
        ),
        "assessment_take": Permission(
            name="assessment_take",
            resource="assessment",
            action="take",
            description="Take assessments"
        ),
        "own_progress_read": Permission(
            name="own_progress_read",
            resource="progress",
            action="read_own",
            description="View own progress"
        )
    }
    
    # Add permissions to database
    for permission in permissions.values():
        db.add(permission)
    await db.commit()
    
    # Refresh permissions to get IDs
    for permission in permissions.values():
        await db.refresh(permission)
    
    print("   🔗 Assigning permissions to roles...")
    
    # Define role-permission mappings
    role_permission_mappings = {
        "super_admin": [
            "platform_manage", "organization_manage", "user_manage", 
            "role_manage", "org_user_manage", "org_course_manage",
            "org_analytics_read", "course_manage", "assessment_manage",
            "student_progress_read", "course_enroll", "assessment_take",
            "own_progress_read"
        ],
        "organization_admin": [
            "org_user_manage", "org_course_manage", "org_analytics_read",
            "course_manage", "assessment_manage", "student_progress_read",
            "course_enroll", "assessment_take", "own_progress_read"
        ],
        "tutor": [
            "course_manage", "assessment_manage", "student_progress_read",
            "course_enroll", "assessment_take", "own_progress_read"
        ],
        "student": [
            "course_enroll", "assessment_take", "own_progress_read"
        ]
    }
    
    # Assign permissions to roles using the association table
    for role_name, permission_names in role_permission_mappings.items():
        role = roles[role_name]
        for perm_name in permission_names:
            permission = permissions[perm_name]
            # Insert directly into the association table
            await db.execute(
                role_permissions.insert().values(
                    role_id=role.id,
                    permission_id=permission.id
                )
            )
    
    await db.commit()
    print("   ✅ RBAC seeding completed!")

async def create_organization(db):
    """Create InfoFit Labs organization"""
    # Check if organization exists
    org_result = await db.execute(
        select(Organization).where(Organization.name == "InfoFit Labs")
    )
    organization = org_result.scalar_one_or_none()
    
    if organization:
        print(f"   ✅ Found existing organization: {organization.name}")
        return organization
    
    print("   🏢 Creating InfoFit Labs organization...")
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
    print(f"   ✅ Created organization: {organization.name}")
    return organization

async def create_admin_user(db, organization):
    """Create admin user"""
    # Check if admin user already exists
    admin_result = await db.execute(
        select(User).where(User.email == "admin@infofitlabs.com")
    )
    admin_user = admin_result.scalar_one_or_none()
    
    if admin_user:
        print("   ⚠️  Admin user already exists!")
        return admin_user
    
    # Get the super_admin role
    role_result = await db.execute(
        select(Role).where(Role.name == "super_admin")
    )
    super_admin_role = role_result.scalar_one_or_none()
    
    if not super_admin_role:
        raise Exception("Super admin role not found!")
    
    # Create admin user
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
    
    print("   ✅ Admin user created successfully!")
    return admin_user

if __name__ == "__main__":
    asyncio.run(setup_complete())
