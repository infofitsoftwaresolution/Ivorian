"""
User Management API Endpoints
FastAPI routes for user-related operations
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
import math

from app.core.database import get_db
from app.core.dependencies import get_current_user
# from app.core.permissions import require_permission, require_role  # Temporarily disabled
from app.schemas.user import (
    UserCreate, UserUpdate, UserAdminUpdate, UserResponse, UserProfile,
    UserListResponse, UserFilter, UserStats, ChangePasswordRequest, AdminResetPasswordRequest
)
from app.services.user import UserService
from app.services.course import EnrollmentService
from app.models.user import User
from app.schemas.tutor import TutorCreate, TutorResponse
from app.schemas.course import EnrollmentResponse
from app.core.errors import ValidationError, AuthorizationError, ResourceNotFoundError
import logging

logger = logging.getLogger(__name__)

router = APIRouter(tags=["users"])

# Helper function to convert User model to UserResponse
def user_to_response(user: User) -> UserResponse:
    """Convert User model to UserResponse schema"""
    # For now, just use the role field directly to avoid relationship issues
    roles = [user.role] if user.role else []
    
    # Handle None values with defaults
    status = user.status if user.status else "active"
    is_verified = user.is_verified if user.is_verified is not None else False
    is_active = user.is_active if user.is_active is not None else True
    
    return UserResponse(
        id=user.id,
        first_name=user.first_name or "",
        last_name=user.last_name or "",
        email=user.email,
        phone=user.phone,
        bio=user.bio,
        avatar_url=user.avatar_url,
        date_of_birth=user.date_of_birth,
        timezone=user.timezone or "UTC",
        language=user.language or "en",
        status=status,
        is_active=is_active,
        is_verified=is_verified,
        organization_id=user.organization_id,
        roles=roles,
        created_at=user.created_at,
        updated_at=user.updated_at,
        last_login=user.last_login
    )

# Helper function to convert User model to UserProfile
def user_to_profile(user: User) -> UserProfile:
    """Convert User model to UserProfile schema"""
    # For now, just use the role field directly to avoid relationship issues
    roles = [user.role] if user.role else []
    
    # Handle None values with defaults
    status = user.status if user.status else "active"
    is_verified = user.is_verified if user.is_verified is not None else False
    is_active = user.is_active if user.is_active is not None else True
    
    return UserProfile(
        id=user.id,
        first_name=user.first_name or "",
        last_name=user.last_name or "",
        email=user.email,
        phone=user.phone,
        bio=user.bio,
        avatar_url=user.avatar_url,
        date_of_birth=user.date_of_birth,
        timezone=user.timezone or "UTC",
        language=user.language or "en",
        status=status,
        is_active=is_active,
        is_verified=is_verified,
        organization_id=user.organization_id,
        roles=roles,
        created_at=user.created_at,
        updated_at=user.updated_at,
        last_login=user.last_login
    )

# Tutor Management Routes (must come before /{user_id} routes)
@router.post("/tutors", response_model=UserResponse)
async def create_tutor(
    tutor_data: TutorCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new tutor (Organization Admin only)"""
    try:
        # Check if user is organization admin
        if current_user.role != "organization_admin":
            raise HTTPException(status_code=403, detail="Only organization admins can create tutors")
        
        if not current_user.organization_id:
            raise HTTPException(status_code=400, detail="Organization admin must belong to an organization")
        
        # Create tutor
        tutor = await UserService.create_tutor(
            db=db,
            tutor_data=tutor_data.model_dump(),
            organization_id=current_user.organization_id,
            current_user=current_user
        )
        
        return user_to_response(tutor)
        
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except AuthorizationError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating tutor: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/tutors", response_model=UserListResponse)
async def get_tutors(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Page size"),
    search: Optional[str] = Query(None, description="Search term for name or email"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get tutors for the current organization (Organization Admin only)"""
    try:
        # Check if user is organization admin
        if current_user.role != "organization_admin":
            raise HTTPException(status_code=403, detail="Only organization admins can view tutors")
        
        if not current_user.organization_id:
            raise HTTPException(status_code=400, detail="Organization admin must belong to an organization")
        
        # Calculate pagination
        skip = (page - 1) * size
        
        # Get tutors
        tutors, total = await UserService.get_tutors_by_organization(
            db=db,
            organization_id=current_user.organization_id,
            skip=skip,
            limit=size,
            search=search,
            is_active=is_active
        )
        
        # Calculate pagination info
        pages = math.ceil(total / size) if total > 0 else 0
        
        return UserListResponse(
            users=[user_to_response(tutor) for tutor in tutors],
            total=total,
            page=page,
            size=size,
            pages=pages
        )
        
    except Exception as e:
        logger.error(f"Error getting tutors: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/me", response_model=UserProfile, summary="Get current user profile")
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get the current user's profile information.
    
    Returns detailed profile information for the authenticated user.
    """
    try:
        # Get fresh user data with roles
        user = await UserService.get_user_by_id(db, current_user.id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return user_to_profile(user)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving user profile: {str(e)}"
        )

@router.put("/me", response_model=UserProfile, summary="Update current user profile")
async def update_current_user_profile(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update the current user's profile information.
    
    Users can update their own profile information including name, email, bio, etc.
    """
    try:
        updated_user = await UserService.update_user(
            db, current_user.id, user_data, current_user
        )
        return user_to_profile(updated_user)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error updating user profile: {str(e)}"
        )

@router.post("/me/change-password", summary="Change current user password")
async def change_current_user_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Change the current user's password.
    
    Requires the current password for verification.
    """
    try:
        success = await UserService.change_password(
            db, current_user.id, password_data.current_password, password_data.new_password
        )
        return {"message": "Password changed successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error changing password: {str(e)}"
        )

@router.get("/", response_model=UserListResponse, summary="List users (Admin only)")
# @require_permission("user", "manage")  # Temporarily disabled
async def list_users(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Page size"),
    search: Optional[str] = Query(None, description="Search term for name or email"),
    status: Optional[str] = Query(None, description="Filter by user status"),
    role: Optional[str] = Query(None, description="Filter by user role"),
    organization_id: Optional[int] = Query(None, description="Filter by organization ID"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    is_verified: Optional[bool] = Query(None, description="Filter by verification status"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a paginated list of users.
    
    This endpoint is restricted to users with user management permissions.
    Supports filtering by various criteria.
    """
    try:
        # FastAPI automatically parses boolean query params from strings
        # "true" -> True, "false" -> False, anything else -> None
        # Build filters
        filters = UserFilter(
            search=search,
            status=status,
            role=role,
            organization_id=organization_id,
            is_active=is_active,  # FastAPI handles string-to-bool conversion
            is_verified=is_verified  # FastAPI handles string-to-bool conversion
        )
        
        # Calculate pagination
        skip = (page - 1) * size
        
        # Get users
        users, total = await UserService.get_users(
            db, skip, size, filters, current_user
        )
        
        # Calculate pagination info
        pages = math.ceil(total / size) if total > 0 else 0
        
        return UserListResponse(
            users=[user_to_response(user) for user in users],
            total=total,
            page=page,
            size=size,
            pages=pages
        )
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_traceback = traceback.format_exc()
        logger.error(f"Error retrieving users: {str(e)}\n{error_traceback}")
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving users: {str(e)}"
        )

@router.get("/{user_id}", response_model=UserResponse, summary="Get user by ID (Admin only)")
# @require_permission("user", "manage")  # Temporarily disabled
async def get_user_by_id(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific user by ID.
    
    This endpoint is restricted to users with user management permissions.
    """
    try:
        user = await UserService.get_user_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return user_to_response(user)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving user: {str(e)}"
        )

@router.post("/", response_model=UserResponse, summary="Create new user (Admin only)")
# @require_permission("user", "manage")  # Temporarily disabled
async def create_user(
    user_data: UserCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new user.
    
    This endpoint is restricted to users with user management permissions.
    """
    try:
        user = await UserService.create_user(db, user_data, current_user)
        return user_to_response(user)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error creating user: {str(e)}"
        )

@router.put("/{user_id}", response_model=UserResponse, summary="Update user (Admin only)")
# @require_permission("user", "manage")  # Temporarily disabled
async def update_user(
    user_id: int,
    user_data: UserAdminUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a user (admin version with role management).
    
    This endpoint is restricted to users with user management permissions.
    Allows updating user roles and other admin-only fields.
    """
    try:
        updated_user = await UserService.admin_update_user(
            db, user_id, user_data, current_user
        )
        return user_to_response(updated_user)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error updating user: {str(e)}"
        )

@router.post("/{user_id}/reset-password", summary="Reset user password (Admin only)")
async def reset_user_password(
    user_id: int,
    password_data: AdminResetPasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Reset a user's password (Admin only).
    
    Super admins can reset any user's password.
    Organization admins can only reset passwords for users in their organization.
    
    If new_password is not provided, a temporary password will be generated.
    """
    try:
        result = await UserService.admin_reset_password(
            db=db,
            user_id=user_id,
            new_password=password_data.new_password,
            send_email=password_data.send_email,
            current_user=current_user
        )
        
        response = {
            "message": "Password reset successfully",
            "email_sent": result["email_sent"],
            "password_change_required": result["password_change_required"]
        }
        
        # Include password in response so admin can share it manually if email fails
        # This is safe because only admins can access this endpoint
        response["password"] = result["password"]
        
        return response
        
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except AuthorizationError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ResourceNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error resetting password: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error resetting password: {str(e)}"
        )

@router.delete("/{user_id}", summary="Delete user (Admin only)")
# @require_permission("user", "manage")  # Temporarily disabled
async def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a user (soft delete).
    
    This endpoint is restricted to users with user management permissions.
    Performs a soft delete by setting is_active to False.
    """
    try:
        success = await UserService.delete_user(db, user_id, current_user)
        return {"message": "User deleted successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error deleting user: {str(e)}"
        )

@router.get("/stats/overview", response_model=UserStats, summary="Get user statistics (Admin only)")
# @require_permission("analytics", "read")  # Temporarily disabled
async def get_user_statistics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get user statistics and analytics.
    
    This endpoint is restricted to users with analytics read permissions.
    Returns comprehensive user statistics including counts by status, role, and organization.
    """
    try:
        stats = await UserService.get_user_stats(db, current_user)
        return stats
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving user statistics: {str(e)}"
        )

@router.post("/{user_id}/roles", summary="Assign roles to user (Admin only)")
# @require_permission("user", "manage")  # Temporarily disabled
async def assign_roles_to_user(
    user_id: int,
    roles: List[str],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Assign roles to a user.
    
    This endpoint is restricted to users with user management permissions.
    Replaces all existing roles with the provided list.
    """
    try:
        success = await UserService.assign_roles_to_user(db, user_id, roles)
        return {"message": "Roles assigned successfully", "roles": roles}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error assigning roles: {str(e)}"
        )

@router.get("/search/email/{email}", response_model=UserResponse, summary="Search user by email (Admin only)")
# @require_permission("user", "manage")  # Temporarily disabled
async def search_user_by_email(
    email: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Search for a user by email address.
    
    This endpoint is restricted to users with user management permissions.
    """
    try:
        user = await UserService.get_user_by_email(db, email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return user_to_response(user)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error searching user: {str(e)}"
        )

@router.get("/debug/organizations", summary="Debug: List all organizations")
async def debug_organizations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Debug endpoint to list all organizations"""
    try:
        from app.models.organization import Organization
        from sqlalchemy import select
        
        query = select(Organization)
        result = await db.execute(query)
        organizations = result.scalars().all()
        
        return {
            "organizations": [
                {
                    "id": org.id,
                    "name": org.name,
                    "description": org.description
                }
                for org in organizations
            ],
            "current_user_org_id": current_user.organization_id
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving organizations: {str(e)}"
        )


# Debug endpoint to check enrollments
@router.get("/debug/enrollments")
async def debug_enrollments(
    db: AsyncSession = Depends(get_db)
):
    """Debug endpoint to check all enrollments in the database"""
    from sqlalchemy import text
    
    # Get all enrollments
    result = await db.execute(text("SELECT * FROM enrollments"))
    enrollments = result.fetchall()
    
    # Get all courses
    result = await db.execute(text("SELECT id, title, status FROM courses"))
    courses = result.fetchall()
    
    # Get all users with student role
    result = await db.execute(text("SELECT id, first_name, last_name, email, role FROM users WHERE role = 'student'"))
    students = result.fetchall()
    
    return {
        "enrollments": [dict(row._mapping) for row in enrollments],
        "courses": [dict(row._mapping) for row in courses],
        "students": [dict(row._mapping) for row in students],
        "total_enrollments": len(enrollments),
        "total_courses": len(courses),
        "total_students": len(students)
    }


@router.get("/me/enrollments", response_model=List[EnrollmentResponse])
async def get_my_enrollments(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's course enrollments"""
    try:
        print(f"[API] Getting enrollments for user {current_user.id} with role {current_user.role}")
        enrollments = await EnrollmentService.get_user_enrollments(db, current_user.id)
        print(f"[API] Found {len(enrollments)} enrollments for user {current_user.id}")
        for enrollment in enrollments:
            print(f"  - Course {enrollment.course_id}: {enrollment.status}")
        return enrollments
    except Exception as e:
        print(f"[API] ERROR fetching user enrollments: {str(e)}")
        import traceback
        traceback.print_exc()
        logger.error(f"Error fetching user enrollments: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving enrollments: {str(e)}"
        ) 