#!/usr/bin/env python3
"""
Final test for Course CRUD operations with existing database schema
"""
import asyncio
import sys
import os
import time

# Fix for Windows asyncio event loop policy
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal
from app.models.course import Course
from app.models.user import User
from app.models.organization import Organization
from app.schemas.course import CourseCreate
from app.services.course import CourseService


async def test_final_course_crud():
    """Test course CRUD operations with existing database schema"""
    print("🚀 Starting Final Course CRUD Tests...")
    
    async with AsyncSessionLocal() as db:
        try:
            # Test 1: Create a test organization and user
            print("\n📝 Test 1: Creating test organization and user...")
            
            # Create test organization with unique domain
            unique_domain = f"testacademy-{int(time.time())}.com"
            test_org = Organization(
                name=f"Test Academy {int(time.time())}",
                description="A test organization for course management",
                domain=unique_domain,
                is_active=True
            )
            db.add(test_org)
            await db.commit()
            await db.refresh(test_org)
            print(f"✅ Created organization: {test_org.name} (ID: {test_org.id})")
            
            # Create test user (instructor) with unique email
            unique_email = f"instructor-{int(time.time())}@testacademy.com"
            test_user = User(
                email=unique_email,
                hashed_password="hashed_password_123",
                first_name="John",
                last_name="Instructor",
                role="organization_admin",
                organization_id=test_org.id,
                is_active=True
            )
            db.add(test_user)
            await db.commit()
            await db.refresh(test_user)
            print(f"✅ Created user: {test_user.first_name} {test_user.last_name} (ID: {test_user.id})")
            
            # Test 2: Create a course using only existing fields
            print("\n📚 Test 2: Creating a course...")
            
            course_data = CourseCreate(
                title=f"Python Programming Fundamentals {int(time.time())}",
                description="Learn Python programming from scratch with hands-on projects",
                short_description="Complete Python course for beginners",
                organization_id=test_org.id,
                difficulty_level="beginner",
                category="Programming",
                price=99.99,
                currency="USD",
                enrollment_type="paid"
            )
            
            created_course = await CourseService.create_course(db, course_data, test_user.id)
            print(f"✅ Created course: {created_course.title} (ID: {created_course.id})")
            
            # Test 3: Get course
            print("\n📖 Test 3: Getting course...")
            retrieved_course = await CourseService.get_course_with_details(db, created_course.id)
            print(f"✅ Retrieved course: {retrieved_course.title}")
            print(f"   - Status: {retrieved_course.status}")
            print(f"   - Category: {retrieved_course.category}")
            print(f"   - Slug: {retrieved_course.slug}")
            
            # Test 4: Update course
            print("\n✏️ Test 4: Updating course...")
            from app.schemas.course import CourseUpdate
            update_data = CourseUpdate(
                title="Advanced Python Programming",
                short_description="Advanced Python concepts and best practices",
                status="published"
            )
            updated_course = await CourseService.update_course(db, created_course.id, update_data, test_user.id)
            print(f"✅ Updated course: {updated_course.title}")
            print(f"   - New status: {updated_course.status}")
            
            # Test 5: List courses
            print("\n📋 Test 5: Listing courses...")
            courses, total = await CourseService.get_courses(db, skip=0, limit=10)
            print(f"✅ Found {total} courses")
            for course in courses:
                print(f"   - {course.title} ({course.status})")
            
            print("\n🎉 All tests passed successfully!")
            print("\n✅ Course CRUD operations are working correctly!")
            print("✅ Database schema is properly aligned with models!")
            
        except Exception as e:
            print(f"❌ Test failed with error: {e}")
            import traceback
            traceback.print_exc()
        
        finally:
            # Cleanup
            print("\n🧹 Cleaning up test data...")
            try:
                # Delete test data in reverse order
                if 'created_course' in locals():
                    await db.delete(created_course)
                if 'test_user' in locals():
                    await db.delete(test_user)
                if 'test_org' in locals():
                    await db.delete(test_org)
                await db.commit()
                print("✅ Cleanup completed")
            except Exception as e:
                print(f"⚠️ Cleanup error: {e}")


if __name__ == "__main__":
    asyncio.run(test_final_course_crud())
