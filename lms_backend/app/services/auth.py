"""
Authentication service for user management
"""
import secrets
import string
from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.models.user import User
from app.models.organization import Organization
from app.schemas.auth import UserRegister, UserLogin, TokenData, OrganizationRegister
from app.core.security import verify_password, get_password_hash, create_tokens, verify_token
from app.core.config import settings
from app.services.email_service import email_service
from app.core.logging import app_logger


class AuthService:
    """Authentication service class"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def register_user(self, user_data: UserRegister) -> Dict[str, Any]:
        """
        Register a new user
        """
        # Check if user already exists
        existing_user = await self.db.execute(
            select(User).where(User.email == user_data.email)
        )
        if existing_user.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )
        
        # Check if organization exists if provided
        if user_data.organization_id:
            org = await self.db.execute(
                select(Organization).where(Organization.id == user_data.organization_id)
            )
            if not org.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Organization not found"
                )
        
        # Create new user
        hashed_password = get_password_hash(user_data.password)
        user = User(
            email=user_data.email,
            hashed_password=hashed_password,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            role=user_data.role,
            organization_id=user_data.organization_id
        )
        
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        
        # Create tokens
        tokens = create_tokens(str(user.id))
        
        return {
            "user": {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role,
                "organization_id": user.organization_id
            },
            "tokens": tokens
        }
    
    async def authenticate_user(self, user_data: UserLogin) -> Dict[str, Any]:
        """
        Authenticate user and return tokens
        """
        # Find user by email
        user = await self.db.execute(
            select(User).where(User.email == user_data.email)
        )
        user = user.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        # Verify password
        if not verify_password(user_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        # Check if user is active
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account is disabled"
            )
        
        # Check if password change is required
        password_change_required = user.password_change_required or False
        
        # Create tokens
        tokens = create_tokens(str(user.id))
        
        return {
            "user": {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role,
                "organization_id": user.organization_id,
                "password_change_required": password_change_required
            },
            "tokens": tokens,
            "password_change_required": password_change_required
        }
    
    async def get_current_user(self, token: str) -> Optional[User]:
        """
        Get current user from token
        """
        payload = verify_token(token)
        if payload is None:
            return None
        
        user_id = int(payload)
        user = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        return user.scalar_one_or_none()
    
    async def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        """
        Refresh access token using refresh token
        """
        from app.core.security import verify_refresh_token
        
        payload = verify_refresh_token(refresh_token)
        if payload is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        user_id = int(payload)
        user = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        user = user.scalar_one_or_none()
        
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )
        
        # Create new tokens
        tokens = create_tokens(str(user.id))
        
        return {
            "user": {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role,
                "organization_id": user.organization_id
            },
            "tokens": tokens
        }
    
    async def register_organization(self, org_data: OrganizationRegister) -> Dict[str, Any]:
        """
        Register a new organization with admin user
        """
        # Check if admin user already exists
        existing_user = await self.db.execute(
            select(User).where(User.email == org_data.admin_email)
        )
        if existing_user.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Admin user with this email already exists"
            )
        
        # Check if organization with same name exists
        existing_org = await self.db.execute(
            select(Organization).where(Organization.name == org_data.name)
        )
        if existing_org.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Organization with this name already exists"
            )
        
        # Create organization
        organization = Organization(
            name=org_data.name,
            description=org_data.description,
            website=org_data.website,
            contact_email=org_data.contact_email,
            contact_phone=org_data.contact_phone,
            address=org_data.address,
            industry=org_data.industry,
            size=org_data.size
        )
        
        self.db.add(organization)
        await self.db.commit()
        await self.db.refresh(organization)
        
        # Generate temporary password
        temp_password = self._generate_temp_password()
        hashed_password = get_password_hash(temp_password)
        
        # Create admin user for the organization
        admin_user = User(
            email=org_data.admin_email,
            hashed_password=hashed_password,
            first_name=org_data.admin_first_name,
            last_name=org_data.admin_last_name,
            role="organization_admin",
            organization_id=organization.id,
            is_active=True,
            password_change_required=True  # Require password change on first login
        )
        
        self.db.add(admin_user)
        await self.db.commit()
        await self.db.refresh(admin_user)
        
        # Send welcome email with credentials
        login_url = f"{settings.BACKEND_CORS_ORIGINS[0] if settings.BACKEND_CORS_ORIGINS else 'http://localhost:3000'}/login"
        email_sent = await email_service.send_welcome_email_organization(
            email=admin_user.email,
            first_name=admin_user.first_name or "Admin",
            organization_name=organization.name,
            temp_password=temp_password,
            login_url=login_url
        )
        
        if not email_sent:
            app_logger.warning(f"⚠️  Failed to send welcome email to {admin_user.email}")
        
        # Create tokens for admin user
        tokens = create_tokens(str(admin_user.id))
        
        return {
            "organization": {
                "id": organization.id,
                "name": organization.name,
                "description": organization.description,
                "website": organization.website,
                "contact_email": organization.contact_email
            },
            "admin_user": {
                "id": admin_user.id,
                "email": admin_user.email,
                "first_name": admin_user.first_name,
                "last_name": admin_user.last_name,
                "role": admin_user.role,
                "organization_id": admin_user.organization_id
            },
            "tokens": tokens,
            "temp_password": temp_password,  # Return temp password (for testing, remove in production)
            "email_sent": email_sent
        }
    
    def _generate_temp_password(self, length: int = 12) -> str:
        """Generate a secure temporary password"""
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        password = ''.join(secrets.choice(alphabet) for i in range(length))
        return password
