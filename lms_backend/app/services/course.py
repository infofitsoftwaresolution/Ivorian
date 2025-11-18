"""
Course service for the LMS application
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import and_, or_, func, desc, select, cast, String
from fastapi import HTTPException, status
from datetime import datetime, timedelta, timezone

from app.models.course import Course, Topic, Lesson, Enrollment, LessonProgress, CourseInstructor, CourseReview, LessonAttachment, CourseStatus
from app.models.user import User
from app.models.organization import Organization
from app.schemas.course import (
    CourseCreate, CourseUpdate, CourseFilter, CoursePricing,
    TopicCreate, TopicUpdate, LessonCreate, LessonUpdate,
    EnrollmentCreate, EnrollmentUpdate, CourseStats,
    LessonAttachmentCreate, LessonAttachmentUpdate,
    CourseInstructorCreate, CourseInstructorUpdate,
    BulkEnrollmentCreate, BulkEnrollmentResponse, BulkEnrollmentResult
)
from app.core.errors import ResourceNotFoundError, AuthorizationError, ValidationError


class CourseService:
    """Service class for course management"""
    
    @staticmethod
    async def create_course(db: AsyncSession, course_data: CourseCreate, created_by: int) -> Course:
        """Create a new course"""
        # Verify organization exists and user has access
        result = await db.execute(select(Organization).where(Organization.id == course_data.organization_id))
        organization = result.scalar_one_or_none()
        if not organization:
            raise ResourceNotFoundError("Organization not found")
        
        # Generate slug from title
        slug = course_data.title.lower().replace(" ", "-").replace("_", "-")
        
        # Create course
        course = Course(
            title=course_data.title,
            slug=slug,
            description=course_data.description,
            short_description=course_data.short_description,
            difficulty_level=course_data.difficulty_level,
            category=course_data.category,
            tags=course_data.tags,
            organization_id=course_data.organization_id,
            created_by=created_by,
            price=course_data.price,
            currency=course_data.currency,
            enrollment_type=course_data.enrollment_type,
            start_date=course_data.start_date,
            duration_weeks=course_data.duration_weeks,
            max_students=course_data.max_students,
            prerequisites=course_data.prerequisites,
            learning_objectives=course_data.learning_objectives,
            status="draft"
        )
        
        db.add(course)
        await db.commit()
        await db.refresh(course)
        
        return course
    
    @staticmethod
    async def get_course(db: AsyncSession, course_id: int) -> Optional[Course]:
        """Get a course by ID"""
        result = await db.execute(select(Course).where(Course.id == course_id))
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_course_with_details(db: AsyncSession, course_id: int) -> Optional[Course]:
        """Get a course with all related details"""
        result = await db.execute(
            select(Course)
            .options(
                selectinload(Course.organization),
                selectinload(Course.creator),
                selectinload(Course.topics).selectinload(Topic.lessons),
                selectinload(Course.enrollments),
                selectinload(Course.instructors),
                selectinload(Course.reviews)
            )
            .where(Course.id == course_id)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_courses(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[CourseFilter] = None
    ) -> tuple[List[Course], int]:
        """Get courses with filtering and pagination"""
        query = select(Course)
        
        if filters:
            if filters.search:
                search_term = f"%{filters.search}%"
                query = query.where(
                    or_(
                        Course.title.ilike(search_term),
                        Course.description.ilike(search_term)
                    )
                )
            
            if filters.difficulty_level:
                query = query.where(Course.difficulty_level == filters.difficulty_level)
            
            if filters.min_price is not None:
                query = query.where(Course.price >= filters.min_price)
            
            if filters.max_price is not None:
                query = query.where(Course.price <= filters.max_price)
            
            if filters.status is not None:
                # Handle both enum and string status values
                # Database column is VARCHAR, so we need to compare with string value
                # Use case-insensitive comparison to handle different case storage
                status_value = None
                if isinstance(filters.status, CourseStatus):
                    # Use enum's string value
                    status_value = filters.status.value
                elif isinstance(filters.status, str):
                    # Already a string
                    status_value = filters.status
                else:
                    # Try to convert to string
                    status_value = str(filters.status)
                
                # Use case-insensitive comparison (ILIKE for PostgreSQL, or func.lower for cross-database)
                # Cast the column to String to ensure VARCHAR comparison, not enum
                if status_value:
                    # Use func.lower() for case-insensitive comparison
                    query = query.where(func.lower(cast(Course.status, String)) == func.lower(status_value))
            
            if filters.organization_id:
                query = query.where(Course.organization_id == filters.organization_id)
            
            if filters.category:
                query = query.where(Course.category == filters.category)
            
            if filters.is_featured is not None:
                query = query.where(Course.is_featured == filters.is_featured)
        
        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar()
        
        # Apply pagination and ordering
        query = query.order_by(desc(Course.created_at)).offset(skip).limit(limit)
        result = await db.execute(query)
        courses = result.scalars().all()
        
        return courses, total
    
    @staticmethod
    async def update_course(
        db: AsyncSession,
        course_id: int,
        course_data: CourseUpdate,
        user_id: int
    ) -> Course:
        """Update a course"""
        course = await CourseService.get_course(db, course_id)
        if not course:
            raise ResourceNotFoundError("Course not found")
        
        # Check if user has permission to update this course
        if course.created_by != user_id:
            # Check if user is organization admin
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()
            if not user or user.role != "organization_admin":
                raise AuthorizationError("You don't have permission to update this course")
        
        # Update course fields
        update_data = course_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(course, field, value)
        
        await db.commit()
        await db.refresh(course)
        
        return course
    
    @staticmethod
    async def delete_course(db: AsyncSession, course_id: int, user_id: int) -> bool:
        """Delete a course"""
        course = await CourseService.get_course(db, course_id)
        if not course:
            raise ResourceNotFoundError("Course not found")
        
        # Check if user has permission to delete this course
        if course.created_by != user_id:
            # Check if user is organization admin
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()
            if not user or user.role != "organization_admin":
                raise AuthorizationError("You don't have permission to delete this course")
        
        await db.delete(course)
        await db.commit()
        
        return True
    
    @staticmethod
    async def set_course_pricing(
        db: AsyncSession,
        course_id: int,
        pricing_data: CoursePricing,
        user_id: int
    ) -> Course:
        """Set course pricing"""
        course = await CourseService.update_course(
            db, course_id,
            CourseUpdate(price=pricing_data.price),
            user_id
        )
        return course
    
    @staticmethod
    async def publish_course(db: AsyncSession, course_id: int, user_id: int) -> Course:
        """Publish a course"""
        course = await CourseService.get_course(db, course_id)
        if not course:
            raise ResourceNotFoundError("Course not found")
        
        # Check permissions
        if course.created_by != user_id:
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()
            if not user or user.role != "organization_admin":
                raise AuthorizationError("You don't have permission to publish this course")
        
        course.status = "published"
        course.published_at = datetime.now(timezone.utc)
        
        await db.commit()
        await db.refresh(course)
        
        return course
    
    @staticmethod
    async def archive_course(db: AsyncSession, course_id: int, user_id: int) -> Course:
        """Archive a course"""
        course = await CourseService.get_course(db, course_id)
        if not course:
            raise ResourceNotFoundError("Course not found")
        
        # Check permissions
        if course.created_by != user_id:
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()
            if not user or user.role != "organization_admin":
                raise AuthorizationError("You don't have permission to archive this course")
        
        course.status = "archived"
        
        await db.commit()
        await db.refresh(course)
        
        return course
    
    @staticmethod
    async def get_course_stats(db: AsyncSession, course_id: int) -> CourseStats:
        """Get course statistics"""
        course = await CourseService.get_course(db, course_id)
        if not course:
            raise ResourceNotFoundError("Course not found")
        
        # Get enrollment statistics
        enrollments_result = await db.execute(
            select(Enrollment).where(Enrollment.course_id == course_id)
        )
        enrollments = enrollments_result.scalars().all()
        
        total_enrollments = len(enrollments)
        active_enrollments = len([e for e in enrollments if e.status == "active"])
        completed_enrollments = len([e for e in enrollments if e.status == "completed"])
        
        # Calculate average progress
        if enrollments:
            average_progress = sum(e.progress_percentage for e in enrollments) / len(enrollments)
        else:
            average_progress = 0.0
        
        # Get lesson and topic counts
        lessons_result = await db.execute(
            select(func.count(Lesson.id))
            .select_from(Lesson)
            .join(Topic)
            .where(Topic.course_id == course_id)
        )
        total_lessons = lessons_result.scalar()
        
        topics_result = await db.execute(
            select(func.count(Topic.id)).where(Topic.course_id == course_id)
        )
        total_topics = topics_result.scalar()
        
        # Calculate total revenue
        total_revenue = sum(e.payment_amount or 0 for e in enrollments if e.payment_status == "paid")
        
        # Get average rating from reviews
        reviews_result = await db.execute(
            select(func.avg(CourseReview.rating))
            .where(CourseReview.course_id == course_id)
        )
        average_rating = reviews_result.scalar() or 0.0
        
        return CourseStats(
            total_courses=1,  # This is for a single course
            published_courses=1 if course.status == "published" else 0,
            draft_courses=1 if course.status == "draft" else 0,
            archived_courses=1 if course.status == "archived" else 0,
            total_enrollments=total_enrollments,
            active_enrollments=active_enrollments,
            completed_enrollments=completed_enrollments,
            total_revenue=total_revenue,
            average_rating=average_rating,
            courses_by_category={course.category or "Uncategorized": 1},
            courses_by_difficulty={course.difficulty_level: 1},
            top_courses=[{
                "id": course.id,
                "title": course.title,
                "enrollments": total_enrollments,
                "revenue": total_revenue
            }]
        )


class TopicService:
    """Service class for topic management"""
    
    @staticmethod
    async def create_topic(db: AsyncSession, topic_data: TopicCreate, course_id: int, user_id: int) -> Topic:
        """Create a new topic"""
        try:
            print(f"[TopicService] Creating topic for course {course_id}")
            print(f"[TopicService] Topic data: {topic_data}")
            print(f"[TopicService] User ID: {user_id}")
            
            # Verify course exists and user has access
            course = await CourseService.get_course(db, course_id)
            print(f"[TopicService] Course found: {course.id if course else 'None'}")
            
            if not course:
                raise ResourceNotFoundError("Course not found")
            
            print(f"[TopicService] Checking permissions - Course created by: {course.created_by}, Current user: {user_id}")
            
            if course.created_by != user_id:
                result = await db.execute(select(User).where(User.id == user_id))
                user = result.scalar_one_or_none()
                print(f"[TopicService] User role: {user.role if user else 'None'}")
                if not user or user.role not in ["organization_admin", "tutor"]:  # Allow tutors too
                    raise AuthorizationError("You don't have permission to create topics for this course")
            
            print(f"[TopicService] Permissions OK, creating topic...")
            
            topic = Topic(
                course_id=course_id,
                title=topic_data.title,
                description=topic_data.description,
                content=topic_data.content,
                order=topic_data.order,
                estimated_duration=topic_data.estimated_duration,
                is_required=topic_data.is_required
            )
            
            print(f"[TopicService] Adding topic to database...")
            db.add(topic)
            await db.commit()
            await db.refresh(topic)
            
            print(f"[TopicService] Topic created successfully with ID: {topic.id}")
            return topic
            
        except Exception as e:
            print(f"[TopicService] ERROR creating topic: {str(e)}")
            print(f"[TopicService] Error type: {type(e)}")
            import traceback
            traceback.print_exc()
            raise e
    
    @staticmethod
    async def get_topic(db: AsyncSession, topic_id: int) -> Optional[Topic]:
        """Get a topic by ID"""
        result = await db.execute(select(Topic).where(Topic.id == topic_id))
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_course_topics(db: AsyncSession, course_id: int) -> List[Topic]:
        """Get all topics for a course"""
        print(f"[TopicService] Getting topics for course {course_id}")
        result = await db.execute(
            select(Topic)
            .options(selectinload(Topic.lessons))
            .where(Topic.course_id == course_id)
            .order_by(Topic.order)
        )
        topics = result.scalars().all()
        print(f"[TopicService] Found {len(topics)} topics for course {course_id}")
        for topic in topics:
            print(f"  - Topic {topic.id}: {topic.title} with {len(topic.lessons)} lessons")
        return topics
    
    @staticmethod
    async def update_topic(
        db: AsyncSession,
        topic_id: int,
        topic_data: TopicUpdate,
        user_id: int
    ) -> Topic:
        """Update a topic"""
        topic = await TopicService.get_topic(db, topic_id)
        if not topic:
            raise ResourceNotFoundError("Topic not found")
        
        # Check if user has permission to update this topic
        course = await CourseService.get_course(db, topic.course_id)
        if course.created_by != user_id:
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()
            if not user or user.role != "organization_admin":
                raise AuthorizationError("You don't have permission to update this topic")
        
        # Update topic fields
        update_data = topic_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(topic, field, value)
        
        await db.commit()
        await db.refresh(topic)
        
        return topic
    
    @staticmethod
    async def delete_topic(db: AsyncSession, topic_id: int, user_id: int) -> bool:
        """Delete a topic"""
        topic = await TopicService.get_topic(db, topic_id)
        if not topic:
            raise ResourceNotFoundError("Topic not found")
        
        # Check if user has permission to delete this topic
        course = await CourseService.get_course(db, topic.course_id)
        if course.created_by != user_id:
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()
            if not user or user.role != "organization_admin":
                raise AuthorizationError("You don't have permission to delete this topic")
        
        await db.delete(topic)
        await db.commit()
        
        return True


class LessonService:
    """Service class for lesson management"""
    
    @staticmethod
    async def create_lesson(db: AsyncSession, lesson_data: LessonCreate, topic_id: int, user_id: int) -> Lesson:
        """Create a new lesson"""
        # Verify topic exists and user has access
        topic = await TopicService.get_topic(db, topic_id)
        if not topic:
            raise ResourceNotFoundError("Topic not found")
        
        course = await CourseService.get_course(db, topic.course_id)
        if course.created_by != user_id:
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()
            if not user or user.role != "organization_admin":
                raise AuthorizationError("You don't have permission to create lessons for this course")
        
        lesson = Lesson(
            topic_id=topic_id,
            title=lesson_data.title,
            description=lesson_data.description,
            content=lesson_data.content,
            video_url=lesson_data.video_url,
            video_duration=lesson_data.video_duration,
            content_type=lesson_data.content_type,
            order=lesson_data.order,
            estimated_duration=lesson_data.estimated_duration,
            is_required=lesson_data.is_required,
            is_free_preview=lesson_data.is_free_preview
        )
        
        db.add(lesson)
        await db.commit()
        await db.refresh(lesson)
        
        return lesson
    
    @staticmethod
    async def get_lesson(db: AsyncSession, lesson_id: int) -> Optional[Lesson]:
        """Get a lesson by ID"""
        result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_topic_lessons(db: AsyncSession, topic_id: int) -> List[Lesson]:
        """Get all lessons for a topic"""
        result = await db.execute(
            select(Lesson)
            .where(Lesson.topic_id == topic_id)
            .order_by(Lesson.order)
        )
        return result.scalars().all()
    
    @staticmethod
    async def update_lesson(
        db: AsyncSession,
        lesson_id: int,
        lesson_data: LessonUpdate,
        user_id: int
    ) -> Lesson:
        """Update a lesson"""
        lesson = await LessonService.get_lesson(db, lesson_id)
        if not lesson:
            raise ResourceNotFoundError("Lesson not found")
        
        # Check if user has permission to update this lesson
        topic = await TopicService.get_topic(db, lesson.topic_id)
        course = await CourseService.get_course(db, topic.course_id)
        if course.created_by != user_id:
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()
            if not user or user.role != "organization_admin":
                raise AuthorizationError("You don't have permission to update this lesson")
        
        # Update lesson fields
        update_data = lesson_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(lesson, field, value)
        
        await db.commit()
        await db.refresh(lesson)
        
        return lesson
    
    @staticmethod
    async def delete_lesson(db: AsyncSession, lesson_id: int, user_id: int) -> bool:
        """Delete a lesson"""
        lesson = await LessonService.get_lesson(db, lesson_id)
        if not lesson:
            raise ResourceNotFoundError("Lesson not found")
        
        # Check if user has permission to delete this lesson
        topic = await TopicService.get_topic(db, lesson.topic_id)
        course = await CourseService.get_course(db, topic.course_id)
        if course.created_by != user_id:
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()
            if not user or user.role != "organization_admin":
                raise AuthorizationError("You don't have permission to delete this lesson")
        
        await db.delete(lesson)
        await db.commit()
        
        return True


class EnrollmentService:
    """Service class for enrollment management"""
    
    @staticmethod
    async def enroll_in_course(
        db: AsyncSession,
        course_id: int,
        student_id: int
    ) -> Enrollment:
        """Enroll a student in a course"""
        print(f"[EnrollmentService] enroll_in_course called with course_id={course_id}, student_id={student_id}")
        
        # Verify course exists and is published
        course = await CourseService.get_course(db, course_id)
        if not course:
            print(f"[EnrollmentService] ERROR: Course not found: {course_id}")
            raise ResourceNotFoundError("Course not found")
        
        print(f"[EnrollmentService] Course found: {course.title}, Status: {course.status}")
        print(f"[EnrollmentService] Course enrollment_type: {course.enrollment_type}")
        print(f"[EnrollmentService] Course price: {course.price}")
        
        # Allow enrollment in draft courses for now (temporary fix)
        if course.status not in ["published", "draft"]:
            print(f"[EnrollmentService] ERROR: Course status not allowed for enrollment: {course.status}")
            raise ValidationError(f"Cannot enroll in course with status: {course.status}")
        
        print(f"[EnrollmentService] Course status is valid for enrollment: {course.status}")
        
        # Check if already enrolled
        print(f"[EnrollmentService] Checking for existing enrollment...")
        result = await db.execute(
            select(Enrollment).where(
                and_(Enrollment.course_id == course_id, Enrollment.student_id == student_id)
            )
        )
        existing_enrollment = result.scalar_one_or_none()
        
        if existing_enrollment:
            print(f"[EnrollmentService] WARNING: Student is already enrolled in this course: {existing_enrollment.id}")
            raise ValidationError("Student is already enrolled in this course")
        
        print(f"[EnrollmentService] No existing enrollment found, creating new enrollment...")
        
        # Create enrollment
        enrollment = Enrollment(
            student_id=student_id,
            course_id=course_id,
            status="active",
            progress_percentage=0.0,
            payment_status="pending" if course.enrollment_type == "paid" else "paid"
        )
        
        print(f"📝 Created enrollment object: student_id={enrollment.student_id}, course_id={enrollment.course_id}")
        
        db.add(enrollment)
        print(f"💾 Added enrollment to database session")
        
        await db.commit()
        print(f"✅ Committed enrollment to database")
        
        await db.refresh(enrollment)
        print(f"🔄 Refreshed enrollment: {enrollment.id}")
        
        return enrollment
    
    @staticmethod
    async def get_course_enrollments(
        db: AsyncSession,
        course_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[List[Enrollment], int]:
        """Get enrollments for a course"""
        try:
            print(f"[EnrollmentService] Getting enrollments for course {course_id}, skip={skip}, limit={limit}")
            
            # Get total count
            count_result = await db.execute(
                select(func.count(Enrollment.id)).where(Enrollment.course_id == course_id)
            )
            total = count_result.scalar() or 0
            print(f"[EnrollmentService] Total enrollments: {total}")
            
            # Get enrollments - don't load course relationship to avoid async serialization issues
            # The course field is optional in EnrollmentResponse, so it will be None
            result = await db.execute(
                select(Enrollment)
                .where(Enrollment.course_id == course_id)
                .offset(skip)
                .limit(limit)
            )
            enrollments = result.scalars().all()
            print(f"[EnrollmentService] Retrieved {len(enrollments)} enrollments")
            
            # Ensure required fields have default values to prevent serialization errors
            for enrollment in enrollments:
                # Set defaults for required fields that might be None
                if enrollment.payment_currency is None or enrollment.payment_currency == '':
                    enrollment.payment_currency = "USD"
                if enrollment.total_lessons is None:
                    enrollment.total_lessons = 0
                if enrollment.completed_lessons is None:
                    enrollment.completed_lessons = 0
                if enrollment.status is None or enrollment.status == '':
                    enrollment.status = "active"
                if enrollment.payment_status is None or enrollment.payment_status == '':
                    enrollment.payment_status = "pending"
                if enrollment.progress_percentage is None:
                    enrollment.progress_percentage = 0.0
                if enrollment.certificate_issued is None:
                    enrollment.certificate_issued = False
                # Ensure enrollment_date is set
                if enrollment.enrollment_date is None:
                    enrollment.enrollment_date = datetime.now(timezone.utc)
                # Ensure created_at is set
                if enrollment.created_at is None:
                    enrollment.created_at = datetime.now(timezone.utc)
            
            return enrollments, total
        except Exception as e:
            print(f"[EnrollmentService] ERROR in get_course_enrollments: {str(e)}")
            import traceback
            traceback.print_exc()
            raise
    
    @staticmethod
    async def update_enrollment(
        db: AsyncSession,
        enrollment_id: int,
        enrollment_data: EnrollmentUpdate
    ) -> Enrollment:
        """Update an enrollment"""
        try:
            result = await db.execute(select(Enrollment).where(Enrollment.id == enrollment_id))
            enrollment = result.scalar_one_or_none()
            if not enrollment:
                raise ResourceNotFoundError("Enrollment not found")
            
            # Update enrollment fields
            update_data = enrollment_data.model_dump(exclude_unset=True)
            print(f"[EnrollmentService] Updating enrollment {enrollment_id} with data: {update_data}")
            
            for field, value in update_data.items():
                # Only update fields that exist on the model
                if hasattr(enrollment, field):
                    try:
                        setattr(enrollment, field, value)
                        print(f"[EnrollmentService] Set {field} = {value}")
                    except Exception as field_error:
                        print(f"[EnrollmentService] Error setting {field}: {str(field_error)}")
                        raise
            
            # Update last_accessed_at when progress is updated
            if 'progress_percentage' in update_data or 'completed_lessons' in update_data:
                try:
                    enrollment.last_accessed_at = datetime.now(timezone.utc)
                    print(f"[EnrollmentService] Updated last_accessed_at")
                except Exception as date_error:
                    print(f"[EnrollmentService] Error setting last_accessed_at: {str(date_error)}")
            
            # If status is completed, set completion_date
            if enrollment_data.status == "completed" and not enrollment.completion_date:
                try:
                    enrollment.completion_date = datetime.now(timezone.utc)
                    print(f"[EnrollmentService] Set completion_date")
                except Exception as date_error:
                    print(f"[EnrollmentService] Error setting completion_date: {str(date_error)}")
            
            print(f"[EnrollmentService] Committing enrollment update...")
            await db.commit()
            
            # Re-fetch the enrollment using explicit column selection to avoid relationship loading issues
            # This is safer than refresh() which might try to load relationships
            try:
                result = await db.execute(
                    select(
                        Enrollment.id,
                        Enrollment.course_id,
                        Enrollment.student_id,
                        Enrollment.status,
                        Enrollment.progress_percentage,
                        Enrollment.completed_lessons,
                        Enrollment.total_lessons,
                        Enrollment.enrollment_date,
                        Enrollment.completion_date,
                        Enrollment.last_accessed_at,
                        Enrollment.payment_status,
                        Enrollment.payment_amount,
                        Enrollment.payment_currency,
                        Enrollment.payment_method,
                        Enrollment.payment_transaction_id,
                        Enrollment.certificate_issued,
                        Enrollment.certificate_url,
                        Enrollment.certificate_issued_at,
                        Enrollment.created_at,
                        Enrollment.updated_at
                    ).where(Enrollment.id == enrollment_id)
                )
                enrollment_row = result.first()
                if enrollment_row:
                    # Create a simple object with the fetched data
                    class EnrollmentData:
                        def __init__(self, row):
                            self.id = row.id
                            self.course_id = row.course_id
                            self.student_id = row.student_id
                            self.status = row.status
                            self.progress_percentage = row.progress_percentage
                            self.completed_lessons = row.completed_lessons
                            self.total_lessons = row.total_lessons
                            self.enrollment_date = row.enrollment_date
                            self.completion_date = row.completion_date
                            self.last_accessed_at = row.last_accessed_at
                            self.payment_status = row.payment_status
                            self.payment_amount = row.payment_amount
                            self.payment_currency = row.payment_currency
                            self.payment_method = row.payment_method
                            self.payment_transaction_id = row.payment_transaction_id
                            self.certificate_issued = row.certificate_issued
                            self.certificate_url = row.certificate_url
                            self.certificate_issued_at = row.certificate_issued_at
                            self.created_at = row.created_at
                            self.updated_at = row.updated_at
                    
                    enrollment = EnrollmentData(enrollment_row)
                    print(f"[EnrollmentService] Enrollment re-fetched successfully")
                else:
                    print(f"[EnrollmentService] Warning: Could not re-fetch enrollment after update")
            except Exception as refetch_error:
                print(f"[EnrollmentService] Error re-fetching enrollment: {str(refetch_error)}")
                import traceback
                traceback.print_exc()
                # Continue with the enrollment object we have - it should have the updated values
            
            print(f"[EnrollmentService] Enrollment updated successfully")
            
            return enrollment
        except ResourceNotFoundError:
            await db.rollback()
            raise
        except Exception as e:
            await db.rollback()
            # Log the actual error for debugging
            import logging
            import traceback
            logger = logging.getLogger(__name__)
            error_trace = traceback.format_exc()
            logger.error(f"Error updating enrollment {enrollment_id}: {str(e)}\n{error_trace}")
            print(f"[EnrollmentService] ERROR updating enrollment {enrollment_id}: {str(e)}")
            print(f"[EnrollmentService] Traceback: {error_trace}")
            # Re-raise as HTTPException with more details
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update enrollment: {str(e)}"
            )
    
    @staticmethod
    async def cancel_enrollment(db: AsyncSession, enrollment_id: int) -> bool:
        """Cancel an enrollment"""
        result = await db.execute(select(Enrollment).where(Enrollment.id == enrollment_id))
        enrollment = result.scalar_one_or_none()
        if not enrollment:
            raise ResourceNotFoundError("Enrollment not found")
        
        enrollment.status = "dropped"
        await db.commit()
        
        return True
    
    @staticmethod
    async def get_enrollment_lesson_progress(
        db: AsyncSession,
        enrollment_id: int
    ) -> List[Dict[str, Any]]:
        """Get all lesson progress records for an enrollment"""
        # Use explicit column selection to avoid accessing non-existent columns like 'time_spent'
        # Select only the columns that are guaranteed to exist in the database
        result = await db.execute(
            select(
                LessonProgress.id,
                LessonProgress.enrollment_id,
                LessonProgress.lesson_id,
                LessonProgress.status,
                LessonProgress.completion_percentage,
                LessonProgress.video_watched_duration,
                LessonProgress.video_completed,
                LessonProgress.quiz_completed,
                LessonProgress.assignment_completed,
                LessonProgress.started_at,
                LessonProgress.completed_at,
                LessonProgress.last_accessed_at
            ).where(LessonProgress.enrollment_id == enrollment_id)
        )
        # Get rows and convert to dictionaries
        rows = result.all()
        
        # Convert to list of dictionaries
        progress_list = []
        for row in rows:
            progress_list.append({
                "id": row.id,
                "enrollment_id": row.enrollment_id,
                "lesson_id": row.lesson_id,
                "status": row.status,
                "completion_percentage": row.completion_percentage,
                "video_watched_duration": row.video_watched_duration,
                "video_completed": row.video_completed,
                "quiz_completed": row.quiz_completed,
                "assignment_completed": row.assignment_completed,
                "started_at": row.started_at,
                "completed_at": row.completed_at,
                "last_accessed_at": row.last_accessed_at,
            })
        
        return progress_list
    
    @staticmethod
    async def update_lesson_progress(
        db: AsyncSession,
        enrollment_id: int,
        lesson_id: int,
        video_completed: bool = False,
        status: str = "completed"
    ) -> Dict[str, Any]:
        """Create or update lesson progress for an enrollment"""
        # Check if progress record already exists using explicit column selection
        # to avoid loading non-existent columns like 'time_spent'
        from sqlalchemy import update as sql_update
        
        check_result = await db.execute(
            select(LessonProgress.id).where(
                and_(
                    LessonProgress.enrollment_id == enrollment_id,
                    LessonProgress.lesson_id == lesson_id
                )
            )
        )
        existing_id = check_result.scalar_one_or_none()
        
        now = datetime.now(timezone.utc)
        completion_pct = 100.0 if status == "completed" else 0.0
        
        if existing_id:
            # First fetch current values to preserve started_at if it exists
            fetch_current = await db.execute(
                select(
                    LessonProgress.started_at,
                    LessonProgress.completed_at
                ).where(LessonProgress.id == existing_id)
            )
            current_row = fetch_current.first()
            current_started_at = current_row.started_at if current_row else None
            current_completed_at = current_row.completed_at if current_row else None
            
            # Update existing progress using UPDATE statement to avoid loading full model
            update_values = {
                "status": status,
                "video_completed": video_completed,
                "completion_percentage": completion_pct,
                "last_accessed_at": now
            }
            
            # Only set started_at if it doesn't exist
            if not current_started_at:
                update_values["started_at"] = now
            
            # Only set completed_at if status is completed and it doesn't exist
            if status == "completed" and not current_completed_at:
                update_values["completed_at"] = now
            
            update_stmt = (
                sql_update(LessonProgress)
                .where(LessonProgress.id == existing_id)
                .values(**update_values)
            )
            await db.execute(update_stmt)
            await db.commit()
            
            # Fetch updated record using explicit columns only
            fetch_result = await db.execute(
                select(
                    LessonProgress.id,
                    LessonProgress.enrollment_id,
                    LessonProgress.lesson_id,
                    LessonProgress.status,
                    LessonProgress.completion_percentage,
                    LessonProgress.video_completed,
                    LessonProgress.completed_at
                ).where(LessonProgress.id == existing_id)
            )
            row = fetch_result.first()
            
            return {
                "id": row.id,
                "enrollment_id": row.enrollment_id,
                "lesson_id": row.lesson_id,
                "status": row.status,
                "video_completed": row.video_completed,
                "completion_percentage": row.completion_percentage,
                "completed_at": row.completed_at,
            }
        else:
            # Create new progress record - only set columns that exist
            # Use raw INSERT to avoid model column issues
            from sqlalchemy import text
            
            insert_stmt = text("""
                INSERT INTO lesson_progress 
                (enrollment_id, lesson_id, status, video_completed, completion_percentage, 
                 started_at, completed_at, last_accessed_at)
                VALUES 
                (:enrollment_id, :lesson_id, :status, :video_completed, :completion_percentage,
                 :started_at, :completed_at, :last_accessed_at)
                RETURNING id, enrollment_id, lesson_id, status, video_completed, 
                          completion_percentage, completed_at
            """)
            
            result = await db.execute(
                insert_stmt,
                {
                    "enrollment_id": enrollment_id,
                    "lesson_id": lesson_id,
                    "status": status,
                    "video_completed": video_completed,
                    "completion_percentage": completion_pct,
                    "started_at": now,
                    "completed_at": now if status == "completed" else None,
                    "last_accessed_at": now
                }
            )
            await db.commit()
            row = result.first()
            
            return {
                "id": row.id,
                "enrollment_id": row.enrollment_id,
                "lesson_id": row.lesson_id,
                "status": row.status,
                "video_completed": row.video_completed,
                "completion_percentage": row.completion_percentage,
                "completed_at": row.completed_at,
            }
    
    @staticmethod
    async def bulk_enroll_students(
        db: AsyncSession,
        course_id: int,
        bulk_data: BulkEnrollmentCreate,
        user_id: int
    ) -> BulkEnrollmentResponse:
        """Bulk enroll students in a course"""
        # Verify course exists and user has access
        course = await CourseService.get_course(db, course_id)
        if not course:
            raise ResourceNotFoundError("Course not found")
        
        # Check if user has permission to bulk enroll students
        if course.created_by != user_id:
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()
            if not user or user.role not in ["organization_admin", "instructor"]:
                raise AuthorizationError("You don't have permission to bulk enroll students in this course")
        
        results = []
        successful_count = 0
        failed_count = 0
        
        for enrollment_item in bulk_data.enrollments:
            try:
                # Verify student exists
                result = await db.execute(select(User).where(User.id == enrollment_item.student_id))
                student = result.scalar_one_or_none()
                if not student:
                    results.append(BulkEnrollmentResult(
                        student_id=enrollment_item.student_id,
                        success=False,
                        error_message="Student not found"
                    ))
                    failed_count += 1
                    continue
                
                # Check if student is already enrolled
                result = await db.execute(
                    select(Enrollment)
                    .where(
                        and_(
                            Enrollment.course_id == course_id,
                            Enrollment.student_id == enrollment_item.student_id
                        )
                    )
                )
                existing_enrollment = result.scalar_one_or_none()
                if existing_enrollment:
                    results.append(BulkEnrollmentResult(
                        student_id=enrollment_item.student_id,
                        success=False,
                        error_message="Student is already enrolled in this course"
                    ))
                    failed_count += 1
                    continue
                
                # Create enrollment
                enrollment = Enrollment(
                    course_id=course_id,
                    student_id=enrollment_item.student_id,
                    enrollment_type=enrollment_item.enrollment_type,
                    payment_amount=enrollment_item.payment_amount,
                    payment_currency=enrollment_item.payment_currency,
                    payment_method=enrollment_item.payment_method,
                    payment_transaction_id=enrollment_item.payment_transaction_id,
                    payment_status="completed" if enrollment_item.payment_amount else "free"
                )
                
                db.add(enrollment)
                await db.flush()  # Get the ID without committing
                
                results.append(BulkEnrollmentResult(
                    student_id=enrollment_item.student_id,
                    success=True,
                    enrollment_id=enrollment.id
                ))
                successful_count += 1
                
            except Exception as e:
                results.append(BulkEnrollmentResult(
                    student_id=enrollment_item.student_id,
                    success=False,
                    error_message=str(e)
                ))
                failed_count += 1
        
        # Commit all successful enrollments
        await db.commit()
        
        return BulkEnrollmentResponse(
            total_requested=len(bulk_data.enrollments),
            successful_enrollments=successful_count,
            failed_enrollments=failed_count,
            results=results
        )
    
    @staticmethod
    async def get_enrollment_analytics(db: AsyncSession, course_id: int) -> Dict[str, Any]:
        """Get comprehensive enrollment analytics for a course"""
        # Verify course exists
        course = await CourseService.get_course(db, course_id)
        if not course:
            raise ResourceNotFoundError("Course not found")
        
        # Get total enrollments
        result = await db.execute(select(func.count(Enrollment.id)).where(Enrollment.course_id == course_id))
        total_enrollments = result.scalar() or 0
        
        # Get enrollments by status
        result = await db.execute(
            select(Enrollment.status, func.count(Enrollment.id))
            .where(Enrollment.course_id == course_id)
            .group_by(Enrollment.status)
        )
        enrollments_by_status = dict(result.fetchall())
        
        # Get active enrollments (not completed or dropped)
        active_enrollments = enrollments_by_status.get("active", 0)
        completed_enrollments = enrollments_by_status.get("completed", 0)
        dropped_enrollments = enrollments_by_status.get("dropped", 0)
        
        # Calculate completion rate
        completion_rate = (completed_enrollments / total_enrollments * 100) if total_enrollments > 0 else 0
        
        # Get average progress
        result = await db.execute(
            select(func.avg(Enrollment.progress_percentage))
            .where(Enrollment.course_id == course_id)
        )
        average_progress = float(result.scalar() or 0)
        
        # Get average completion time
        result = await db.execute(
            select(
                func.avg(
                    func.extract('epoch', Enrollment.completion_date) - 
                    func.extract('epoch', Enrollment.enrollment_date)
                ) / 86400  # Convert to days
            )
            .where(
                and_(
                    Enrollment.course_id == course_id,
                    Enrollment.completion_date.isnot(None)
                )
            )
        )
        avg_completion_days = float(result.scalar() or 0)
        
        # Get enrollments by month (last 12 months)
        result = await db.execute(
            select(
                func.date_trunc('month', Enrollment.enrollment_date).label('month'),
                func.count(Enrollment.id).label('count')
            )
            .where(Enrollment.course_id == course_id)
            .where(Enrollment.enrollment_date >= func.now() - func.interval('12 months'))
            .group_by(func.date_trunc('month', Enrollment.enrollment_date))
            .order_by('month')
        )
        enrollments_by_month = {
            row.month.strftime('%Y-%m'): row.count 
            for row in result.fetchall()
        }
        
        # Get top performing students
        result = await db.execute(
            select(
                User.id,
                User.first_name,
                User.last_name,
                User.email,
                Enrollment.progress_percentage,
                Enrollment.completion_date
            )
            .join(Enrollment, User.id == Enrollment.student_id)
            .where(Enrollment.course_id == course_id)
            .where(Enrollment.status.in_(["active", "completed"]))
            .order_by(Enrollment.progress_percentage.desc())
            .limit(10)
        )
        top_performing_students = [
            {
                "id": row.id,
                "name": f"{row.first_name} {row.last_name}",
                "email": row.email,
                "progress_percentage": float(row.progress_percentage),
                "completed": row.completion_date is not None
            }
            for row in result.fetchall()
        ]
        
        # Calculate revenue analytics
        result = await db.execute(
            select(
                func.sum(Enrollment.payment_amount).label('total_revenue'),
                func.avg(Enrollment.payment_amount).label('average_payment'),
                func.count(Enrollment.id).label('paid_enrollments')
            )
            .where(
                and_(
                    Enrollment.course_id == course_id,
                    Enrollment.payment_amount.isnot(None),
                    Enrollment.payment_amount > 0
                )
            )
        )
        revenue_row = result.fetchone()
        revenue_analytics = {
            "total_revenue": float(revenue_row.total_revenue or 0),
            "average_payment": float(revenue_row.average_payment or 0),
            "paid_enrollments": revenue_row.paid_enrollments or 0
        } if revenue_row else None
        
        # Calculate enrollment trends
        current_month = datetime.now().strftime('%Y-%m')
        previous_month = (datetime.now().replace(day=1) - timedelta(days=1)).strftime('%Y-%m')
        
        current_month_enrollments = enrollments_by_month.get(current_month, 0)
        previous_month_enrollments = enrollments_by_month.get(previous_month, 0)
        
        enrollment_growth = 0
        if previous_month_enrollments > 0:
            enrollment_growth = ((current_month_enrollments - previous_month_enrollments) / previous_month_enrollments) * 100
        
        enrollment_trends = {
            "current_month_enrollments": current_month_enrollments,
            "previous_month_enrollments": previous_month_enrollments,
            "growth_percentage": enrollment_growth,
            "trend": "increasing" if enrollment_growth > 0 else "decreasing" if enrollment_growth < 0 else "stable"
        }
        
        return {
            "total_enrollments": total_enrollments,
            "active_enrollments": active_enrollments,
            "completed_enrollments": completed_enrollments,
            "dropped_enrollments": dropped_enrollments,
            "completion_rate": round(completion_rate, 2),
            "average_progress": round(average_progress, 2),
            "average_completion_time_days": round(avg_completion_days, 2) if avg_completion_days > 0 else None,
            "enrollments_by_status": enrollments_by_status,
            "enrollments_by_month": enrollments_by_month,
            "top_performing_students": top_performing_students,
            "enrollment_trends": enrollment_trends,
            "revenue_analytics": revenue_analytics
        }
    
    @staticmethod
    async def get_user_enrollments(
        db: AsyncSession,
        user_id: int
    ) -> List[Enrollment]:
        """Get all enrollments for a user"""
        print(f"[EnrollmentService] Getting enrollments for user {user_id}")
        try:
            result = await db.execute(
                select(Enrollment)
                .options(selectinload(Enrollment.course))
                .where(Enrollment.student_id == user_id)
                .order_by(desc(Enrollment.enrollment_date))
            )
            enrollments = result.scalars().all()
            print(f"[EnrollmentService] Found {len(enrollments)} enrollments for user {user_id}")
            
            # Debug: Check course relationship
            for enrollment in enrollments:
                print(f"  - Enrollment {enrollment.id}: Course ID {enrollment.course_id}")
                if hasattr(enrollment, 'course') and enrollment.course:
                    print(f"    Course loaded: {enrollment.course.title}")
                else:
                    print(f"    Course NOT loaded for enrollment {enrollment.id}")
                    # Try to manually load the course
                    try:
                        from app.models.course import Course
                        course_result = await db.execute(
                            select(Course).where(Course.id == enrollment.course_id)
                        )
                        course = course_result.scalar_one_or_none()
                        if course:
                            print(f"    Manually loaded course: {course.title}")
                            enrollment.course = course
                        else:
                            print(f"    Course {enrollment.course_id} not found in database")
                    except Exception as e:
                        print(f"    Error manually loading course: {str(e)}")
            
            return enrollments
        except Exception as e:
            print(f"[EnrollmentService] ERROR in get_user_enrollments: {str(e)}")
            import traceback
            traceback.print_exc()
            raise e


class LessonAttachmentService:
    """Service class for lesson attachment management"""
    
    @staticmethod
    async def create_attachment(
        db: AsyncSession,
        attachment_data: LessonAttachmentCreate,
        user_id: int
    ) -> LessonAttachment:
        """Create a new lesson attachment"""
        # Verify lesson exists and user has access
        lesson = await LessonService.get_lesson(db, attachment_data.lesson_id)
        if not lesson:
            raise ResourceNotFoundError("Lesson not found")
        
        topic = await TopicService.get_topic(db, lesson.topic_id)
        course = await CourseService.get_course(db, topic.course_id)
        if course.created_by != user_id:
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()
            if not user or user.role != "organization_admin":
                raise AuthorizationError("You don't have permission to create attachments for this lesson")
        
        attachment = LessonAttachment(
            lesson_id=attachment_data.lesson_id,
            title=attachment_data.title,
            description=attachment_data.description,
            file_url=attachment_data.file_url,
            file_type=attachment_data.file_type,
            file_size=attachment_data.file_size,
            is_required=attachment_data.is_required,
            is_free_preview=attachment_data.is_free_preview
        )
        
        db.add(attachment)
        await db.commit()
        await db.refresh(attachment)
        
        return attachment
    
    @staticmethod
    async def get_attachment(db: AsyncSession, attachment_id: int) -> Optional[LessonAttachment]:
        """Get a lesson attachment by ID"""
        result = await db.execute(select(LessonAttachment).where(LessonAttachment.id == attachment_id))
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_lesson_attachments(db: AsyncSession, lesson_id: int) -> List[LessonAttachment]:
        """Get all attachments for a lesson"""
        result = await db.execute(
            select(LessonAttachment)
            .where(LessonAttachment.lesson_id == lesson_id)
            .order_by(LessonAttachment.created_at)
        )
        return result.scalars().all()
    
    @staticmethod
    async def update_attachment(
        db: AsyncSession,
        attachment_id: int,
        attachment_data: LessonAttachmentUpdate,
        user_id: int
    ) -> LessonAttachment:
        """Update a lesson attachment"""
        attachment = await LessonAttachmentService.get_attachment(db, attachment_id)
        if not attachment:
            raise ResourceNotFoundError("Attachment not found")
        
        # Check if user has permission to update this attachment
        lesson = await LessonService.get_lesson(db, attachment.lesson_id)
        topic = await TopicService.get_topic(db, lesson.topic_id)
        course = await CourseService.get_course(db, topic.course_id)
        if course.created_by != user_id:
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()
            if not user or user.role != "organization_admin":
                raise AuthorizationError("You don't have permission to update this attachment")
        
        # Update attachment fields
        update_data = attachment_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(attachment, field, value)
        
        await db.commit()
        await db.refresh(attachment)
        
        return attachment
    
    @staticmethod
    async def delete_attachment(db: AsyncSession, attachment_id: int, user_id: int) -> bool:
        """Delete a lesson attachment"""
        attachment = await LessonAttachmentService.get_attachment(db, attachment_id)
        if not attachment:
            raise ResourceNotFoundError("Attachment not found")
        
        # Check if user has permission to delete this attachment
        lesson = await LessonService.get_lesson(db, attachment.lesson_id)
        topic = await TopicService.get_topic(db, lesson.topic_id)
        course = await CourseService.get_course(db, topic.course_id)
        if course.created_by != user_id:
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()
            if not user or user.role != "organization_admin":
                raise AuthorizationError("You don't have permission to delete this attachment")
        
        await db.delete(attachment)
        await db.commit()
        
        return True
    
    @staticmethod
    async def increment_download_count(db: AsyncSession, attachment_id: int) -> bool:
        """Increment download count for an attachment"""
        attachment = await LessonAttachmentService.get_attachment(db, attachment_id)
        if not attachment:
            raise ResourceNotFoundError("Attachment not found")
        
        attachment.download_count += 1
        await db.commit()
        
        return True


class CourseInstructorService:
    """Service class for course instructor management"""
    
    @staticmethod
    async def assign_instructor(
        db: AsyncSession,
        course_id: int,
        instructor_data: CourseInstructorCreate,
        user_id: int
    ) -> CourseInstructor:
        """Assign an instructor to a course"""
        # Verify course exists and user has access
        course = await CourseService.get_course(db, course_id)
        if not course:
            raise ResourceNotFoundError("Course not found")
        
        # Check if user has permission to assign instructors
        if course.created_by != user_id:
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()
            if not user or user.role != "organization_admin":
                raise AuthorizationError("You don't have permission to assign instructors to this course")
        
        # Verify instructor exists and is an instructor
        result = await db.execute(select(User).where(User.id == instructor_data.instructor_id))
        instructor = result.scalar_one_or_none()
        if not instructor:
            raise ResourceNotFoundError("Instructor not found")
        
        if instructor.role not in ["instructor", "organization_admin"]:
            raise ValidationError("User is not an instructor")
        
        # Check if instructor is already assigned to this course
        result = await db.execute(
            select(CourseInstructor)
            .where(
                and_(
                    CourseInstructor.course_id == course_id,
                    CourseInstructor.instructor_id == instructor_data.instructor_id
                )
            )
        )
        existing_assignment = result.scalar_one_or_none()
        if existing_assignment:
            raise ValidationError("Instructor is already assigned to this course")
        
        # If this is being set as primary, unset other primary instructors
        if instructor_data.is_primary:
            await db.execute(
                select(CourseInstructor)
                .where(
                    and_(
                        CourseInstructor.course_id == course_id,
                        CourseInstructor.is_primary == True
                    )
                )
            )
            existing_primary = result.scalars().all()
            for primary_instructor in existing_primary:
                primary_instructor.is_primary = False
        
        # Create instructor assignment
        course_instructor = CourseInstructor(
            course_id=course_id,
            instructor_id=instructor_data.instructor_id,
            role=instructor_data.role,
            is_primary=instructor_data.is_primary,
            can_edit_content=instructor_data.can_edit_content,
            can_grade_assignments=instructor_data.can_grade_assignments,
            can_view_analytics=instructor_data.can_view_analytics
        )
        
        db.add(course_instructor)
        await db.commit()
        await db.refresh(course_instructor)
        
        return course_instructor
    
    @staticmethod
    async def get_course_instructors(db: AsyncSession, course_id: int) -> List[CourseInstructor]:
        """Get all instructors for a course"""
        result = await db.execute(
            select(CourseInstructor)
            .options(selectinload(CourseInstructor.instructor))
            .where(CourseInstructor.course_id == course_id)
            .order_by(CourseInstructor.assigned_at)
        )
        return result.scalars().all()
    
    @staticmethod
    async def get_course_instructor(
        db: AsyncSession, 
        course_id: int, 
        instructor_id: int
    ) -> Optional[CourseInstructor]:
        """Get a specific instructor assignment for a course"""
        result = await db.execute(
            select(CourseInstructor)
            .options(selectinload(CourseInstructor.instructor))
            .where(
                and_(
                    CourseInstructor.course_id == course_id,
                    CourseInstructor.instructor_id == instructor_id
                )
            )
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def update_instructor_permissions(
        db: AsyncSession,
        course_id: int,
        instructor_id: int,
        instructor_data: CourseInstructorUpdate,
        user_id: int
    ) -> CourseInstructor:
        """Update instructor permissions for a course"""
        # Get the instructor assignment
        course_instructor = await CourseInstructorService.get_course_instructor(db, course_id, instructor_id)
        if not course_instructor:
            raise ResourceNotFoundError("Instructor assignment not found")
        
        # Check if user has permission to update instructor permissions
        course = await CourseService.get_course(db, course_id)
        if course.created_by != user_id:
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()
            if not user or user.role != "organization_admin":
                raise AuthorizationError("You don't have permission to update instructor permissions for this course")
        
        # If setting as primary, unset other primary instructors
        if instructor_data.is_primary and not course_instructor.is_primary:
            result = await db.execute(
                select(CourseInstructor)
                .where(
                    and_(
                        CourseInstructor.course_id == course_id,
                        CourseInstructor.is_primary == True,
                        CourseInstructor.instructor_id != instructor_id
                    )
                )
            )
            existing_primary = result.scalars().all()
            for primary_instructor in existing_primary:
                primary_instructor.is_primary = False
        
        # Update instructor assignment fields
        update_data = instructor_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(course_instructor, field, value)
        
        await db.commit()
        await db.refresh(course_instructor)
        
        return course_instructor
    
    @staticmethod
    async def remove_instructor(
        db: AsyncSession,
        course_id: int,
        instructor_id: int,
        user_id: int
    ) -> bool:
        """Remove an instructor from a course"""
        # Get the instructor assignment
        course_instructor = await CourseInstructorService.get_course_instructor(db, course_id, instructor_id)
        if not course_instructor:
            raise ResourceNotFoundError("Instructor assignment not found")
        
        # Check if user has permission to remove instructor
        course = await CourseService.get_course(db, course_id)
        if course.created_by != user_id:
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()
            if not user or user.role != "organization_admin":
                raise AuthorizationError("You don't have permission to remove instructors from this course")
        
        # Don't allow removing the course creator
        if course.created_by == instructor_id:
            raise ValidationError("Cannot remove the course creator")
        
        await db.delete(course_instructor)
        await db.commit()
        
        return True
