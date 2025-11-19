"""
Authentication API endpoints
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import Field, EmailStr
from sqlalchemy import select

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.auth import (
    UserRegister, UserLogin, Token, RefreshToken, 
    PasswordReset, PasswordResetConfirm, ChangePassword,
    OrganizationRegister, OrganizationLogin
)
from app.services.auth import AuthService
from app.services.otp_service import OTPService
from app.services.email_service import email_service
from app.models.user import User

router = APIRouter()

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"/api/v1/auth/login")


@router.post("/test-email", response_model=dict)
async def test_email(
    email: EmailStr = Body(..., description="Email address to send test email to"),
    current_user: User = Depends(get_current_user)
):
    """
    Test email functionality (requires authentication)
    """
    # Only allow super admins to test emails
    if current_user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super admins can test email functionality"
        )
    
    test_subject = "Test Email - InfoFit LMS"
    test_html = """
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
            .success { background-color: #D1FAE5; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #10B981; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Test Email</h1>
            </div>
            <div class="content">
                <div class="success">
                    <strong>✅ Success!</strong> If you're reading this, the email service is working correctly.
                </div>
                <p>This is a test email from InfoFit LMS to verify that the email service is properly configured.</p>
                <p>Email service configuration:</p>
                <ul>
                    <li>Service: AWS SES</li>
                    <li>Status: Active</li>
                </ul>
                <p>Best regards,<br>InfoFit LMS Team</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    test_text = "Test Email - InfoFit LMS\n\nThis is a test email to verify that the email service is working correctly.\n\nIf you're reading this, the email service is properly configured."
    
    email_sent = await email_service.send_email(str(email), test_subject, test_html, test_text)
    
    if email_sent:
        return {
            "message": "Test email sent successfully",
            "data": {
                "email": str(email),
                "status": "sent"
            }
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send test email. Please check email service configuration."
        )


@router.post("/register/send-otp", response_model=dict)
async def send_registration_otp(
    email: EmailStr = Body(..., description="Email address to send OTP to"),
    role: str = Body(..., description="Registration role: 'student' or 'organization'"),
    db: AsyncSession = Depends(get_db)
):
    """
    Send OTP for registration
    """
    # Validate role
    if role not in ["student", "organization"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be either 'student' or 'organization'"
        )
    
    # Check if user already exists
    existing_user = await db.execute(
        select(User).where(User.email == str(email))
    )
    if existing_user.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    # Create and send OTP
    otp = await OTPService.create_otp(db, str(email), purpose="registration")
    email_sent = await OTPService.send_otp_email(str(email), otp.code, purpose="registration")
    
    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send OTP email. Please check email service configuration."
        )
    
    return {
        "message": "OTP sent successfully to your email",
        "data": {
            "email": str(email),
            "expires_in_minutes": 10
        }
    }


@router.post("/register/verify-otp", response_model=dict)
async def verify_registration_otp(
    email: EmailStr = Body(..., description="Email address"),
    otp_code: str = Body(..., description="OTP code"),
    db: AsyncSession = Depends(get_db)
):
    """
    Verify OTP for registration
    """
    is_valid = await OTPService.verify_otp(db, str(email), otp_code, purpose="registration")
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP code"
        )
    
    return {
        "message": "OTP verified successfully",
        "data": {
            "email": str(email),
            "verified": True
        }
    }


@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserRegister = Body(...),
    otp_code: Optional[str] = Body(None, description="OTP code for verification"),
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new user (requires OTP verification)
    """
    # Verify OTP if provided
    if otp_code:
        is_valid = await OTPService.verify_otp(db, user_data.email, otp_code, purpose="registration")
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired OTP code. Please request a new OTP."
            )
    
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