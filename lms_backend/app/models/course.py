"""
Course Management Models
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON, ForeignKey, Float, Date, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.core.database import Base


class CourseStatus(str, enum.Enum):
    """Course status enumeration"""
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"
    SCHEDULED = "scheduled"


class EnrollmentType(str, enum.Enum):
    """Course enrollment type"""
    FREE = "free"
    PAID = "paid"
    INVITE_ONLY = "invite_only"


class Course(Base):
    """
    Course model - Main course entity
    """
    __tablename__ = "courses"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Basic Information
    title = Column(String(255), nullable=False, index=True)
    slug = Column(String(255), unique=True, index=True)
    description = Column(Text)
    short_description = Column(String(500))
    thumbnail_url = Column(String(500))
    intro_video_url = Column(String(500))
    intro_video_duration = Column(Integer)  # in seconds
    
    # Organization & Ownership
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Course Structure
    total_topics = Column(Integer, default=0)
    total_lessons = Column(Integer, default=0)
    total_duration = Column(Integer, default=0)  # in minutes
    difficulty_level = Column(String(50), default="beginner")  # beginner, intermediate, advanced
    
    # Scheduling & Timing
    start_date = Column(Date)
    end_date = Column(Date)
    duration_weeks = Column(Integer)  # course duration in weeks
    class_schedule = Column(JSON)  # {"day": "monday", "time": "10:00", "timezone": "UTC"}
    timezone = Column(String(50), default="UTC")
    
    # Pricing & Payment
    enrollment_type = Column(Enum(EnrollmentType), default=EnrollmentType.PAID)
    price = Column(Float, default=0.0)
    currency = Column(String(3), default="USD")
    discount_price = Column(Float)
    discount_valid_until = Column(DateTime)
    max_students = Column(Integer)  # 0 for unlimited
    
    # Course Settings
    status = Column(Enum(CourseStatus), default=CourseStatus.DRAFT)
    is_featured = Column(Boolean, default=False)
    is_certificate_eligible = Column(Boolean, default=True)
    certificate_template = Column(Text)
    prerequisites = Column(Text)
    learning_objectives = Column(JSON)  # ["objective1", "objective2"]
    
    # SEO & Marketing
    meta_title = Column(String(255))
    meta_description = Column(String(500))
    tags = Column(JSON)  # ["tag1", "tag2"]
    category = Column(String(100))
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    published_at = Column(DateTime(timezone=True))
    
    # Relationships
    organization = relationship("Organization", back_populates="courses")
    creator = relationship("User", foreign_keys=[created_by])
    topics = relationship("Topic", back_populates="course", cascade="all, delete-orphan")
    enrollments = relationship("Enrollment", back_populates="course", cascade="all, delete-orphan")
    instructors = relationship("CourseInstructor", back_populates="course", cascade="all, delete-orphan")
    reviews = relationship("CourseReview", back_populates="course", cascade="all, delete-orphan")


class Topic(Base):
    """
    Topic model - Course sections/chapters
    """
    __tablename__ = "topics"
    
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    
    # Basic Information
    title = Column(String(255), nullable=False)
    description = Column(Text)
    order = Column(Integer, nullable=False)  # for sorting
    
    # Content
    content = Column(Text)  # rich text content
    estimated_duration = Column(Integer)  # in minutes
    is_required = Column(Boolean, default=True)
    
    # Progress tracking
    total_lessons = Column(Integer, default=0)
    completed_lessons = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    course = relationship("Course", back_populates="topics")
    lessons = relationship("Lesson", back_populates="topic", cascade="all, delete-orphan")
    assignments = relationship("Assignment", back_populates="topic", cascade="all, delete-orphan")


class Lesson(Base):
    """
    Lesson model - Individual learning units within topics
    """
    __tablename__ = "lessons"
    
    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)
    
    # Basic Information
    title = Column(String(255), nullable=False)
    description = Column(Text)
    order = Column(Integer, nullable=False)  # for sorting within topic
    
    # Content
    content = Column(Text)  # rich text content
    video_url = Column(String(500))
    video_duration = Column(Integer)  # in seconds
    content_type = Column(String(50), default="text")  # text, video, audio, document
    
    # Settings
    is_required = Column(Boolean, default=True)
    is_free_preview = Column(Boolean, default=False)
    estimated_duration = Column(Integer)  # in minutes
    
    # Progress tracking
    completion_criteria = Column(JSON)  # {"watch_video": true, "complete_quiz": true}
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    topic = relationship("Topic", back_populates="lessons")
    attachments = relationship("LessonAttachment", back_populates="lesson", cascade="all, delete-orphan")
    quiz = relationship("Quiz", back_populates="lesson", uselist=False, cascade="all, delete-orphan")
    progress = relationship("LessonProgress", back_populates="lesson", cascade="all, delete-orphan")


class LessonAttachment(Base):
    """
    Lesson attachments - files, resources, etc.
    """
    __tablename__ = "lesson_attachments"
    
    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    
    # File Information
    title = Column(String(255), nullable=False)
    description = Column(Text)
    file_url = Column(String(500), nullable=False)
    file_type = Column(String(50))  # pdf, doc, video, audio, etc.
    file_size = Column(Integer)  # in bytes
    download_count = Column(Integer, default=0)
    
    # Settings
    is_required = Column(Boolean, default=False)
    is_free_preview = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    lesson = relationship("Lesson", back_populates="attachments")


class CourseInstructor(Base):
    """
    Course instructors - many-to-many relationship
    """
    __tablename__ = "course_instructors"
    
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    instructor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Role in course
    role = Column(String(50), default="instructor")  # instructor, co-instructor, assistant
    is_primary = Column(Boolean, default=False)
    
    # Permissions
    can_edit_content = Column(Boolean, default=True)
    can_grade_assignments = Column(Boolean, default=True)
    can_view_analytics = Column(Boolean, default=True)
    
    # Timestamps
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    course = relationship("Course", back_populates="instructors")
    instructor = relationship("User")


class Enrollment(Base):
    """
    Student course enrollments
    """
    __tablename__ = "enrollments"
    
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Enrollment details
    enrollment_date = Column(DateTime(timezone=True), server_default=func.now())
    completion_date = Column(DateTime(timezone=True))
    status = Column(String(50), default="active")  # active, completed, dropped, suspended
    
    # Progress tracking
    progress_percentage = Column(Float, default=0.0)
    completed_lessons = Column(Integer, default=0)
    total_lessons = Column(Integer, default=0)
    last_accessed_at = Column(DateTime(timezone=True))
    
    # Payment information
    payment_status = Column(String(50), default="pending")  # pending, paid, failed, refunded
    payment_amount = Column(Float)
    payment_currency = Column(String(3), default="USD")
    payment_method = Column(String(50))  # razorpay, stripe, etc.
    payment_transaction_id = Column(String(255))
    
    # Certificate
    certificate_issued = Column(Boolean, default=False)
    certificate_url = Column(String(500))
    certificate_issued_at = Column(DateTime(timezone=True))
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    course = relationship("Course", back_populates="enrollments")
    student = relationship("User")
    progress = relationship("LessonProgress", back_populates="enrollment", cascade="all, delete-orphan")
    assignments = relationship("AssignmentSubmission", back_populates="enrollment", cascade="all, delete-orphan")


class LessonProgress(Base):
    """
    Student progress tracking for individual lessons
    """
    __tablename__ = "lesson_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    enrollment_id = Column(Integer, ForeignKey("enrollments.id"), nullable=False)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    
    # Progress details
    status = Column(String(50), default="not_started")  # not_started, in_progress, completed
    completion_percentage = Column(Float, default=0.0)
    time_spent = Column(Integer, default=0)  # in seconds
    video_watched_duration = Column(Integer, default=0)  # in seconds
    
    # Completion criteria
    video_completed = Column(Boolean, default=False)
    quiz_completed = Column(Boolean, default=False)
    assignment_completed = Column(Boolean, default=False)
    
    # Timestamps
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    last_accessed_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    enrollment = relationship("Enrollment", back_populates="progress")
    lesson = relationship("Lesson", back_populates="progress")


class CourseReview(Base):
    """
    Student course reviews and ratings
    """
    __tablename__ = "course_reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Review details
    rating = Column(Integer, nullable=False)  # 1-5 stars
    title = Column(String(255))
    review_text = Column(Text)
    
    # Review status
    is_verified = Column(Boolean, default=False)
    is_helpful = Column(Boolean, default=False)
    helpful_count = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    course = relationship("Course", back_populates="reviews")
    student = relationship("User") 