"""
Organization model for the LMS application
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Organization(Base):
    """
    Organization model
    """
    __tablename__ = "organizations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    website = Column(String(500))
    contact_email = Column(String(255))
    contact_phone = Column(String(20))
    address = Column(String(500))
    industry = Column(String(100))
    size = Column(String(50))
    domain = Column(String(255), unique=True)
    logo_url = Column(String(500))
    settings = Column(JSON, default={})
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    users = relationship("User", back_populates="organization")
    courses = relationship("Course", back_populates="organization")
