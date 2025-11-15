#!/usr/bin/env python3
"""
RBAC Test Script
Tests the RBAC system functionality
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
from app.models.rbac import Role, Permission
from app.models.user import User
from app.services.rbac import RBACService
from sqlalchemy import select

async def test_rbac():
    """Test RBAC functionality"""
    print("🧪 Testing RBAC system...")
    
    # Initialize database
    await init_db()
    
    async for db in get_db():
        try:
            # Test 1: Check if roles exist
            print("\n1️⃣ Testing role existence...")
            result = await db.execute(select(Role))
            roles = result.scalars().all()
            print(f"✅ Found {len(roles)} roles:")
            for role in roles:
                print(f"   - {role.name}: {role.description}")
            
            # Test 2: Check if permissions exist
            print("\n2️⃣ Testing permission existence...")
            result = await db.execute(select(Permission))
            permissions = result.scalars().all()
            print(f"✅ Found {len(permissions)} permissions:")
            for perm in permissions:
                print(f"   - {perm.name}: {perm.resource}:{perm.action}")
            
            # Test 3: Check role-permission relationships
            print("\n3️⃣ Testing role-permission relationships...")
            for role in roles:
                print(f"   📋 {role.name} has {len(role.permissions)} permissions:")
                for perm in role.permissions:
                    print(f"      - {perm.name} ({perm.resource}:{perm.action})")
            
            # Test 4: Test RBAC service methods
            print("\n4️⃣ Testing RBAC service methods...")
            
            # Get a test user (first user in database)
            result = await db.execute(select(User))
            users = result.scalars().all()
            
            if users:
                test_user = users[0]
                print(f"   👤 Testing with user: {test_user.email} (ID: {test_user.id})")
                
                # Test getting user roles
                user_roles = await RBACService.get_user_roles(db, test_user.id)
                print(f"   📊 User has {len(user_roles)} roles:")
                for role in user_roles:
                    print(f"      - {role.name}")
                
                # Test getting user permissions
                user_permissions = await RBACService.get_user_permissions(db, test_user.id)
                print(f"   🔐 User has {len(user_permissions)} permissions:")
                for perm in user_permissions:
                    print(f"      - {perm.name} ({perm.resource}:{perm.action})")
                
                # Test permission checking
                print("\n5️⃣ Testing permission checking...")
                test_permissions = [
                    ("course", "manage"),
                    ("user", "manage"),
                    ("platform", "manage"),
                    ("assessment", "take")
                ]
                
                for resource, action in test_permissions:
                    has_perm = await RBACService.has_permission(db, test_user.id, resource, action)
                    print(f"   🔍 {test_user.email} has {resource}:{action}? {'✅ Yes' if has_perm else '❌ No'}")
                
                # Test role checking
                print("\n6️⃣ Testing role checking...")
                test_roles = ["super_admin", "organization_admin", "tutor", "student"]
                
                for role_name in test_roles:
                    has_role = await RBACService.has_role(db, test_user.id, role_name)
                    print(f"   👑 {test_user.email} has role {role_name}? {'✅ Yes' if has_role else '❌ No'}")
                
            else:
                print("   ⚠️ No users found in database for testing")
            
            print("\n✅ RBAC testing completed successfully!")
            
        except Exception as e:
            print(f"❌ Error testing RBAC: {str(e)}")
            raise

if __name__ == "__main__":
    asyncio.run(test_rbac())
