"""
Assessment Management Schemas
Pydantic models for assessment-related API operations
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from enum import Enum

from app.models.assessment import QuestionType, QuizStatus, AssignmentStatus, SubmissionStatus


# ============================================================================
# QUIZ SCHEMAS
# ============================================================================

class QuizBase(BaseModel):
    """Base quiz schema"""
    title: str = Field(..., min_length=1, max_length=255, description="Quiz title")
    description: Optional[str] = Field(None, description="Quiz description")
    instructions: Optional[str] = Field(None, description="Quiz instructions")
    time_limit_minutes: Optional[int] = Field(None, ge=0, description="Time limit in minutes (0 for no limit)")
    passing_score: float = Field(default=70.0, ge=0, le=100, description="Passing score percentage")
    max_attempts: int = Field(default=1, ge=0, description="Maximum attempts (0 for unlimited)")
    shuffle_questions: bool = Field(default=False, description="Shuffle questions")
    show_correct_answers: bool = Field(default=True, description="Show correct answers after submission")
    show_results_immediately: bool = Field(default=True, description="Show results immediately after submission")


class QuizCreate(QuizBase):
    """Schema for creating a new quiz"""
    lesson_id: int = Field(..., description="Lesson ID")
    total_points: float = Field(default=100.0, ge=0, description="Total quiz points")
    points_per_question: float = Field(default=1.0, ge=0, description="Points per question")


class QuizUpdate(BaseModel):
    """Schema for updating quiz information"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    instructions: Optional[str] = None
    time_limit_minutes: Optional[int] = Field(None, ge=0)
    passing_score: Optional[float] = Field(None, ge=0, le=100)
    max_attempts: Optional[int] = Field(None, ge=0)
    shuffle_questions: Optional[bool] = None
    show_correct_answers: Optional[bool] = None
    show_results_immediately: Optional[bool] = None
    total_points: Optional[float] = Field(None, ge=0)
    points_per_question: Optional[float] = Field(None, ge=0)
    status: Optional[QuizStatus] = None


class QuizResponse(QuizBase):
    """Schema for quiz response data"""
    id: int
    lesson_id: int
    status: QuizStatus
    total_points: float
    points_per_question: float
    total_questions: int
    total_submissions: int
    average_score: float
    created_at: datetime
    updated_at: Optional[datetime]
    published_at: Optional[datetime]
    
    class Config:
        from_attributes = True


# ============================================================================
# QUIZ QUESTION SCHEMAS
# ============================================================================

class QuizQuestionBase(BaseModel):
    """Base quiz question schema"""
    question_text: str = Field(..., min_length=1, description="Question text")
    question_type: QuestionType = Field(..., description="Question type")
    order: int = Field(..., ge=1, description="Question order")
    points: float = Field(default=1.0, ge=0, description="Question points")
    is_required: bool = Field(default=True, description="Whether question is required")
    allow_partial_credit: bool = Field(default=False, description="Allow partial credit")
    case_sensitive: bool = Field(default=False, description="Case sensitive for text answers")


class QuizQuestionCreate(QuizQuestionBase):
    """Schema for creating a new quiz question"""
    quiz_id: int = Field(..., description="Quiz ID")
    options: Optional[Dict[str, str]] = Field(None, description="Answer options for multiple choice")
    correct_answer: Optional[List[str]] = Field(None, description="Correct answer(s)")
    explanation: Optional[str] = Field(None, description="Explanation of correct answer")


class QuizQuestionUpdate(BaseModel):
    """Schema for updating quiz question"""
    question_text: Optional[str] = Field(None, min_length=1)
    question_type: Optional[QuestionType] = None
    order: Optional[int] = Field(None, ge=1)
    points: Optional[float] = Field(None, ge=0)
    is_required: Optional[bool] = None
    allow_partial_credit: Optional[bool] = None
    case_sensitive: Optional[bool] = None
    options: Optional[Dict[str, str]] = None
    correct_answer: Optional[List[str]] = None
    explanation: Optional[str] = None


class QuizQuestionResponse(QuizQuestionBase):
    """Schema for quiz question response data"""
    id: int
    quiz_id: int
    options: Optional[Dict[str, str]]
    correct_answer: Optional[List[str]]
    explanation: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


# ============================================================================
# QUIZ SUBMISSION SCHEMAS
# ============================================================================

class QuizSubmissionCreate(BaseModel):
    """Schema for creating a quiz submission"""
    quiz_id: int = Field(..., description="Quiz ID")
    student_id: int = Field(..., description="Student ID")
    enrollment_id: int = Field(..., description="Enrollment ID")


class QuizSubmissionResponse(BaseModel):
    """Schema for quiz submission response data"""
    id: int
    quiz_id: int
    student_id: int
    enrollment_id: int
    attempt_number: int
    status: str
    score: float
    percentage: float
    passed: bool
    started_at: datetime
    completed_at: Optional[datetime]
    time_taken_minutes: int
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class QuizAnswerCreate(BaseModel):
    """Schema for creating a quiz answer"""
    submission_id: int = Field(..., description="Submission ID")
    question_id: int = Field(..., description="Question ID")
    answer_text: Optional[str] = Field(None, description="Text answer")
    selected_options: Optional[List[str]] = Field(None, description="Selected options")


class QuizAnswerResponse(BaseModel):
    """Schema for quiz answer response data"""
    id: int
    submission_id: int
    question_id: int
    answer_text: Optional[str]
    selected_options: Optional[List[str]]
    is_correct: bool
    points_earned: float
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# ASSIGNMENT SCHEMAS
# ============================================================================

class AssignmentBase(BaseModel):
    """Base assignment schema"""
    title: str = Field(..., min_length=1, max_length=255, description="Assignment title")
    description: Optional[str] = Field(None, description="Assignment description")
    instructions: Optional[str] = Field(None, description="Assignment instructions")
    due_date: Optional[datetime] = Field(None, description="Assignment due date")
    allow_late_submissions: bool = Field(default=False, description="Allow late submissions")
    late_penalty_percentage: float = Field(default=10.0, ge=0, le=100, description="Late penalty percentage")
    max_submissions: int = Field(default=1, ge=1, description="Maximum submissions allowed")
    allow_file_uploads: bool = Field(default=True, description="Allow file uploads")
    allowed_file_types: Optional[List[str]] = Field(default_factory=list, description="Allowed file types")
    max_file_size_mb: int = Field(default=10, ge=1, description="Maximum file size in MB")
    max_points: float = Field(default=100.0, ge=0, description="Maximum points")
    passing_score: float = Field(default=70.0, ge=0, le=100, description="Passing score percentage")


class AssignmentCreate(AssignmentBase):
    """Schema for creating a new assignment"""
    topic_id: int = Field(..., description="Topic ID")


class AssignmentUpdate(BaseModel):
    """Schema for updating assignment information"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    instructions: Optional[str] = None
    due_date: Optional[datetime] = None
    allow_late_submissions: Optional[bool] = None
    late_penalty_percentage: Optional[float] = Field(None, ge=0, le=100)
    max_submissions: Optional[int] = Field(None, ge=1)
    allow_file_uploads: Optional[bool] = None
    allowed_file_types: Optional[List[str]] = None
    max_file_size_mb: Optional[int] = Field(None, ge=1)
    max_points: Optional[float] = Field(None, ge=0)
    passing_score: Optional[float] = Field(None, ge=0, le=100)
    status: Optional[AssignmentStatus] = None


class AssignmentResponse(AssignmentBase):
    """Schema for assignment response data"""
    id: int
    topic_id: int
    status: AssignmentStatus
    total_submissions: int
    average_score: float
    created_at: datetime
    updated_at: Optional[datetime]
    published_at: Optional[datetime]
    
    class Config:
        from_attributes = True


# ============================================================================
# ASSIGNMENT SUBMISSION SCHEMAS
# ============================================================================

class AssignmentSubmissionCreate(BaseModel):
    """Schema for creating an assignment submission"""
    assignment_id: int = Field(..., description="Assignment ID")
    student_id: int = Field(..., description="Student ID")
    enrollment_id: int = Field(..., description="Enrollment ID")
    submission_text: Optional[str] = Field(None, description="Submission text")
    attachment_urls: Optional[List[str]] = Field(default_factory=list, description="Attachment URLs")


class AssignmentSubmissionUpdate(BaseModel):
    """Schema for updating assignment submission"""
    submission_text: Optional[str] = None
    attachment_urls: Optional[List[str]] = None
    status: Optional[SubmissionStatus] = None


class AssignmentSubmissionResponse(BaseModel):
    """Schema for assignment submission response data"""
    id: int
    assignment_id: int
    student_id: int
    enrollment_id: int
    graded_by: Optional[int]
    submission_number: int
    status: SubmissionStatus
    submission_text: Optional[str]
    attachment_urls: Optional[List[str]]
    score: float
    percentage: float
    feedback: Optional[str]
    graded_at: Optional[datetime]
    is_late: bool
    late_penalty_applied: float
    submitted_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


# ============================================================================
# ASSESSMENT FILTER SCHEMAS
# ============================================================================

class QuizFilter(BaseModel):
    """Schema for filtering quizzes"""
    search: Optional[str] = Field(None, description="Search term for title or description")
    status: Optional[QuizStatus] = None
    lesson_id: Optional[int] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None


class AssignmentFilter(BaseModel):
    """Schema for filtering assignments"""
    search: Optional[str] = Field(None, description="Search term for title or description")
    status: Optional[AssignmentStatus] = None
    topic_id: Optional[int] = None
    due_date_after: Optional[datetime] = None
    due_date_before: Optional[datetime] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None


# ============================================================================
# ASSESSMENT STATISTICS SCHEMAS
# ============================================================================

class QuizStats(BaseModel):
    """Schema for quiz statistics"""
    total_quizzes: int
    active_quizzes: int
    draft_quizzes: int
    total_submissions: int
    average_score: float
    pass_rate: float
    average_completion_time: float
    quizzes_by_lesson: Dict[str, int]


class AssignmentStats(BaseModel):
    """Schema for assignment statistics"""
    total_assignments: int
    published_assignments: int
    draft_assignments: int
    closed_assignments: int
    total_submissions: int
    graded_submissions: int
    average_score: float
    late_submissions: int
    assignments_by_topic: Dict[str, int]


# ============================================================================
# COMPREHENSIVE ASSESSMENT SCHEMAS
# ============================================================================

class QuizWithQuestions(QuizResponse):
    """Schema for quiz with questions"""
    questions: List[QuizQuestionResponse] = []


class QuizSubmissionWithAnswers(QuizSubmissionResponse):
    """Schema for quiz submission with answers"""
    answers: List[QuizAnswerResponse] = []


class AssignmentWithSubmissions(AssignmentResponse):
    """Schema for assignment with submissions"""
    submissions: List[AssignmentSubmissionResponse] = []


class AssessmentSummary(BaseModel):
    """Schema for assessment summary"""
    total_quizzes: int
    total_assignments: int
    completed_quizzes: int
    completed_assignments: int
    average_quiz_score: float
    average_assignment_score: float
    total_points_earned: float
    total_points_possible: float
    overall_percentage: float
