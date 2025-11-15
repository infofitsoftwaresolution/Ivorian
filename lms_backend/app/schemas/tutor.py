"""
Tutor-related Pydantic schemas
"""
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime

class TutorCreate(BaseModel):
    email: EmailStr
    password: Optional[str] = Field(None, min_length=8, description="Password (optional - if not provided, a temporary password will be generated)")
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    phone: Optional[str] = None
    bio: Optional[str] = None
    expertise: Optional[str] = None
    experience_years: Optional[int] = Field(None, ge=0, le=50)
    hourly_rate: Optional[float] = Field(None, ge=0)
    is_active: bool = True
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        """Validate password strength if provided"""
        if v is None:
            return v  # Password is optional - will generate temp password
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v

class TutorUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=50)
    last_name: Optional[str] = Field(None, min_length=1, max_length=50)
    phone: Optional[str] = None
    bio: Optional[str] = None
    expertise: Optional[str] = None
    experience_years: Optional[int] = Field(None, ge=0, le=50)
    hourly_rate: Optional[float] = Field(None, ge=0)
    is_active: Optional[bool] = None

class TutorResponse(BaseModel):
    id: int
    email: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    bio: Optional[str] = None
    expertise: Optional[str] = None
    experience_years: Optional[int] = None
    hourly_rate: Optional[float] = None
    organization_id: Optional[str] = None
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True
