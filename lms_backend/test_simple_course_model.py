#!/usr/bin/env python3
"""
Test with a simplified Course model that matches the actual database schema
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
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.core.database import Base, AsyncSessionLocal
from app.models.user import User
from app.models.organization import Organization


class SimpleCourse(Base):
    """Simplified Course model that matches the actual database schema"""
    __tablename__ = "courses"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    instructor_id = Column(Integer, ForeignKey("users.id"))
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    price = Column(Float)
    is_published = Column(Boolean)
    difficulty_level = Column(String(50))
    duration_hours = Column(Integer)
    tags = Column(JSON)
    created_at = Column(DateTime(timezone=True))
    updated_at = Column(DateTime(timezone=True))
    
    # New fields we added
    slug = Column(String(255))
    short_description = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    status = Column(String(50))
    published_at = Column(DateTime(timezone=True))
    category = Column(String(100))
    is_featured = Column(Boolean)
    
    # Relationships
    organization = relationship("Organization")
    instructor = relationship("User", foreign_keys=[instructor_id])
    creator = relationship("User", foreign_keys=[created_by])


async def test_simple_course_crud():
    """Test course CRUD operations with simplified model"""
    print("🚀 Starting Simple Course CRUD Tests...")
    
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
            
            # Test 2: Create a course
            print("\n📚 Test 2: Creating a course...")
            
            course = SimpleCourse(
                title="Python Programming Fundamentals",
                slug="python-programming-fundamentals",
                description="Learn Python programming from scratch with hands-on projects",
                short_description="Complete Python course for beginners",
                instructor_id=test_user.id,
                organization_id=test_org.id,
                created_by=test_user.id,
                price=99.99,
                is_published=False,
                difficulty_level="beginner",
                duration_hours=40,
                status="draft",
                category="Programming",
                is_featured=False,
                tags=["python", "programming", "beginner"]
            )
            
            db.add(course)
            await db.commit()
            await db.refresh(course)
            print(f"✅ Created course: {course.title} (ID: {course.id})")
            
            # Test 3: Get course
            print("\n📖 Test 3: Getting course...")
            retrieved_course = await db.get(SimpleCourse, course.id)
            print(f"✅ Retrieved course: {retrieved_course.title}")
            print(f"   - Status: {retrieved_course.status}")
            print(f"   - Category: {retrieved_course.category}")
            print(f"   - Slug: {retrieved_course.slug}")
            print(f"   - Price: ${retrieved_course.price}")
            
            # Test 4: Update course
            print("\n✏️ Test 4: Updating course...")
            retrieved_course.title = "Advanced Python Programming"
            retrieved_course.short_description = "Advanced Python concepts and best practices"
            retrieved_course.status = "published"
            retrieved_course.is_published = True
            await db.commit()
            await db.refresh(retrieved_course)
            print(f"✅ Updated course: {retrieved_course.title}")
            print(f"   - New status: {retrieved_course.status}")
            print(f"   - Published: {retrieved_course.is_published}")
            
            # Test 5: List courses
            print("\n📋 Test 5: Listing courses...")
            from sqlalchemy import select
            result = await db.execute(select(SimpleCourse).where(SimpleCourse.organization_id == test_org.id))
            courses = result.scalars().all()
            print(f"✅ Found {len(courses)} courses")
            for course in courses:
                print(f"   - {course.title} ({course.status}) - ${course.price}")
            
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
    asyncio.run(test_simple_course_crud())
