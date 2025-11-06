"""
Course Management Schemas
Pydantic models for course-related API operations
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator, computed_field
from datetime import datetime, date
from enum import Enum

from app.models.course import CourseStatus, EnrollmentType
from app.models.assessment import QuestionType, QuizStatus, AssignmentStatus, SubmissionStatus


# ============================================================================
# COURSE SCHEMAS
# ============================================================================

class CourseBase(BaseModel):
    """Base course schema with common fields"""
    title: str = Field(..., min_length=1, max_length=255, description="Course title")
    description: Optional[str] = Field(None, description="Course description")
    short_description: Optional[str] = Field(None, max_length=500, description="Short course description")
    difficulty_level: str = Field(default="beginner", description="Course difficulty level")
    category: Optional[str] = Field(None, max_length=100, description="Course category")
    tags: Optional[List[str]] = Field(default_factory=list, description="Course tags")


class CourseCreate(CourseBase):
    """Schema for creating a new course"""
    organization_id: int = Field(..., description="Organization ID")
    price: float = Field(default=0.0, ge=0, description="Course price")
    currency: str = Field(default="USD", min_length=3, max_length=3, description="Currency code")
    enrollment_type: EnrollmentType = Field(default=EnrollmentType.PAID, description="Enrollment type")
    start_date: Optional[date] = Field(None, description="Course start date")
    duration_weeks: Optional[int] = Field(None, ge=1, description="Course duration in weeks")
    max_students: Optional[int] = Field(None, ge=0, description="Maximum number of students (0 for unlimited)")
    prerequisites: Optional[str] = Field(None, description="Course prerequisites")
    learning_objectives: Optional[List[str]] = Field(default_factory=list, description="Learning objectives")
    
    @field_validator('learning_objectives')
    @classmethod
    def validate_learning_objectives(cls, v):
        """Validate learning objectives"""
        if v and len(v) > 10:
            raise ValueError('Maximum 10 learning objectives allowed')
        return v


class CourseUpdate(BaseModel):
    """Schema for updating course information"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    short_description: Optional[str] = Field(None, max_length=500)
    thumbnail_url: Optional[str] = None
    intro_video_url: Optional[str] = None
    difficulty_level: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    tags: Optional[List[str]] = None
    price: Optional[float] = Field(None, ge=0)
    currency: Optional[str] = Field(None, min_length=3, max_length=3)
    enrollment_type: Optional[EnrollmentType] = None
    start_date: Optional[date] = None
    duration_weeks: Optional[int] = Field(None, ge=1)
    max_students: Optional[int] = Field(None, ge=0)
    prerequisites: Optional[str] = None
    learning_objectives: Optional[List[str]] = None
    status: Optional[CourseStatus] = None
    is_featured: Optional[bool] = None


class CourseResponse(CourseBase):
    """Schema for course response data"""
    id: int
    slug: str
    organization_id: int
    created_by: int
    status: CourseStatus
    enrollment_type: EnrollmentType
    price: float
    currency: str
    total_topics: int
    total_lessons: int
    total_duration: int
    max_students: Optional[int]
    is_featured: bool
    is_certificate_eligible: bool
    thumbnail_url: Optional[str]
    intro_video_url: Optional[str]
    intro_video_duration: Optional[int]
    start_date: Optional[date]
    end_date: Optional[date]
    duration_weeks: Optional[int]
    class_schedule: Optional[Dict[str, Any]]
    timezone: str
    prerequisites: Optional[str]
    learning_objectives: Optional[List[str]]
    meta_title: Optional[str]
    meta_description: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    published_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class CourseListResponse(BaseModel):
    """Schema for paginated course list response"""
    courses: List[CourseResponse]
    total: int
    page: int
    size: int
    pages: int


# ============================================================================
# TOPIC SCHEMAS
# ============================================================================

class TopicBase(BaseModel):
    """Base topic schema"""
    title: str = Field(..., min_length=1, max_length=255, description="Topic title")
    description: Optional[str] = Field(None, description="Topic description")
    content: Optional[str] = Field(None, description="Topic content")
    estimated_duration: Optional[int] = Field(None, ge=1, description="Estimated duration in minutes")
    is_required: bool = Field(default=True, description="Whether topic is required")


class TopicCreate(TopicBase):
    """Schema for creating a new topic"""
    # course_id comes from URL path parameter, not request body
    order: int = Field(..., ge=1, description="Topic order")


class TopicUpdate(BaseModel):
    """Schema for updating topic information"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    content: Optional[str] = None
    order: Optional[int] = Field(None, ge=1)
    estimated_duration: Optional[int] = Field(None, ge=1)
    is_required: Optional[bool] = None


class TopicResponse(TopicBase):
    """Schema for topic response data"""
    id: int
    course_id: int
    order: int
    total_lessons: int
    completed_lessons: int
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


# ============================================================================
# LESSON SCHEMAS
# ============================================================================

class LessonBase(BaseModel):
    """Base lesson schema"""
    title: str = Field(..., min_length=1, max_length=255, description="Lesson title")
    description: Optional[str] = Field(None, description="Lesson description")
    content: Optional[str] = Field(None, description="Lesson content")
    video_url: Optional[str] = Field(None, description="Video URL")
    video_duration: Optional[int] = Field(None, ge=0, description="Video duration in seconds")
    content_type: str = Field(default="text", description="Content type")
    estimated_duration: Optional[int] = Field(None, ge=1, description="Estimated duration in minutes")
    is_required: bool = Field(default=True, description="Whether lesson is required")
    is_free_preview: bool = Field(default=False, description="Whether lesson is available for preview")


class LessonCreate(LessonBase):
    """Schema for creating a new lesson"""
    # topic_id comes from URL path parameter, not request body
    order: int = Field(..., ge=1, description="Lesson order")


class LessonUpdate(BaseModel):
    """Schema for updating lesson information"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    content: Optional[str] = None
    video_url: Optional[str] = None
    video_duration: Optional[int] = Field(None, ge=0)
    content_type: Optional[str] = None
    order: Optional[int] = Field(None, ge=1)
    estimated_duration: Optional[int] = Field(None, ge=1)
    is_required: Optional[bool] = None
    is_free_preview: Optional[bool] = None


class LessonResponse(LessonBase):
    """Schema for lesson response data"""
    id: int
    topic_id: int
    order: int
    completion_criteria: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


# ============================================================================
# ENROLLMENT SCHEMAS
# ============================================================================

class EnrollmentCreate(BaseModel):
    """Schema for creating a new enrollment"""
    course_id: int = Field(..., description="Course ID")
    student_id: int = Field(..., description="Student ID")


class EnrollmentResponse(BaseModel):
    """Schema for enrollment response data"""
    id: int
    course_id: int
    student_id: int
    enrollment_date: datetime
    completion_date: Optional[datetime]
    status: str
    progress_percentage: float
    completed_lessons: int
    total_lessons: int
    last_accessed_at: Optional[datetime]
    payment_status: str
    payment_amount: Optional[float]
    payment_currency: str
    payment_method: Optional[str]
    payment_transaction_id: Optional[str]
    certificate_issued: bool
    certificate_url: Optional[str]
    certificate_issued_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


# ============================================================================
# BULK ENROLLMENT SCHEMAS
# ============================================================================

class BulkEnrollmentItem(BaseModel):
    """Schema for individual enrollment in bulk operation"""
    student_id: int = Field(..., description="Student ID to enroll")
    enrollment_type: str = Field(default="free", description="Enrollment type")
    payment_amount: Optional[float] = Field(None, description="Payment amount if paid")
    payment_currency: Optional[str] = Field(default="USD", description="Payment currency")
    payment_method: Optional[str] = Field(None, description="Payment method")
    payment_transaction_id: Optional[str] = Field(None, description="Payment transaction ID")


class BulkEnrollmentCreate(BaseModel):
    """Schema for bulk enrollment creation"""
    enrollments: List[BulkEnrollmentItem] = Field(..., min_items=1, max_items=100, description="List of enrollments")
    send_notifications: bool = Field(default=True, description="Send enrollment notifications")


class BulkEnrollmentResult(BaseModel):
    """Schema for bulk enrollment result"""
    student_id: int
    success: bool
    enrollment_id: Optional[int] = None
    error_message: Optional[str] = None


class BulkEnrollmentResponse(BaseModel):
    """Schema for bulk enrollment response"""
    total_requested: int
    successful_enrollments: int
    failed_enrollments: int
    results: List[BulkEnrollmentResult]


# ============================================================================
# ENROLLMENT ANALYTICS SCHEMAS
# ============================================================================

class EnrollmentAnalytics(BaseModel):
    """Schema for enrollment analytics"""
    total_enrollments: int
    active_enrollments: int
    completed_enrollments: int
    dropped_enrollments: int
    completion_rate: float
    average_progress: float
    average_completion_time_days: Optional[float]
    enrollments_by_status: Dict[str, int]
    enrollments_by_month: Dict[str, int]
    top_performing_students: List[Dict[str, Any]]
    enrollment_trends: Dict[str, Any]
    revenue_analytics: Optional[Dict[str, Any]] = None


# ============================================================================
# INSTRUCTOR ASSIGNMENT SCHEMAS
# ============================================================================

class CourseInstructorCreate(BaseModel):
    """Schema for assigning instructor to course"""
    instructor_id: int = Field(..., description="Instructor ID")
    role: str = Field(default="instructor", description="Instructor role")
    is_primary: bool = Field(default=False, description="Whether instructor is primary")
    can_edit_content: bool = Field(default=True, description="Can edit course content")
    can_grade_assignments: bool = Field(default=True, description="Can grade assignments")
    can_view_analytics: bool = Field(default=True, description="Can view analytics")


class CourseInstructorUpdate(BaseModel):
    """Schema for updating instructor permissions"""
    role: Optional[str] = Field(None, description="Instructor role")
    is_primary: Optional[bool] = Field(None, description="Whether instructor is primary")
    can_edit_content: Optional[bool] = Field(None, description="Can edit course content")
    can_grade_assignments: Optional[bool] = Field(None, description="Can grade assignments")
    can_view_analytics: Optional[bool] = Field(None, description="Can view analytics")


class CourseInstructorResponse(BaseModel):
    """Schema for course instructor response data"""
    id: int
    course_id: int
    instructor_id: int
    role: str
    is_primary: bool
    can_edit_content: bool
    can_grade_assignments: bool
    can_view_analytics: bool
    assigned_at: datetime
    instructor: Optional[Dict[str, Any]] = None  # Will include instructor details
    
    class Config:
        from_attributes = True


# ============================================================================
# COURSE REVIEW SCHEMAS
# ============================================================================

class CourseReviewCreate(BaseModel):
    """Schema for creating a course review"""
    course_id: int = Field(..., description="Course ID")
    rating: int = Field(..., ge=1, le=5, description="Rating (1-5 stars)")
    title: Optional[str] = Field(None, max_length=255, description="Review title")
    review_text: Optional[str] = Field(None, description="Review text")


class CourseReviewResponse(BaseModel):
    """Schema for course review response data"""
    id: int
    course_id: int
    student_id: int
    rating: int
    title: Optional[str]
    review_text: Optional[str]
    is_verified: bool
    is_helpful: bool
    helpful_count: int
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


# ============================================================================
# COURSE FILTER SCHEMAS
# ============================================================================

class CourseFilter(BaseModel):
    """Schema for filtering courses"""
    search: Optional[str] = Field(None, description="Search term for title or description")
    status: Optional[CourseStatus] = None
    enrollment_type: Optional[EnrollmentType] = None
    difficulty_level: Optional[str] = None
    category: Optional[str] = None
    organization_id: Optional[int] = None
    instructor_id: Optional[int] = None
    min_price: Optional[float] = Field(None, ge=0)
    max_price: Optional[float] = Field(None, ge=0)
    is_featured: Optional[bool] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None


# ============================================================================
# COURSE DETAIL SCHEMAS
# ============================================================================

class CourseDetail(CourseResponse):
    """Schema for detailed course information"""
    enrollment_count: int
    instructor: Optional[Dict[str, Any]] = None
    organization: Optional[Dict[str, Any]] = None


class CoursePricing(BaseModel):
    """Schema for course pricing"""
    price: float = Field(..., ge=0, description="Course price")
    currency: str = Field(default="USD", min_length=3, max_length=3, description="Currency code")
    discount_price: Optional[float] = Field(None, ge=0, description="Discounted price")
    discount_valid_until: Optional[datetime] = Field(None, description="Discount expiry date")


class TopicWithLessons(TopicResponse):
    """Schema for topic with lessons"""
    lessons: List[LessonResponse]


class EnrollmentUpdate(BaseModel):
    """Schema for updating enrollment"""
    status: Optional[str] = Field(None, description="Enrollment status")
    progress_percentage: Optional[float] = Field(None, ge=0, le=100, description="Progress percentage")
    completed_lessons: Optional[int] = Field(None, ge=0, description="Number of completed lessons")
    payment_status: Optional[str] = Field(None, description="Payment status")
    payment_amount: Optional[float] = Field(None, ge=0, description="Payment amount")
    payment_method: Optional[str] = Field(None, description="Payment method")
    payment_transaction_id: Optional[str] = Field(None, description="Payment transaction ID")


# ============================================================================
# COURSE STATISTICS SCHEMAS
# ============================================================================

class CourseStats(BaseModel):
    """Schema for course statistics"""
    total_courses: int
    published_courses: int
    draft_courses: int
    archived_courses: int
    total_enrollments: int
    active_enrollments: int
    completed_enrollments: int
    total_revenue: float
    average_rating: float
    courses_by_category: Dict[str, int]
    courses_by_difficulty: Dict[str, int]
    top_courses: List[Dict[str, Any]]


# ============================================================================
# LESSON ATTACHMENT SCHEMAS
# ============================================================================

class LessonAttachmentCreate(BaseModel):
    """Schema for creating a lesson attachment"""
    lesson_id: int = Field(..., description="Lesson ID")
    title: str = Field(..., min_length=1, max_length=255, description="Attachment title")
    description: Optional[str] = Field(None, description="Attachment description")
    file_url: str = Field(..., description="File URL")
    file_type: Optional[str] = Field(None, max_length=50, description="File type")
    file_size: Optional[int] = Field(None, ge=0, description="File size in bytes")
    is_required: bool = Field(default=False, description="Whether attachment is required")
    is_free_preview: bool = Field(default=False, description="Whether attachment is available for preview")


class LessonAttachmentUpdate(BaseModel):
    """Schema for updating lesson attachment"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    file_url: Optional[str] = None
    file_type: Optional[str] = Field(None, max_length=50)
    file_size: Optional[int] = Field(None, ge=0)
    is_required: Optional[bool] = None
    is_free_preview: Optional[bool] = None


class LessonAttachmentResponse(BaseModel):
    """Schema for lesson attachment response data"""
    id: int
    lesson_id: int
    title: str
    description: Optional[str]
    file_url: str
    file_type: Optional[str]
    file_size: Optional[int]
    download_count: int
    is_required: bool
    is_free_preview: bool
    created_at: datetime
    
    class Config:
        from_attributes = True
