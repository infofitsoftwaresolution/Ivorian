"""
User model for the LMS application
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON, ForeignKey, Date
from sqlalchemy.sql import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
    """
    User model
    """
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    first_name = Column(String(100))
    last_name = Column(String(100))
    phone = Column(String(20))
    bio = Column(Text)
    avatar_url = Column(String(500))
    date_of_birth = Column(Date)
    timezone = Column(String(50), default="UTC")
    language = Column(String(10), default="en")
    status = Column(String(20), default="active")  # active, inactive, suspended, pending
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    is_superuser = Column(Boolean, default=False)
    role = Column(String(50), default="student")  # student, instructor, admin, superuser
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    password_change_required = Column(Boolean, default=False)  # Require password change on first login
    preferences = Column(JSON, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True))
    
    # Relationships
    organization = relationship("Organization", back_populates="users")
    created_courses = relationship("Course", foreign_keys="Course.created_by", back_populates="creator")
    enrollments = relationship("Enrollment", back_populates="student")
    quiz_submissions = relationship("QuizSubmission", back_populates="student")
    assignment_submissions = relationship("AssignmentSubmission", back_populates="student", foreign_keys="AssignmentSubmission.student_id")
    graded_assignments = relationship("AssignmentSubmission", back_populates="grader", foreign_keys="AssignmentSubmission.graded_by")
    roles = relationship("Role", secondary="user_roles", back_populates="users")
    
    @classmethod
    async def get_by_id(cls, db: AsyncSession, user_id: int):
        """
        Get user by ID
        """
        from sqlalchemy import select
        result = await db.execute(select(cls).where(cls.id == user_id))
        return result.scalar_one_or_none()
    
    @classmethod
    async def get_by_email(cls, db: AsyncSession, email: str):
        """
        Get user by email
        """
        from sqlalchemy import select
        result = await db.execute(select(cls).where(cls.email == email))
        return result.scalar_one_or_none() 