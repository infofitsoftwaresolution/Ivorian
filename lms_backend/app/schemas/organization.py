"""
Organization Pydantic schemas for the LMS application
"""
from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime


class OrganizationBase(BaseModel):
    """Base organization schema"""
    name: str = Field(..., min_length=1, max_length=255, description="Organization name")
    description: Optional[str] = Field(None, description="Organization description")
    website: Optional[str] = Field(None, max_length=500, description="Organization website URL")
    contact_email: Optional[EmailStr] = Field(None, description="Organization contact email")
    contact_phone: Optional[str] = Field(None, max_length=20, description="Organization contact phone")
    address: Optional[str] = Field(None, max_length=500, description="Organization address")
    industry: Optional[str] = Field(None, max_length=100, description="Organization industry/sector")
    size: Optional[str] = Field(None, max_length=50, description="Organization size")
    domain: Optional[str] = Field(None, max_length=255, description="Organization domain")
    logo_url: Optional[str] = Field(None, max_length=500, description="Organization logo URL")
    is_active: bool = Field(True, description="Whether the organization is active")


class OrganizationCreate(OrganizationBase):
    """Schema for creating an organization"""
    pass


class OrganizationUpdate(BaseModel):
    """Schema for updating an organization"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    website: Optional[str] = Field(None, max_length=500)
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None, max_length=500)
    industry: Optional[str] = Field(None, max_length=100)
    size: Optional[str] = Field(None, max_length=50)
    domain: Optional[str] = Field(None, max_length=255)
    logo_url: Optional[str] = Field(None, max_length=500)
    is_active: Optional[bool] = None


class OrganizationResponse(OrganizationBase):
    """Schema for organization response"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    user_count: Optional[int] = Field(0, description="Number of users in the organization")
    course_count: Optional[int] = Field(0, description="Number of courses in the organization")
    
    class Config:
        from_attributes = True


class OrganizationListResponse(BaseModel):
    """Schema for paginated organization list response"""
    organizations: list[OrganizationResponse]
    total: int
    page: int
    size: int
    pages: int

