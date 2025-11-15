"""
Test script to verify course, topic, and lesson persistence
"""
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.course import Course, Topic, Lesson
from app.services.course import CourseService, TopicService, LessonService
from app.schemas.course import CourseCreate, TopicCreate, LessonCreate

async def test_course_persistence():
    """Test course, topic, and lesson creation and retrieval"""
    
    # Get database session
    async for db in get_db():
        try:
            print("🔍 Testing Course Persistence...")
            
            # Test 1: Check if courses exist
            courses_result = await db.execute(select(Course))
            courses = courses_result.scalars().all()
            print(f"📊 Total courses in database: {len(courses)}")
            
            if courses:
                course = courses[-1]  # Get latest course
                print(f"📖 Latest course: ID={course.id}, Title='{course.title}'")
                
                # Test 2: Check topics for this course
                topics_result = await db.execute(select(Topic).where(Topic.course_id == course.id))
                topics = topics_result.scalars().all()
                print(f"📑 Topics for course {course.id}: {len(topics)}")
                
                for topic in topics:
                    print(f"  - Topic {topic.id}: '{topic.title}' (order: {topic.order})")
                    
                    # Test 3: Check lessons for each topic
                    lessons_result = await db.execute(select(Lesson).where(Lesson.topic_id == topic.id))
                    lessons = lessons_result.scalars().all()
                    print(f"    📚 Lessons for topic {topic.id}: {len(lessons)}")
                    
                    for lesson in lessons:
                        print(f"      - Lesson {lesson.id}: '{lesson.title}' (type: {lesson.content_type})")
                
                # Test 4: Test get_course_with_details
                print(f"\n🔍 Testing get_course_with_details for course {course.id}...")
                detailed_course = await CourseService.get_course_with_details(db, course.id)
                if detailed_course:
                    print(f"✅ Course loaded with details:")
                    print(f"   - Course: {detailed_course.title}")
                    print(f"   - Topics from relationship: {len(detailed_course.topics)}")
                    for topic in detailed_course.topics:
                        print(f"     - Topic: {topic.title} (lessons: {len(topic.lessons)})")
                        for lesson in topic.lessons:
                            print(f"       - Lesson: {lesson.title}")
                else:
                    print("❌ Failed to load course with details")
            else:
                print("❌ No courses found in database")
                
        except Exception as e:
            print(f"❌ Error during testing: {e}")
            import traceback
            traceback.print_exc()
        finally:
            await db.close()
            break

if __name__ == "__main__":
    asyncio.run(test_course_persistence())
