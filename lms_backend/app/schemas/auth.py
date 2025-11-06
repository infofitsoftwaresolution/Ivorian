"""
Authentication schemas for the LMS application
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class UserRegister(BaseModel):
    """User registration schema"""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=8, description="User password (min 8 characters)")
    first_name: str = Field(..., min_length=1, max_length=100, description="User first name")
    last_name: str = Field(..., min_length=1, max_length=100, description="User last name")
    role: str = Field(default="student", description="User role (student, instructor, admin)")
    organization_id: Optional[int] = Field(None, description="Organization ID if applicable")


class UserLogin(BaseModel):
    """User login schema"""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="User password")


class Token(BaseModel):
    """Token response schema"""
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiration time in seconds")
    refresh_token: Optional[str] = Field(None, description="JWT refresh token")


class TokenData(BaseModel):
    """Token data schema for payload"""
    email: Optional[str] = None
    user_id: Optional[int] = None
    role: Optional[str] = None
    organization_id: Optional[int] = None


class RefreshToken(BaseModel):
    """Refresh token schema"""
    refresh_token: str = Field(..., description="JWT refresh token")


class PasswordReset(BaseModel):
    """Password reset request schema"""
    email: EmailStr = Field(..., description="User email address")


class PasswordResetConfirm(BaseModel):
    """Password reset confirmation schema"""
    token: str = Field(..., description="Password reset token")
    new_password: str = Field(..., min_length=8, description="New password (min 8 characters)")


class ChangePassword(BaseModel):
    """Change password schema"""
    current_password: str = Field(..., description="Current password")
    new_password: str = Field(..., min_length=8, description="New password (min 8 characters)")


class OrganizationRegister(BaseModel):
    """Organization registration schema"""
    name: str = Field(..., min_length=1, max_length=200, description="Organization name")
    description: str = Field(..., min_length=1, max_length=1000, description="Organization description")
    website: str = Field(..., description="Organization website URL")
    contact_email: EmailStr = Field(..., description="Organization contact email")
    contact_phone: Optional[str] = Field(None, max_length=20, description="Organization contact phone")
    address: Optional[str] = Field(None, max_length=500, description="Organization address")
    industry: Optional[str] = Field(None, max_length=100, description="Organization industry/sector")
    size: Optional[str] = Field(None, max_length=50, description="Organization size (e.g., '1-10', '11-50', '51-200', '200+')")
    
    # Admin user details for the organization
    admin_email: EmailStr = Field(..., description="Admin user email address")
    admin_password: str = Field(..., min_length=8, description="Admin user password (min 8 characters)")
    admin_first_name: str = Field(..., min_length=1, max_length=100, description="Admin user first name")
    admin_last_name: str = Field(..., min_length=1, max_length=100, description="Admin user last name")


class OrganizationLogin(BaseModel):
    """Organization login schema"""
    email: EmailStr = Field(..., description="Admin user email address")
    password: str = Field(..., description="Admin user password")
