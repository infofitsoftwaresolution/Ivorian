"""
Course API endpoints for the LMS application
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import math

from app.core.database import get_db
from app.core.dependencies import get_current_user
# from app.core.rbac import require_permission, require_role  # Temporarily disabled
from app.models.user import User
from app.schemas.course import (
    CourseCreate, CourseUpdate, CourseResponse, CourseListResponse, CourseFilter,
    TopicCreate, TopicUpdate, TopicResponse, TopicWithLessons,
    LessonCreate, LessonUpdate, LessonResponse,
    EnrollmentCreate, EnrollmentUpdate, EnrollmentResponse,
    CourseDetail, CoursePricing, CourseStats,
    LessonAttachmentCreate, LessonAttachmentUpdate, LessonAttachmentResponse,
    CourseInstructorCreate, CourseInstructorUpdate, CourseInstructorResponse,
    BulkEnrollmentCreate, BulkEnrollmentResponse, EnrollmentAnalytics
)
from app.models.course import CourseStatus
from app.services.course import CourseService, TopicService, LessonService, EnrollmentService, LessonAttachmentService, CourseInstructorService

router = APIRouter()


# Course Management Endpoints
@router.post("/", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
# @require_permission("course:create")  # Temporarily disabled
async def create_course(
    course_data: CourseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new course"""
    course = await CourseService.create_course(db, course_data, current_user.id)
    return course


@router.get("/", response_model=CourseListResponse)
async def get_courses(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Page size"),
    skip: Optional[int] = Query(None, ge=0, description="Number of records to skip (alternative to page)"),
    limit: Optional[int] = Query(None, ge=1, le=1000, description="Number of records to return (alternative to size)"),
    search: Optional[str] = Query(None, description="Search term for course title/description"),
    difficulty_level: Optional[str] = Query(None, description="Filter by difficulty level"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price filter"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price filter"),
    status: Optional[str] = Query(None, description="Filter by course status"),
    organization_id: Optional[int] = Query(None, description="Filter by organization"),
    category: Optional[str] = Query(None, description="Filter by category"),
    is_featured: Optional[bool] = Query(None, description="Filter by featured status"),
    db: AsyncSession = Depends(get_db)
):
    """Get courses with filtering and pagination"""
    # Use skip/limit if provided, otherwise calculate from page/size
    if skip is not None and limit is not None:
        actual_skip = skip
        actual_limit = limit
    else:
        actual_skip = (page - 1) * size
        actual_limit = size
    
    # Convert status string to CourseStatus enum if provided
    status_enum = None
    if status:
        try:
            # Normalize status to lowercase for comparison
            status_lower = status.lower().strip()
            # Try to match enum value
            for enum_member in CourseStatus:
                if enum_member.value.lower() == status_lower:
                    status_enum = enum_member
                    break
            # If no match found, try direct conversion
            if status_enum is None:
                status_enum = CourseStatus(status_lower)
        except (ValueError, AttributeError) as e:
            # Invalid status value, will be ignored
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Invalid status value '{status}', ignoring filter: {str(e)}")
            pass
    
    filters = CourseFilter(
        search=search,
        difficulty_level=difficulty_level,
        min_price=min_price,
        max_price=max_price,
        status=status_enum,
        organization_id=organization_id,
        category=category,
        is_featured=is_featured
    )
    
    courses, total = await CourseService.get_courses(db, actual_skip, actual_limit, filters)
    
    pages = math.ceil(total / actual_limit) if total > 0 else 0
    current_page = (actual_skip // actual_limit) + 1 if actual_limit > 0 else 1
    
    return CourseListResponse(
        courses=courses,
        total=total,
        page=current_page,
        size=actual_limit,
        pages=pages
    )


@router.get("/{course_id}", response_model=CourseDetail)
async def get_course(
    course_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a course by ID with all details"""
    course = await CourseService.get_course_with_details(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Calculate additional stats
    total_lessons = sum(len(topic.lessons) for topic in course.topics)
    enrollment_count = len(course.enrollments)
    
    # Get primary instructor
    primary_instructor = None
    if course.instructors:
        # Find primary instructor or use the first one
        primary_instructor = next(
            (inst.instructor for inst in course.instructors if inst.is_primary), 
            course.instructors[0].instructor if course.instructors else None
        )
    
    # Create course detail response - exclude conflicting fields from __dict__
    course_dict = course.__dict__.copy()
    course_dict.update({
        'total_lessons': total_lessons,  # Update with calculated value
        'enrollment_count': enrollment_count,
        'instructor': {
            "id": primary_instructor.id,
            "name": f"{primary_instructor.first_name} {primary_instructor.last_name}",
            "email": primary_instructor.email
        } if primary_instructor else None,
        'organization': {
            "id": course.organization.id,
            "name": course.organization.name,
            "description": course.organization.description
        } if course.organization else None
    })
    
    course_detail = CourseDetail(**course_dict)
    
    return course_detail


@router.put("/{course_id}", response_model=CourseResponse)
# @require_permission("course:update")  # Temporarily disabled
async def update_course(
    course_id: int,
    course_data: CourseUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a course"""
    course = await CourseService.update_course(db, course_id, course_data, current_user.id)
    return course


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
# @require_permission("course:delete")  # Temporarily disabled
async def delete_course(
    course_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a course"""
    await CourseService.delete_course(db, course_id, current_user.id)


@router.post("/{course_id}/pricing", response_model=CourseResponse)
# @require_permission("course:update")  # Temporarily disabled
async def set_course_pricing(
    course_id: int,
    pricing_data: CoursePricing,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Set course pricing"""
    course = await CourseService.set_course_pricing(db, course_id, pricing_data, current_user.id)
    return course


@router.post("/{course_id}/publish", response_model=CourseResponse)
# @require_permission("course:update")  # Temporarily disabled
async def publish_course(
    course_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Publish a course"""
    course = await CourseService.publish_course(db, course_id, current_user.id)
    return course


@router.post("/{course_id}/archive", response_model=CourseResponse)
# @require_permission("course:update")  # Temporarily disabled
async def archive_course(
    course_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Archive a course"""
    course = await CourseService.archive_course(db, course_id, current_user.id)
    return course


@router.get("/{course_id}/stats", response_model=CourseStats)
# @require_permission("course:read")  # Temporarily disabled
async def get_course_stats(
    course_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get course statistics"""
    stats = await CourseService.get_course_stats(db, course_id)
    return stats


# Topic Management Endpoints
@router.post("/{course_id}/topics", response_model=TopicResponse, status_code=status.HTTP_201_CREATED)
# @require_permission("topic:create")  # Temporarily disabled
async def create_topic(
    course_id: int,
    topic_data: TopicCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new topic for a course"""
    try:
        print(f"🔍 Creating topic for course {course_id}")
        print(f"📝 Topic data received: {topic_data}")
        print(f"👤 Current user: {current_user.id}")
        
        # Pass course_id directly to service since it's not in TopicCreate schema
        print(f"📋 Topic create data: {topic_data}")
        
        topic = await TopicService.create_topic(db, topic_data, course_id, current_user.id)
        
        print(f"✅ Topic created successfully: {topic.id}")
        return topic
        
    except Exception as e:
        print(f"❌ Error creating topic: {str(e)}")
        print(f"🔍 Error type: {type(e)}")
        import traceback
        traceback.print_exc()
        raise e


@router.get("/{course_id}/topics", response_model=List[TopicWithLessons])
async def get_course_topics(
    course_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get all topics for a course"""
    print(f"🔍 Getting topics for course {course_id}")
    topics = await TopicService.get_course_topics(db, course_id)
    print(f"📚 Found {len(topics)} topics for course {course_id}")
    for topic in topics:
        print(f"  - Topic {topic.id}: {topic.title} with {len(topic.lessons)} lessons")
    return topics


@router.get("/topics/{topic_id}", response_model=TopicWithLessons)
async def get_topic_with_lessons(
    topic_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a topic with all its lessons"""
    topic = await TopicService.get_topic(db, topic_id)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    lessons = await LessonService.get_topic_lessons(db, topic_id)
    
    topic_with_lessons = TopicWithLessons(
        **topic.__dict__,
        lessons=lessons
    )
    
    return topic_with_lessons


@router.put("/topics/{topic_id}", response_model=TopicResponse)
# @require_permission("topic:update")  # Temporarily disabled
async def update_topic(
    topic_id: int,
    topic_data: TopicUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a topic"""
    topic = await TopicService.update_topic(db, topic_id, topic_data, current_user.id)
    return topic


@router.delete("/topics/{topic_id}", status_code=status.HTTP_204_NO_CONTENT)
# @require_permission("topic:delete")  # Temporarily disabled
async def delete_topic(
    topic_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a topic"""
    await TopicService.delete_topic(db, topic_id, current_user.id)


# Lesson Management Endpoints
@router.post("/topics/{topic_id}/lessons", response_model=LessonResponse, status_code=status.HTTP_201_CREATED)
# @require_permission("lesson:create")  # Temporarily disabled
async def create_lesson(
    topic_id: int,
    lesson_data: LessonCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new lesson for a topic"""
    # Pass topic_id directly to service since it's not in LessonCreate schema
    lesson = await LessonService.create_lesson(db, lesson_data, topic_id, current_user.id)
    return lesson


@router.get("/topics/{topic_id}/lessons", response_model=List[LessonResponse])
async def get_topic_lessons(
    topic_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get all lessons for a topic"""
    lessons = await LessonService.get_topic_lessons(db, topic_id)
    return lessons


@router.get("/lessons/{lesson_id}", response_model=LessonResponse)
async def get_lesson(
    lesson_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a lesson by ID"""
    lesson = await LessonService.get_lesson(db, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson


@router.put("/lessons/{lesson_id}", response_model=LessonResponse)
# @require_permission("lesson:update")  # Temporarily disabled
async def update_lesson(
    lesson_id: int,
    lesson_data: LessonUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a lesson"""
    lesson = await LessonService.update_lesson(db, lesson_id, lesson_data, current_user.id)
    return lesson


@router.delete("/lessons/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
# @require_permission("lesson:delete")  # Temporarily disabled
async def delete_lesson(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a lesson"""
    await LessonService.delete_lesson(db, lesson_id, current_user.id)


# Enrollment Management Endpoints
@router.post("/{course_id}/enroll", response_model=EnrollmentResponse, status_code=status.HTTP_201_CREATED)
# @require_role("student")  # Temporarily disabled
async def enroll_in_course(
    course_id: int,
    student_id: Optional[int] = Query(None, description="Student ID to enroll (for tutors)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Enroll current user or specified student in a course"""
    print(f"🔍 Enrollment request - Course ID: {course_id}, Student ID: {student_id}, Current User: {current_user.id}")
    
    # Use provided student_id or current user's id
    target_student_id = student_id if student_id else current_user.id
    print(f"🎯 Target student ID: {target_student_id}")
    
    # If enrolling someone else, check permissions
    if student_id and student_id != current_user.id:
        print(f"🔐 Checking permissions for user {current_user.id} with role {current_user.role}")
        # Check if current user is instructor, tutor, or admin
        if current_user.role not in ["instructor", "tutor", "organization_admin", "super_admin"]:
            print(f"❌ Permission denied for role: {current_user.role}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to enroll other students"
            )
        print(f"✅ Permission granted for role: {current_user.role}")
    
    print(f"📝 Calling EnrollmentService.enroll_in_course with course_id={course_id}, student_id={target_student_id}")
    enrollment = await EnrollmentService.enroll_in_course(db, course_id, target_student_id)
    print(f"✅ Enrollment created: {enrollment.id}")
    return enrollment


@router.get("/{course_id}/enrollments", response_model=List[EnrollmentResponse])
# @require_permission("enrollment:read")  # Temporarily disabled
async def get_course_enrollments(
    course_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get enrollments for a course (instructor/organization admin only)"""
    enrollments, _ = await EnrollmentService.get_course_enrollments(db, course_id, skip, limit)
    return enrollments


@router.put("/enrollments/{enrollment_id}", response_model=EnrollmentResponse)
# @require_permission("enrollment:update")  # Temporarily disabled
async def update_enrollment(
    enrollment_id: int,
    enrollment_data: EnrollmentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an enrollment"""
    enrollment = await EnrollmentService.update_enrollment(db, enrollment_id, enrollment_data)
    return enrollment


@router.delete("/enrollments/{enrollment_id}", status_code=status.HTTP_204_NO_CONTENT)
# @require_permission("enrollment:delete")  # Temporarily disabled
async def cancel_enrollment(
    enrollment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cancel an enrollment"""
    await EnrollmentService.cancel_enrollment(db, enrollment_id)


# Lesson Attachment Management Endpoints
@router.post("/lessons/{lesson_id}/attachments", response_model=LessonAttachmentResponse, status_code=status.HTTP_201_CREATED)
# @require_permission("attachment:create")  # Temporarily disabled
async def create_lesson_attachment(
    lesson_id: int,
    attachment_data: LessonAttachmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new lesson attachment"""
    # Set lesson_id from URL parameter
    attachment_data.lesson_id = lesson_id
    attachment = await LessonAttachmentService.create_attachment(db, attachment_data, current_user.id)
    return attachment


@router.get("/lessons/{lesson_id}/attachments", response_model=List[LessonAttachmentResponse])
async def get_lesson_attachments(
    lesson_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get all attachments for a lesson"""
    attachments = await LessonAttachmentService.get_lesson_attachments(db, lesson_id)
    return attachments


@router.get("/attachments/{attachment_id}", response_model=LessonAttachmentResponse)
async def get_lesson_attachment(
    attachment_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a lesson attachment by ID"""
    attachment = await LessonAttachmentService.get_attachment(db, attachment_id)
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
    return attachment


@router.put("/attachments/{attachment_id}", response_model=LessonAttachmentResponse)
# @require_permission("attachment:update")  # Temporarily disabled
async def update_lesson_attachment(
    attachment_id: int,
    attachment_data: LessonAttachmentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a lesson attachment"""
    attachment = await LessonAttachmentService.update_attachment(db, attachment_id, attachment_data, current_user.id)
    return attachment


@router.delete("/attachments/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
# @require_permission("attachment:delete")  # Temporarily disabled
async def delete_lesson_attachment(
    attachment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a lesson attachment"""
    await LessonAttachmentService.delete_attachment(db, attachment_id, current_user.id)


@router.post("/attachments/{attachment_id}/download")
async def download_lesson_attachment(
    attachment_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Download a lesson attachment (increments download count)"""
    attachment = await LessonAttachmentService.get_attachment(db, attachment_id)
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
    
    # Increment download count
    await LessonAttachmentService.increment_download_count(db, attachment_id)
    
    return {
        "message": "Download initiated",
        "file_url": attachment.file_url,
        "file_name": attachment.title
    }


# Course Instructor Management Endpoints
@router.post("/{course_id}/instructors", response_model=CourseInstructorResponse, status_code=status.HTTP_201_CREATED)
# @require_permission("instructor:assign")  # Temporarily disabled
async def assign_instructor(
    course_id: int,
    instructor_data: CourseInstructorCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Assign an instructor to a course"""
    course_instructor = await CourseInstructorService.assign_instructor(db, course_id, instructor_data, current_user.id)
    
    # Add instructor details to response
    result = await db.execute(select(User).where(User.id == course_instructor.instructor_id))
    instructor = result.scalar_one_or_none()
    
    response_data = course_instructor.__dict__.copy()
    response_data['instructor'] = {
        "id": instructor.id,
        "first_name": instructor.first_name,
        "last_name": instructor.last_name,
        "email": instructor.email,
        "role": instructor.role
    } if instructor else None
    
    return response_data


@router.get("/{course_id}/instructors", response_model=List[CourseInstructorResponse])
async def get_course_instructors(
    course_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get all instructors for a course"""
    instructors = await CourseInstructorService.get_course_instructors(db, course_id)
    
    # Add instructor details to each response
    response_data = []
    for instructor in instructors:
        instructor_dict = instructor.__dict__.copy()
        instructor_dict['instructor'] = {
            "id": instructor.instructor.id,
            "first_name": instructor.instructor.first_name,
            "last_name": instructor.instructor.last_name,
            "email": instructor.instructor.email,
            "role": instructor.instructor.role
        } if instructor.instructor else None
        response_data.append(instructor_dict)
    
    return response_data


@router.put("/{course_id}/instructors/{instructor_id}", response_model=CourseInstructorResponse)
# @require_permission("instructor:update")  # Temporarily disabled
async def update_instructor_permissions(
    course_id: int,
    instructor_id: int,
    instructor_data: CourseInstructorUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update instructor permissions for a course"""
    course_instructor = await CourseInstructorService.update_instructor_permissions(
        db, course_id, instructor_id, instructor_data, current_user.id
    )
    
    # Add instructor details to response
    result = await db.execute(select(User).where(User.id == course_instructor.instructor_id))
    instructor = result.scalar_one_or_none()
    
    response_data = course_instructor.__dict__.copy()
    response_data['instructor'] = {
        "id": instructor.id,
        "first_name": instructor.first_name,
        "last_name": instructor.last_name,
        "email": instructor.email,
        "role": instructor.role
    } if instructor else None
    
    return response_data


@router.delete("/{course_id}/instructors/{instructor_id}", status_code=status.HTTP_204_NO_CONTENT)
# @require_permission("instructor:remove")  # Temporarily disabled
async def remove_instructor(
    course_id: int,
    instructor_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove an instructor from a course"""
    await CourseInstructorService.remove_instructor(db, course_id, instructor_id, current_user.id)


# Bulk Enrollment and Analytics Endpoints
@router.post("/{course_id}/enrollments/bulk", response_model=BulkEnrollmentResponse, status_code=status.HTTP_201_CREATED)
# @require_permission("enrollment:bulk_create")  # Temporarily disabled
async def bulk_enroll_students(
    course_id: int,
    bulk_data: BulkEnrollmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Bulk enroll students in a course"""
    result = await EnrollmentService.bulk_enroll_students(db, course_id, bulk_data, current_user.id)
    return result


@router.get("/{course_id}/enrollments/analytics", response_model=EnrollmentAnalytics)
# @require_permission("enrollment:analytics")  # Temporarily disabled
async def get_enrollment_analytics(
    course_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get comprehensive enrollment analytics for a course"""
    analytics = await EnrollmentService.get_enrollment_analytics(db, course_id)
    return analytics


# Debug endpoint to check enrollments
@router.get("/debug/enrollments")
async def debug_enrollments(
    db: AsyncSession = Depends(get_db)
):
    """Debug endpoint to check all enrollments in the database"""
    from sqlalchemy import text
    
    # Get all enrollments
    result = await db.execute(text("SELECT * FROM enrollments"))
    enrollments = result.fetchall()
    
    # Get all courses
    result = await db.execute(text("SELECT id, title, status FROM courses"))
    courses = result.fetchall()
    
    # Get all users with student role
    result = await db.execute(text("SELECT id, first_name, last_name, email, role FROM users WHERE role = 'student'"))
    students = result.fetchall()
    
    return {
        "enrollments": [dict(row._mapping) for row in enrollments],
        "courses": [dict(row._mapping) for row in courses],
        "students": [dict(row._mapping) for row in students],
        "total_enrollments": len(enrollments),
        "total_courses": len(courses),
        "total_students": len(students)
    } 