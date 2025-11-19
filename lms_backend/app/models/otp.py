"""
OTP (One-Time Password) model for email verification
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class OTP(Base):
    """
    OTP model for email verification during registration
    """
    __tablename__ = "otps"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False, index=True)
    code = Column(String(6), nullable=False)  # 6-digit OTP code
    purpose = Column(String(50), nullable=False, default="registration")  # registration, password_reset, etc.
    is_verified = Column(Boolean, default=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    verified_at = Column(DateTime(timezone=True), nullable=True)
    
    # Optional: Link to user if registration is completed
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationship
    user = relationship("User", foreign_keys=[user_id])

