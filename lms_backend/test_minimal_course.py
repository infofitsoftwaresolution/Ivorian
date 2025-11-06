#!/usr/bin/env python3
"""
Minimal test script for Course CRUD operations using only existing database fields
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


async def test_minimal_course_crud():
    """Test minimal course CRUD operations with only existing database fields"""
    print("🚀 Starting Minimal Course CRUD Tests...")
    
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
            
            # Test 2: Create a course with only existing fields
            print("\n📚 Test 2: Creating a course...")
            
            # Create course directly with only the fields that exist in the database
            course = Course(
                title="Python Programming Fundamentals",
                slug="python-programming-fundamentals",
                description="Learn Python programming from scratch with hands-on projects",
                short_description="Complete Python course for beginners",
                organization_id=test_org.id,
                created_by=test_user.id,
                status="draft",
                category="Programming",
                is_featured=False,
                # Use existing fields from the original schema
                instructor_id=test_user.id,  # This field should still exist
                duration_hours=40,
                is_published=False
            )
            
            db.add(course)
            await db.commit()
            await db.refresh(course)
            print(f"✅ Created course: {course.title} (ID: {course.id})")
            
            # Test 3: Get course
            print("\n📖 Test 3: Getting course...")
            retrieved_course = await db.get(Course, course.id)
            print(f"✅ Retrieved course: {retrieved_course.title}")
            print(f"   - Status: {retrieved_course.status}")
            print(f"   - Category: {retrieved_course.category}")
            print(f"   - Slug: {retrieved_course.slug}")
            
            # Test 4: Update course
            print("\n✏️ Test 4: Updating course...")
            retrieved_course.title = "Advanced Python Programming"
            retrieved_course.short_description = "Advanced Python concepts and best practices"
            retrieved_course.status = "published"
            await db.commit()
            await db.refresh(retrieved_course)
            print(f"✅ Updated course: {retrieved_course.title}")
            print(f"   - New status: {retrieved_course.status}")
            
            # Test 5: List courses
            print("\n📋 Test 5: Listing courses...")
            from sqlalchemy import select
            result = await db.execute(select(Course).where(Course.organization_id == test_org.id))
            courses = result.scalars().all()
            print(f"✅ Found {len(courses)} courses")
            for course in courses:
                print(f"   - {course.title} ({course.status})")
            
            print("\n🎉 All tests passed successfully!")
            
        except Exception as e:
            print(f"❌ Test failed with error: {e}")
            import traceback
            traceback.print_exc()
        
        finally:
            # Cleanup
            print("\n🧹 Cleaning up test data...")
            try:
                # Delete test data in reverse order
                if 'course' in locals():
                    await db.delete(course)
                if 'test_user' in locals():
                    await db.delete(test_user)
                if 'test_org' in locals():
                    await db.delete(test_org)
                await db.commit()
                print("✅ Cleanup completed")
            except Exception as e:
                print(f"⚠️ Cleanup error: {e}")


if __name__ == "__main__":
    asyncio.run(test_minimal_course_crud())
