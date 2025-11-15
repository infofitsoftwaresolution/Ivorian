"""
Assessment Management Models
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON, ForeignKey, Float, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.core.database import Base


class QuestionType(str, enum.Enum):
    """Question type enumeration"""
    MULTIPLE_CHOICE = "multiple_choice"
    TRUE_FALSE = "true_false"
    SHORT_ANSWER = "short_answer"
    ESSAY = "essay"
    FILL_BLANK = "fill_blank"
    MATCHING = "matching"


class QuizStatus(str, enum.Enum):
    """Quiz status enumeration"""
    DRAFT = "draft"
    ACTIVE = "active"
    INACTIVE = "inactive"


class AssignmentStatus(str, enum.Enum):
    """Assignment status enumeration"""
    DRAFT = "draft"
    PUBLISHED = "published"
    CLOSED = "closed"


class SubmissionStatus(str, enum.Enum):
    """Submission status enumeration"""
    DRAFT = "draft"
    SUBMITTED = "submitted"
    GRADED = "graded"
    LATE = "late"


class Quiz(Base):
    """
    Quiz model - assessments within lessons
    """
    __tablename__ = "quizzes"
    
    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    
    # Basic Information
    title = Column(String(255), nullable=False)
    description = Column(Text)
    instructions = Column(Text)
    
    # Quiz Settings
    status = Column(Enum(QuizStatus), default=QuizStatus.DRAFT)
    time_limit_minutes = Column(Integer)  # 0 for no time limit
    passing_score = Column(Float, default=70.0)  # percentage
    max_attempts = Column(Integer, default=1)  # 0 for unlimited
    shuffle_questions = Column(Boolean, default=False)
    show_correct_answers = Column(Boolean, default=True)
    show_results_immediately = Column(Boolean, default=True)
    
    # Scoring
    total_points = Column(Float, default=100.0)
    points_per_question = Column(Float, default=1.0)
    
    # Statistics
    total_questions = Column(Integer, default=0)
    total_submissions = Column(Integer, default=0)
    average_score = Column(Float, default=0.0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    published_at = Column(DateTime(timezone=True))
    
    # Relationships
    lesson = relationship("Lesson", back_populates="quiz")
    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan")
    submissions = relationship("QuizSubmission", back_populates="quiz", cascade="all, delete-orphan")


class QuizQuestion(Base):
    """
    Quiz question model
    """
    __tablename__ = "quiz_questions"
    
    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    
    # Question Information
    question_text = Column(Text, nullable=False)
    question_type = Column(Enum(QuestionType), nullable=False)
    order = Column(Integer, nullable=False)  # for sorting
    
    # Options (for multiple choice, true/false)
    options = Column(JSON)  # {"A": "option1", "B": "option2", ...}
    correct_answer = Column(JSON)  # ["A"] or ["A", "B"] for multiple correct
    explanation = Column(Text)  # explanation of correct answer
    
    # Scoring
    points = Column(Float, default=1.0)
    is_required = Column(Boolean, default=True)
    
    # Settings
    allow_partial_credit = Column(Boolean, default=False)
    case_sensitive = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    quiz = relationship("Quiz", back_populates="questions")
    answers = relationship("QuizAnswer", back_populates="question", cascade="all, delete-orphan")


class QuizSubmission(Base):
    """
    Student quiz submission
    """
    __tablename__ = "quiz_submissions"
    
    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    enrollment_id = Column(Integer, ForeignKey("enrollments.id"), nullable=False)
    
    # Submission details
    attempt_number = Column(Integer, default=1)
    status = Column(String(50), default="in_progress")  # in_progress, completed, abandoned
    
    # Scoring
    score = Column(Float, default=0.0)
    percentage = Column(Float, default=0.0)
    passed = Column(Boolean, default=False)
    
    # Timing
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))
    time_taken_minutes = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    quiz = relationship("Quiz", back_populates="submissions")
    student = relationship("User")
    enrollment = relationship("Enrollment")
    answers = relationship("QuizAnswer", back_populates="submission", cascade="all, delete-orphan")


class QuizAnswer(Base):
    """
    Individual question answers in quiz submissions
    """
    __tablename__ = "quiz_answers"
    
    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("quiz_submissions.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("quiz_questions.id"), nullable=False)
    
    # Answer details
    answer_text = Column(Text)  # for text-based questions
    selected_options = Column(JSON)  # ["A", "B"] for multiple choice
    is_correct = Column(Boolean, default=False)
    points_earned = Column(Float, default=0.0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    submission = relationship("QuizSubmission", back_populates="answers")
    question = relationship("QuizQuestion", back_populates="answers")


class Assignment(Base):
    """
    Assignment model - tasks within topics
    """
    __tablename__ = "assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)
    
    # Basic Information
    title = Column(String(255), nullable=False)
    description = Column(Text)
    instructions = Column(Text)
    
    # Assignment Settings
    status = Column(Enum(AssignmentStatus), default=AssignmentStatus.DRAFT)
    due_date = Column(DateTime(timezone=True))
    allow_late_submissions = Column(Boolean, default=False)
    late_penalty_percentage = Column(Float, default=10.0)  # penalty per day
    
    # Submission Settings
    max_submissions = Column(Integer, default=1)
    allow_file_uploads = Column(Boolean, default=True)
    allowed_file_types = Column(JSON)  # ["pdf", "doc", "docx"]
    max_file_size_mb = Column(Integer, default=10)
    
    # Scoring
    max_points = Column(Float, default=100.0)
    passing_score = Column(Float, default=70.0)
    
    # Statistics
    total_submissions = Column(Integer, default=0)
    average_score = Column(Float, default=0.0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    published_at = Column(DateTime(timezone=True))
    
    # Relationships
    topic = relationship("Topic", back_populates="assignments")
    submissions = relationship("AssignmentSubmission", back_populates="assignment", cascade="all, delete-orphan")


class AssignmentSubmission(Base):
    """
    Student assignment submission
    """
    __tablename__ = "assignments_submissions"
    
    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    enrollment_id = Column(Integer, ForeignKey("enrollments.id"), nullable=False)
    graded_by = Column(Integer, ForeignKey("users.id"))
    
    # Submission details
    submission_number = Column(Integer, default=1)
    status = Column(Enum(SubmissionStatus), default=SubmissionStatus.DRAFT)
    
    # Content
    submission_text = Column(Text)
    attachment_urls = Column(JSON)  # ["url1", "url2"]
    
    # Grading
    score = Column(Float, default=0.0)
    percentage = Column(Float, default=0.0)
    feedback = Column(Text)
    graded_at = Column(DateTime(timezone=True))
    
    # Late submission
    is_late = Column(Boolean, default=False)
    late_penalty_applied = Column(Float, default=0.0)
    
    # Timestamps
    submitted_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    assignment = relationship("Assignment", back_populates="submissions")
    student = relationship("User", foreign_keys=[student_id])
    enrollment = relationship("Enrollment")
    grader = relationship("User", foreign_keys=[graded_by]) 