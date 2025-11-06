"""
Tutor-related Pydantic schemas
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class TutorCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    phone: Optional[str] = None
    bio: Optional[str] = None
    expertise: Optional[str] = None
    experience_years: Optional[int] = Field(None, ge=0, le=50)
    hourly_rate: Optional[float] = Field(None, ge=0)
    is_active: bool = True

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
