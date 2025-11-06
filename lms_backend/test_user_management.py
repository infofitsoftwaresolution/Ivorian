#!/usr/bin/env python3
"""
User Management Test Script
Tests the user management system functionality
"""
import asyncio
import sys
import os
import uuid

# Fix Windows event loop issue
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import get_db, init_db
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserAdminUpdate
from app.services.user import UserService
from app.services.rbac import RBACService
from sqlalchemy import select

async def test_user_management():
    """Test user management functionality"""
    print("🧪 Testing User Management system...")
    
    # Initialize database
    await init_db()
    
    async for db in get_db():
        try:
            # Generate unique email for this test run
            unique_id = str(uuid.uuid4())[:8]
            test_email = f"testuser_{unique_id}@example.com"
            
            # Test 1: Create a test user
            print("\n1️⃣ Testing user creation...")
            
            test_user_data = UserCreate(
                first_name="Test",
                last_name="User",
                email=test_email,
                password="TestPass123!",
                phone="+1234567890",
                bio="This is a test user",
                timezone="UTC",
                language="en",
                roles=["student"]
            )
            
            user = await UserService.create_user(db, test_user_data)
            print(f"✅ Created user: {user.email} (ID: {user.id})")
            print(f"   - Name: {user.first_name} {user.last_name}")
            print(f"   - Status: {user.status}")
            print(f"   - Active: {user.is_active}")
            print(f"   - Verified: {user.is_verified}")
            
            # Test 2: Get user by ID
            print("\n2️⃣ Testing get user by ID...")
            retrieved_user = await UserService.get_user_by_id(db, user.id)
            if retrieved_user:
                print(f"✅ Retrieved user: {retrieved_user.email}")
                print(f"   - Roles: {[role.name for role in retrieved_user.roles]}")
            else:
                print("❌ Failed to retrieve user")
            
            # Test 3: Get user by email
            print("\n3️⃣ Testing get user by email...")
            email_user = await UserService.get_user_by_email(db, user.email)
            if email_user:
                print(f"✅ Retrieved user by email: {email_user.email}")
            else:
                print("❌ Failed to retrieve user by email")
            
            # Test 4: Update user
            print("\n4️⃣ Testing user update...")
            update_data = UserUpdate(
                first_name="Updated",
                last_name="User",
                bio="This user has been updated",
                phone="+0987654321"
            )
            
            updated_user = await UserService.update_user(db, user.id, update_data)
            print(f"✅ Updated user: {updated_user.first_name} {updated_user.last_name}")
            print(f"   - New bio: {updated_user.bio}")
            print(f"   - New phone: {updated_user.phone}")
            
            # Test 5: Change password
            print("\n5️⃣ Testing password change...")
            try:
                success = await UserService.change_password(
                    db, user.id, "TestPass123!", "NewPass456!"
                )
                if success:
                    print("✅ Password changed successfully")
                else:
                    print("❌ Failed to change password")
            except Exception as e:
                print(f"❌ Error changing password: {str(e)}")
            
            # Test 6: Assign roles
            print("\n6️⃣ Testing role assignment...")
            try:
                success = await UserService.assign_roles_to_user(db, user.id, ["student", "tutor"])
                if success:
                    print("✅ Roles assigned successfully")
                    # Check roles
                    user_with_roles = await UserService.get_user_by_id(db, user.id)
                    print(f"   - Current roles: {[role.name for role in user_with_roles.roles]}")
                else:
                    print("❌ Failed to assign roles")
            except Exception as e:
                print(f"❌ Error assigning roles: {str(e)}")
            
            # Test 7: Get users list
            print("\n7️⃣ Testing get users list...")
            try:
                users, total = await UserService.get_users(db, skip=0, limit=10)
                print(f"✅ Retrieved {len(users)} users (total: {total})")
                for u in users:
                    print(f"   - {u.email} ({u.first_name} {u.last_name})")
            except Exception as e:
                print(f"❌ Error getting users list: {str(e)}")
            
            # Test 8: Admin update user
            print("\n8️⃣ Testing admin update user...")
            try:
                admin_update_data = UserAdminUpdate(
                    first_name="Admin",
                    last_name="Updated",
                    is_active=True,
                    roles=["organization_admin"]
                )
                
                admin_updated_user = await UserService.admin_update_user(
                    db, user.id, admin_update_data, user  # Using same user as admin for testing
                )
                print(f"✅ Admin updated user: {admin_updated_user.first_name} {admin_updated_user.last_name}")
                print(f"   - Active: {admin_updated_user.is_active}")
                print(f"   - Roles: {[role.name for role in admin_updated_user.roles]}")
            except Exception as e:
                print(f"❌ Error admin updating user: {str(e)}")
            
            # Test 9: Get user statistics
            print("\n9️⃣ Testing user statistics...")
            try:
                stats = await UserService.get_user_stats(db, user)
                print(f"✅ Retrieved user statistics:")
                print(f"   - Total users: {stats.total_users}")
                print(f"   - Active users: {stats.active_users}")
                print(f"   - Verified users: {stats.verified_users}")
                print(f"   - New users this month: {stats.new_users_this_month}")
                print(f"   - New users this week: {stats.new_users_this_week}")
            except Exception as e:
                print(f"❌ Error getting user statistics: {str(e)}")
            
            # Test 10: Test RBAC integration
            print("\n🔟 Testing RBAC integration...")
            try:
                # Test user roles
                user_roles = await RBACService.get_user_roles(db, user.id)
                print(f"✅ User roles: {[role.name for role in user_roles]}")
                
                # Test user permissions
                user_permissions = await RBACService.get_user_permissions(db, user.id)
                print(f"✅ User permissions: {[perm.name for perm in user_permissions]}")
                
                # Test permission checking
                has_course_manage = await RBACService.has_permission(db, user.id, "course", "manage")
                has_user_manage = await RBACService.has_permission(db, user.id, "user", "manage")
                print(f"✅ Permission checks:")
                print(f"   - Has course:manage? {'Yes' if has_course_manage else 'No'}")
                print(f"   - Has user:manage? {'Yes' if has_user_manage else 'No'}")
                
            except Exception as e:
                print(f"❌ Error testing RBAC integration: {str(e)}")
            
            print("\n✅ User Management testing completed successfully!")
            
        except Exception as e:
            print(f"❌ Error testing user management: {str(e)}")
            raise

if __name__ == "__main__":
    asyncio.run(test_user_management())
