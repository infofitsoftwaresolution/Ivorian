#!/usr/bin/env python3
"""
Test script for Course CRUD operations
"""
import asyncio
import sys
import os

# Fix for Windows asyncio event loop policy
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
from datetime import datetime, date

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import engine, AsyncSessionLocal
from app.models.course import Course, Topic, Lesson, Enrollment
from app.models.user import User
from app.models.organization import Organization
from app.schemas.course import CourseCreate, TopicCreate, LessonCreate
from app.services.course import CourseService, TopicService, LessonService, EnrollmentService


async def test_course_crud():
    """Test comprehensive course CRUD operations"""
    print("🚀 Starting Course CRUD Tests...")
    
    async with AsyncSessionLocal() as db:
        try:
            # Test 1: Create a test organization and user
            print("\n📝 Test 1: Creating test organization and user...")
            
            # Create test organization
            test_org = Organization(
                name="Test Academy",
                description="A test organization for course management",
                domain="testacademy.com",
                is_active=True
            )
            db.add(test_org)
            await db.commit()
            await db.refresh(test_org)
            print(f"✅ Created organization: {test_org.name} (ID: {test_org.id})")
            
            # Create test user (instructor)
            test_user = User(
                email="instructor@testacademy.com",
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
            course_data = CourseCreate(
                title="Python Programming Fundamentals",
                description="Learn Python programming from scratch with hands-on projects",
                short_description="Complete Python course for beginners",
                difficulty_level="beginner",
                category="Programming",
                tags=["python", "programming", "beginner"],
                organization_id=test_org.id,
                price=99.99,
                currency="USD",
                start_date=date.today(),
                duration_weeks=8,
                max_students=50,
                prerequisites="No prior programming experience required",
                learning_objectives=[
                    "Understand Python syntax and data types",
                    "Write functions and classes",
                    "Work with files and databases",
                    "Build a complete Python project"
                ]
            )
            
            course = await CourseService.create_course(db, course_data, test_user.id)
            print(f"✅ Created course: {course.title} (ID: {course.id})")
            print(f"   - Status: {course.status}")
            print(f"   - Price: ${course.price}")
            print(f"   - Duration: {course.duration_weeks} weeks")
            
            # Test 3: Get course details
            print("\n🔍 Test 3: Retrieving course details...")
            course_details = await CourseService.get_course_with_details(db, course.id)
            if course_details:
                print(f"✅ Retrieved course: {course_details.title}")
                print(f"   - Organization: {course_details.organization.name if course_details.organization else 'N/A'}")
                print(f"   - Created by: {course_details.creator.first_name} {course_details.creator.last_name}")
            else:
                print("❌ Failed to retrieve course details")
            
            # Test 4: Create topics for the course
            print("\n📖 Test 4: Creating course topics...")
            topics_data = [
                {
                    "title": "Introduction to Python",
                    "description": "Basic Python concepts and setup",
                    "content": "Learn about Python installation, variables, and basic syntax",
                    "order": 1,
                    "estimated_duration": 120,
                    "is_required": True
                },
                {
                    "title": "Data Types and Variables",
                    "description": "Understanding Python data types",
                    "content": "Explore strings, numbers, lists, and dictionaries",
                    "order": 2,
                    "estimated_duration": 90,
                    "is_required": True
                },
                {
                    "title": "Control Flow",
                    "description": "Loops and conditional statements",
                    "content": "Learn about if/else statements, for and while loops",
                    "order": 3,
                    "estimated_duration": 150,
                    "is_required": True
                }
            ]
            
            created_topics = []
            for topic_data in topics_data:
                topic_create = TopicCreate(
                    course_id=course.id,
                    **topic_data
                )
                topic = await TopicService.create_topic(db, topic_create, test_user.id)
                created_topics.append(topic)
                print(f"✅ Created topic: {topic.title} (ID: {topic.id})")
            
            # Test 5: Create lessons for topics
            print("\n📝 Test 5: Creating lessons...")
            lessons_data = [
                {
                    "topic_id": created_topics[0].id,
                    "title": "Python Installation and Setup",
                    "description": "How to install Python and set up your development environment",
                    "content": "Step-by-step guide to installing Python and choosing an IDE",
                    "order": 1,
                    "content_type": "text",
                    "estimated_duration": 30,
                    "is_required": True,
                    "is_free_preview": True
                },
                {
                    "topic_id": created_topics[0].id,
                    "title": "Your First Python Program",
                    "description": "Write and run your first Python program",
                    "content": "Learn to write 'Hello World' and understand the basics",
                    "order": 2,
                    "content_type": "text",
                    "estimated_duration": 45,
                    "is_required": True,
                    "is_free_preview": False
                },
                {
                    "topic_id": created_topics[1].id,
                    "title": "Understanding Strings",
                    "description": "Working with text data in Python",
                    "content": "Learn string manipulation, formatting, and methods",
                    "order": 1,
                    "content_type": "text",
                    "estimated_duration": 60,
                    "is_required": True,
                    "is_free_preview": False
                }
            ]
            
            created_lessons = []
            for lesson_data in lessons_data:
                lesson_create = LessonCreate(**lesson_data)
                lesson = await LessonService.create_lesson(db, lesson_create, test_user.id)
                created_lessons.append(lesson)
                print(f"✅ Created lesson: {lesson.title} (ID: {lesson.id})")
            
            # Test 6: Update course
            print("\n✏️ Test 6: Updating course...")
            from app.schemas.course import CourseUpdate
            course_update = CourseUpdate(
                title="Python Programming Fundamentals - Updated",
                price=149.99,
                is_featured=True
            )
            updated_course = await CourseService.update_course(db, course.id, course_update, test_user.id)
            print(f"✅ Updated course: {updated_course.title}")
            print(f"   - New price: ${updated_course.price}")
            print(f"   - Featured: {updated_course.is_featured}")
            
            # Test 7: Publish course
            print("\n📢 Test 7: Publishing course...")
            published_course = await CourseService.publish_course(db, course.id, test_user.id)
            print(f"✅ Published course: {published_course.title}")
            print(f"   - Status: {published_course.status}")
            print(f"   - Published at: {published_course.published_at}")
            
            # Test 8: Get course statistics
            print("\n📊 Test 8: Getting course statistics...")
            stats = await CourseService.get_course_stats(db, course.id)
            print(f"✅ Course statistics:")
            print(f"   - Total topics: {len(created_topics)}")
            print(f"   - Total lessons: {len(created_lessons)}")
            print(f"   - Status: {stats.published_courses} published")
            
            # Test 9: List courses with filters
            print("\n🔍 Test 9: Listing courses with filters...")
            from app.schemas.course import CourseFilter
            filters = CourseFilter(
                search="Python",
                difficulty_level="beginner",
                organization_id=test_org.id
            )
            courses, total = await CourseService.get_courses(db, skip=0, limit=10, filters=filters)
            print(f"✅ Found {total} courses matching filters")
            for c in courses:
                print(f"   - {c.title} (${c.price})")
            
            print("\n🎉 All Course CRUD tests completed successfully!")
            
        except Exception as e:
            print(f"❌ Test failed with error: {str(e)}")
            import traceback
            traceback.print_exc()
        finally:
            # Cleanup - delete test data
            print("\n🧹 Cleaning up test data...")
            try:
                # Delete in reverse order to handle foreign key constraints
                for lesson in created_lessons:
                    await db.delete(lesson)
                
                for topic in created_topics:
                    await db.delete(topic)
                
                await db.delete(course)
                await db.delete(test_user)
                await db.delete(test_org)
                await db.commit()
                print("✅ Cleanup completed")
            except Exception as e:
                print(f"⚠️ Cleanup error: {str(e)}")


if __name__ == "__main__":
    asyncio.run(test_course_crud())
