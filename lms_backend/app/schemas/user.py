"""
User Management Schemas
Pydantic models for user-related API operations
"""
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import datetime
from enum import Enum

class UserStatus(str, Enum):
    """User status enumeration"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING = "pending"

class UserRole(str, Enum):
    """User role enumeration"""
    SUPER_ADMIN = "super_admin"
    ORGANIZATION_ADMIN = "organization_admin"
    TUTOR = "tutor"
    STUDENT = "student"

# Base User Schema
class UserBase(BaseModel):
    """Base user schema with common fields"""
    first_name: str = Field(..., min_length=1, max_length=50, description="User's first name")
    last_name: str = Field(..., min_length=1, max_length=50, description="User's last name")
    email: EmailStr = Field(..., description="User's email address")
    phone: Optional[str] = Field(None, max_length=20, description="User's phone number")
    bio: Optional[str] = Field(None, max_length=500, description="User's biography")
    avatar_url: Optional[str] = Field(None, description="URL to user's avatar image")
    date_of_birth: Optional[datetime] = Field(None, description="User's date of birth")
    timezone: Optional[str] = Field(default="UTC", description="User's timezone")
    language: Optional[str] = Field(default="en", description="User's preferred language")

# Create User Schema
class UserCreate(UserBase):
    """Schema for creating a new user"""
    password: Optional[str] = Field(None, min_length=8, description="User's password (optional - if not provided, a temporary password will be generated for admin-created users)")
    organization_id: Optional[int] = Field(None, description="Organization ID if user belongs to an organization")
    roles: List[str] = Field(default=["student"], description="List of role names to assign to user")
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        """Validate password strength if provided"""
        if v is None:
            return v  # Password is optional - will generate temp password for admin-created users
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v

# Update User Schema
class UserUpdate(BaseModel):
    """Schema for updating user information"""
    first_name: Optional[str] = Field(None, min_length=1, max_length=50)
    last_name: Optional[str] = Field(None, min_length=1, max_length=50)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    bio: Optional[str] = Field(None, max_length=500)
    avatar_url: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    timezone: Optional[str] = None
    language: Optional[str] = None
    status: Optional[UserStatus] = None
    organization_id: Optional[int] = None

# Admin Update User Schema (includes role management)
class UserAdminUpdate(UserUpdate):
    """Schema for admin updating user information (includes role management)"""
    roles: Optional[List[str]] = Field(None, description="List of role names to assign to user")
    is_active: Optional[bool] = None

# User Response Schema
class UserResponse(UserBase):
    """Schema for user response data"""
    id: int
    email: EmailStr
    status: UserStatus
    is_active: bool
    is_verified: bool
    organization_id: Optional[int] = None
    roles: List[str] = Field(default_factory=list, description="User's role names")
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# User List Response Schema
class UserListResponse(BaseModel):
    """Schema for paginated user list response"""
    users: List[UserResponse]
    total: int
    page: int
    size: int
    pages: int

# User Profile Schema (for current user)
class UserProfile(BaseModel):
    """Schema for current user profile"""
    id: int
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    timezone: str
    language: str
    status: UserStatus
    is_active: bool
    is_verified: bool
    organization_id: Optional[int] = None
    roles: List[str]
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Change Password Schema
class ChangePasswordRequest(BaseModel):
    """Schema for changing password"""
    current_password: str = Field(..., description="Current password")
    new_password: str = Field(..., min_length=8, description="New password")
    
    @field_validator('new_password')
    @classmethod
    def validate_new_password(cls, v):
        """Validate new password strength"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v

# Admin Reset Password Schema
class AdminResetPasswordRequest(BaseModel):
    """Schema for admin resetting user password"""
    new_password: Optional[str] = Field(None, min_length=8, description="New password (optional - if not provided, a temporary password will be generated)")
    send_email: bool = Field(default=True, description="Whether to send email with new password")
    
    @field_validator('new_password')
    @classmethod
    def validate_new_password(cls, v):
        """Validate new password strength if provided"""
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

# User Search/Filter Schema
class UserFilter(BaseModel):
    """Schema for filtering users"""
    search: Optional[str] = Field(None, description="Search term for name or email")
    status: Optional[UserStatus] = None
    role: Optional[str] = None
    organization_id: Optional[int] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None

# User Statistics Schema
class UserStats(BaseModel):
    """Schema for user statistics"""
    total_users: int
    active_users: int
    inactive_users: int
    suspended_users: int
    pending_users: int
    verified_users: int
    unverified_users: int
    users_by_role: dict[str, int]
    users_by_organization: dict[str, int]
    new_users_this_month: int
    new_users_this_week: int

