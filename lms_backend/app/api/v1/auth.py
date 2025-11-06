"""
Authentication API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.auth import (
    UserRegister, UserLogin, Token, RefreshToken, 
    PasswordReset, PasswordResetConfirm, ChangePassword,
    OrganizationRegister, OrganizationLogin
)
from app.services.auth import AuthService
from app.models.user import User

router = APIRouter()

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"/api/v1/auth/login")


@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserRegister,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new user
    """
    auth_service = AuthService(db)
    result = await auth_service.register_user(user_data)
    return {
        "message": "User registered successfully",
        "data": result
    }


@router.post("/register/organization", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register_organization(
    org_data: OrganizationRegister,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new organization with admin user
    """
    auth_service = AuthService(db)
    result = await auth_service.register_organization(org_data)
    return {
        "message": "Organization registered successfully",
        "data": result
    }


@router.post("/login", response_model=dict)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """
    Login user and return access token
    """
    auth_service = AuthService(db)
    user_data = UserLogin(email=form_data.username, password=form_data.password)
    result = await auth_service.authenticate_user(user_data)
    return {
        "message": "Login successful",
        "data": result
    }


@router.post("/refresh", response_model=dict)
async def refresh_token(
    refresh_data: RefreshToken,
    db: AsyncSession = Depends(get_db)
):
    """
    Refresh access token using refresh token
    """
    auth_service = AuthService(db)
    result = await auth_service.refresh_token(refresh_data.refresh_token)
    return {
        "message": "Token refreshed successfully",
        "data": result
    }


@router.post("/logout", response_model=dict)
async def logout():
    """
    Logout user (client should discard tokens)
    """
    return {
        "message": "Logout successful",
        "data": None
    }


@router.post("/forgot-password", response_model=dict)
async def forgot_password(
    password_reset: PasswordReset,
    db: AsyncSession = Depends(get_db)
):
    """
    Request password reset
    """
    # TODO: Implement email sending for password reset
    return {
        "message": "Password reset email sent (if user exists)",
        "data": None
    }


@router.post("/reset-password", response_model=dict)
async def reset_password(
    password_reset: PasswordResetConfirm,
    db: AsyncSession = Depends(get_db)
):
    """
    Reset password using token
    """
    # TODO: Implement password reset with token validation
    return {
        "message": "Password reset successful",
        "data": None
    }


@router.post("/change-password", response_model=dict)
async def change_password(
    password_data: ChangePassword,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Change user password
    """
    auth_service = AuthService(db)
    
    # Verify current password
    if not auth_service.verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Update password
    new_hashed_password = auth_service.get_password_hash(password_data.new_password)
    current_user.hashed_password = new_hashed_password
    await db.commit()
    
    return {
        "message": "Password changed successfully",
        "data": None
    }





@router.get("/me", response_model=dict)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get current user information
    """
    return {
        "message": "Current user information",
        "data": {
            "id": current_user.id,
            "email": current_user.email,
            "first_name": current_user.first_name,
            "last_name": current_user.last_name,
            "role": current_user.role,
            "organization_id": current_user.organization_id,
            "is_active": current_user.is_active,
            "created_at": current_user.created_at
        }
    } 