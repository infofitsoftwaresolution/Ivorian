"""
Test script for course management functionality
"""
import asyncio
import sys
from pathlib import Path
import uuid

# Add the backend directory to the Python path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy.orm import Session
from app.core.database import get_db, init_db
from app.services.course import CourseService, TopicService, LessonService, EnrollmentService
from app.services.user import UserService
from app.services.auth import AuthService
from app.schemas.course import (
    CourseCreate, CourseUpdate, TopicCreate, LessonCreate,
    DifficultyLevel, EnrollmentStatus
)
from app.schemas.auth import UserRegister, OrganizationRegister
from app.schemas.user import UserCreate


async def test_course_management():
    """Test course management functionality"""
    print("🧪 Testing Course Management System...")
    
    # Initialize database
    await init_db()
    
    # Get database session
    db = next(get_db())
    
    try:
        # 1. Create test organization and users
        print("\n1. Creating test organization and users...")
        
        # Create organization
        org_data = OrganizationRegister(
            name="Test Academy",
            description="A test organization for course management",
            website="https://testacademy.com",
            contact_email="admin@testacademy.com",
            contact_phone="+1234567890",
            address="123 Test Street, Test City",
            industry="Education",
            size="medium"
        )
        
        org = await AuthService.register_organization(db, org_data)
        print(f"✅ Created organization: {org.name}")
        
        # Create instructor user
        instructor_data = UserCreate(
            email=f"instructor_{uuid.uuid4().hex[:8]}@test.com",
            password="testpass123",
            first_name="John",
            last_name="Instructor",
            organization_id=org.id,
            phone="+1234567891",
            bio="Experienced instructor in various subjects"
        )
        
        instructor = await UserService.create_user(db, instructor_data)
        print(f"✅ Created instructor: {instructor.first_name} {instructor.last_name}")
        
        # Create student user
        student_data = UserCreate(
            email=f"student_{uuid.uuid4().hex[:8]}@test.com",
            password="testpass123",
            first_name="Jane",
            last_name="Student",
            organization_id=org.id,
            phone="+1234567892",
            bio="Eager student ready to learn"
        )
        
        student = await UserService.create_user(db, student_data)
        print(f"✅ Created student: {student.first_name} {student.last_name}")
        
        # 2. Create a course
        print("\n2. Creating a test course...")
        
        course_data = CourseCreate(
            title="Introduction to Python Programming",
            description="Learn the fundamentals of Python programming language",
            organization_id=org.id,
            price=99.99,
            difficulty_level=DifficultyLevel.BEGINNER,
            duration_hours=20,
            tags=["python", "programming", "beginner"],
            is_published=True
        )
        
        course = await CourseService.create_course(db, course_data, instructor.id)
        print(f"✅ Created course: {course.title}")
        print(f"   - Price: ${course.price}")
        print(f"   - Difficulty: {course.difficulty_level}")
        print(f"   - Duration: {course.duration_hours} hours")
        
        # 3. Create topics for the course
        print("\n3. Creating topics for the course...")
        
        topics_data = [
            TopicCreate(
                title="Getting Started with Python",
                description="Basic setup and introduction to Python",
                order_index=1
            ),
            TopicCreate(
                title="Variables and Data Types",
                description="Understanding different data types in Python",
                order_index=2
            ),
            TopicCreate(
                title="Control Flow",
                description="Conditionals and loops in Python",
                order_index=3
            )
        ]
        
        topics = []
        for topic_data in topics_data:
            topic_data.course_id = course.id
            topic = await TopicService.create_topic(db, topic_data, instructor.id)
            topics.append(topic)
            print(f"✅ Created topic: {topic.title}")
        
        # 4. Create lessons for each topic
        print("\n4. Creating lessons for topics...")
        
        lessons_data = [
            # Topic 1: Getting Started
            LessonCreate(
                title="Installing Python",
                content="Step-by-step guide to install Python on your system",
                video_url="https://example.com/videos/install-python",
                duration_minutes=15,
                order_index=1,
                is_free=True
            ),
            LessonCreate(
                title="Your First Python Program",
                content="Write and run your first 'Hello World' program",
                video_url="https://example.com/videos/hello-world",
                duration_minutes=20,
                order_index=2,
                is_free=True
            ),
            # Topic 2: Variables and Data Types
            LessonCreate(
                title="Understanding Variables",
                content="Learn about variables and how to use them",
                video_url="https://example.com/videos/variables",
                duration_minutes=25,
                order_index=1,
                is_free=False
            ),
            LessonCreate(
                title="Numbers and Strings",
                content="Working with numeric and string data types",
                video_url="https://example.com/videos/data-types",
                duration_minutes=30,
                order_index=2,
                is_free=False
            ),
            # Topic 3: Control Flow
            LessonCreate(
                title="If Statements",
                content="Making decisions in your code with if statements",
                video_url="https://example.com/videos/if-statements",
                duration_minutes=25,
                order_index=1,
                is_free=False
            ),
            LessonCreate(
                title="Loops and Iterations",
                content="Repeating code with for and while loops",
                video_url="https://example.com/videos/loops",
                duration_minutes=35,
                order_index=2,
                is_free=False
            )
        ]
        
        lessons = []
        topic_index = 0
        for i, lesson_data in enumerate(lessons_data):
            # Assign lessons to topics (2 lessons per topic)
            if i > 0 and i % 2 == 0:
                topic_index += 1
            
            lesson_data.topic_id = topics[topic_index].id
            lesson = await LessonService.create_lesson(db, lesson_data, instructor.id)
            lessons.append(lesson)
            print(f"✅ Created lesson: {lesson.title} (Topic: {topics[topic_index].title})")
        
        # 5. Test course retrieval and filtering
        print("\n5. Testing course retrieval and filtering...")
        
        # Get course with details
        course_detail = await CourseService.get_course_with_details(db, course.id)
        print(f"✅ Retrieved course with {len(course_detail.topics)} topics")
        
        # Get courses with filtering
        from app.schemas.course import CourseFilter
        filters = CourseFilter(
            search="Python",
            difficulty_level=DifficultyLevel.BEGINNER,
            is_published=True
        )
        
        courses, total = await CourseService.get_courses(db, skip=0, limit=10, filters=filters)
        print(f"✅ Found {total} courses matching filters")
        
        # 6. Test enrollment functionality
        print("\n6. Testing enrollment functionality...")
        
        # Enroll student in course
        enrollment = await EnrollmentService.enroll_in_course(db, course.id, student.id)
        print(f"✅ Enrolled student {student.first_name} in course")
        print(f"   - Enrollment ID: {enrollment.id}")
        print(f"   - Status: {enrollment.status}")
        print(f"   - Progress: {enrollment.progress_percentage}%")
        
        # Get course enrollments
        enrollments, total_enrollments = await EnrollmentService.get_course_enrollments(db, course.id)
        print(f"✅ Course has {total_enrollments} enrollments")
        
        # 7. Test course statistics
        print("\n7. Testing course statistics...")
        
        stats = await CourseService.get_course_stats(db, course.id)
        print(f"✅ Course Statistics:")
        print(f"   - Total enrollments: {stats.total_enrollments}")
        print(f"   - Active enrollments: {stats.active_enrollments}")
        print(f"   - Total lessons: {stats.total_lessons}")
        print(f"   - Total topics: {stats.total_topics}")
        print(f"   - Average progress: {stats.average_progress:.1f}%")
        print(f"   - Total revenue: ${stats.total_revenue:.2f}")
        
        # 8. Test topic and lesson retrieval
        print("\n8. Testing topic and lesson retrieval...")
        
        # Get topics for course
        course_topics = await TopicService.get_course_topics(db, course.id)
        print(f"✅ Retrieved {len(course_topics)} topics for course")
        
        # Get lessons for first topic
        first_topic_lessons = await LessonService.get_topic_lessons(db, topics[0].id)
        print(f"✅ Retrieved {len(first_topic_lessons)} lessons for first topic")
        
        # 9. Test course update
        print("\n9. Testing course update...")
        
        update_data = CourseUpdate(
            title="Advanced Python Programming",
            description="Comprehensive Python programming course for beginners",
            price=149.99,
            difficulty_level=DifficultyLevel.INTERMEDIATE
        )
        
        updated_course = await CourseService.update_course(db, course.id, update_data, instructor.id)
        print(f"✅ Updated course: {updated_course.title}")
        print(f"   - New price: ${updated_course.price}")
        print(f"   - New difficulty: {updated_course.difficulty_level}")
        
        print("\n🎉 All course management tests completed successfully!")
        
    except Exception as e:
        print(f"❌ Error during testing: {str(e)}")
        import traceback
        traceback.print_exc()
    
    finally:
        db.close()


if __name__ == "__main__":
    # Set event loop policy for Windows
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    
    # Run the test
    asyncio.run(test_course_management())
