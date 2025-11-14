"""
User Management Service
Business logic for user-related operations
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta
import logging

from app.models.user import User
from app.models.organization import Organization
from app.models.rbac import Role
from app.schemas.user import UserCreate, UserUpdate, UserAdminUpdate, UserFilter, UserStats
from app.core.security import get_password_hash, verify_password
from app.core.config import settings
from app.services.rbac import RBACService
from app.services.email_service import email_service
from app.core.errors import ResourceNotFoundError, ValidationError, AuthorizationError
from app.core.logging import app_logger
import secrets
import string

logger = logging.getLogger(__name__)

class UserService:
    """Service class for user management operations"""
    
    @staticmethod
    async def create_user(db: AsyncSession, user_data: UserCreate, created_by: Optional[User] = None) -> User:
        """Create a new user with roles"""
        try:
            # Check if user with email already exists
            existing_user = await UserService.get_user_by_email(db, user_data.email)
            if existing_user:
                raise ValidationError("User with this email already exists")
            
            # Validate organization exists if organization_id is provided
            if user_data.organization_id:
                org_query = select(Organization).where(Organization.id == user_data.organization_id)
                org_result = await db.execute(org_query)
                organization = org_result.scalar_one_or_none()
                if not organization:
                    raise ValidationError(f"Organization with ID {user_data.organization_id} does not exist")
            
            # Handle password: use provided password if available, otherwise generate temp password
            temp_password = None
            password_provided = hasattr(user_data, 'password') and user_data.password and user_data.password.strip()
            
            if password_provided:
                # Password provided - use it (validation already done by Pydantic schema)
                hashed_password = get_password_hash(user_data.password)
                password_change_required = False
            else:
                # No password provided - generate temp password (for admin-created users)
                temp_password = UserService._generate_temp_password()
                hashed_password = get_password_hash(temp_password)
                password_change_required = True
            
            # Create user
            user = User(
                first_name=user_data.first_name,
                last_name=user_data.last_name,
                email=user_data.email,
                hashed_password=hashed_password,
                phone=user_data.phone,
                bio=user_data.bio,
                avatar_url=user_data.avatar_url,
                date_of_birth=user_data.date_of_birth,
                timezone=user_data.timezone or "UTC",
                language=user_data.language or "en",
                organization_id=user_data.organization_id,
                status="active" if not user_data.organization_id else "pending",
                is_active=True,
                is_verified=False,
                password_change_required=password_change_required
            )
            
            db.add(user)
            await db.commit()
            await db.refresh(user)
            
            # Send welcome email only if temp password was generated (admin-created user)
            if password_change_required and temp_password and user_data.organization_id:
                # Get organization name (Organization is already imported at top of file)
                org_result = await db.execute(select(Organization).where(Organization.id == user_data.organization_id))
                organization = org_result.scalar_one_or_none()
                organization_name = organization.name if organization else "the organization"
                
                # Determine email type based on role
                login_url = f"{settings.BACKEND_CORS_ORIGINS[0] if settings.BACKEND_CORS_ORIGINS else 'http://localhost:3000'}/login"
                
                app_logger.info(f"📧 Attempting to send welcome email to {user.email} for {user.role} account")
                
                try:
                    if user.role == "student":
                        email_sent = await email_service.send_welcome_email_student(
                            email=user.email,
                            first_name=user.first_name or "Student",
                            organization_name=organization_name,
                            temp_password=temp_password,
                            login_url=login_url
                        )
                    elif user.role == "tutor":
                        email_sent = await email_service.send_welcome_email_tutor(
                            email=user.email,
                            first_name=user.first_name or "Tutor",
                            organization_name=organization_name,
                            temp_password=temp_password,
                            login_url=login_url
                        )
                    else:
                        email_sent = False
                    
                    if email_sent:
                        app_logger.info(f"✅ Welcome email sent successfully to {user.email}")
                    else:
                        app_logger.error(f"❌ Failed to send welcome email to {user.email}")
                        app_logger.error(f"   ⚠️  If AWS SES is in sandbox mode, recipient email must be verified")
                        app_logger.error(f"   Verify email: https://console.aws.amazon.com/ses/home?region={settings.AWS_REGION}#/verified-identities")
                except Exception as e:
                    app_logger.error(f"❌ Exception while sending welcome email to {user.email}: {str(e)}")
                    import traceback
                    app_logger.error(f"   Traceback: {traceback.format_exc()}")
            elif not password_change_required and user_data.organization_id:
                app_logger.info(f"ℹ️  User {user.email} ({user.role}) created with custom password - no welcome email sent")
            
            # Assign roles
            if user_data.roles:
                await UserService.assign_roles_to_user(db, user.id, user_data.roles)
            
            logger.info(f"User created: {user.email} (ID: {user.id})")
            return user
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Error creating user: {str(e)}")
            raise
    
    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: int) -> Optional[User]:
        """Get user by ID with roles loaded"""
        result = await db.execute(
            select(User)
            .options(selectinload(User.roles))
            .where(User.id == user_id)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
        """Get user by email with roles loaded"""
        result = await db.execute(
            select(User)
            .options(selectinload(User.roles))
            .where(User.email == email)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_users(
        db: AsyncSession, 
        skip: int = 0, 
        limit: int = 100,
        filters: Optional[UserFilter] = None,
        current_user: Optional[User] = None
    ) -> tuple[List[User], int]:
        """Get paginated list of users with filtering"""
        try:
            # Build query (removed selectinload for roles as we use role field directly)
            query = select(User)
            count_query = select(func.count(User.id))
            
            # Apply filters
            if filters:
                conditions = []
                
                if filters.search:
                    search_term = f"%{filters.search}%"
                    conditions.append(
                        or_(
                            User.first_name.ilike(search_term),
                            User.last_name.ilike(search_term),
                            User.email.ilike(search_term)
                        )
                    )
                
                if filters.status:
                    conditions.append(User.status == filters.status)
                
                if filters.is_active is not None:
                    conditions.append(User.is_active == filters.is_active)
                
                if filters.is_verified is not None:
                    conditions.append(User.is_verified == filters.is_verified)
                
                if filters.organization_id:
                    conditions.append(User.organization_id == filters.organization_id)
                
                if filters.created_after:
                    conditions.append(User.created_at >= filters.created_after)
                
                if filters.created_before:
                    conditions.append(User.created_at <= filters.created_before)
                
                if filters.role:
                    conditions.append(User.role == filters.role)
                
                if conditions:
                    query = query.where(and_(*conditions))
                    count_query = count_query.where(and_(*conditions))
            
            # Get total count
            total_result = await db.execute(count_query)
            total = total_result.scalar()
            
            # Get paginated results
            query = query.offset(skip).limit(limit).order_by(User.created_at.desc())
            result = await db.execute(query)
            users = result.scalars().all()
            
            return users, total
            
        except Exception as e:
            import traceback
            error_traceback = traceback.format_exc()
            logger.error(f"Error getting users: {str(e)}\n{error_traceback}")
            app_logger.error(f"Error getting users: {str(e)}\n{error_traceback}")
            raise
    
    @staticmethod
    async def update_user(
        db: AsyncSession, 
        user_id: int, 
        user_data: UserUpdate,
        current_user: Optional[User] = None
    ) -> User:
        """Update user information"""
        try:
            user = await UserService.get_user_by_id(db, user_id)
            if not user:
                raise ResourceNotFoundError("User not found")
            
            # Check permissions
            if current_user and current_user.id != user_id:
                # Admin can update any user, regular users can only update themselves
                has_permission = await RBACService.has_permission(
                    db, current_user.id, "user", "manage"
                )
                if not has_permission:
                    raise AuthorizationError("Insufficient permissions to update this user")
            
            # Update fields
            update_data = user_data.model_dump(exclude_unset=True)
            
            # Check if email is being changed and if it's already taken
            if "email" in update_data and update_data["email"] != user.email:
                existing_user = await UserService.get_user_by_email(db, update_data["email"])
                if existing_user:
                    raise ValidationError("Email already in use")
            
            for field, value in update_data.items():
                setattr(user, field, value)
            
            user.updated_at = datetime.utcnow()
            
            await db.commit()
            await db.refresh(user)
            
            logger.info(f"User updated: {user.email} (ID: {user.id})")
            return user
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Error updating user: {str(e)}")
            raise
    
    @staticmethod
    async def admin_update_user(
        db: AsyncSession, 
        user_id: int, 
        user_data: UserAdminUpdate,
        current_user: User
    ) -> User:
        """Admin update user with role management"""
        try:
            # Check admin permissions
            has_permission = await RBACService.has_permission(
                db, current_user.id, "user", "manage"
            )
            if not has_permission:
                raise AuthorizationError("Insufficient permissions to update user")
            
            user = await UserService.get_user_by_id(db, user_id)
            if not user:
                raise ResourceNotFoundError("User not found")
            
            # Update basic fields
            update_data = user_data.model_dump(exclude_unset=True, exclude={"roles"})
            
            if "email" in update_data and update_data["email"] != user.email:
                existing_user = await UserService.get_user_by_email(db, update_data["email"])
                if existing_user:
                    raise ValidationError("Email already in use")
            
            for field, value in update_data.items():
                setattr(user, field, value)
            
            # Update roles if specified
            if user_data.roles is not None:
                await UserService.assign_roles_to_user(db, user.id, user_data.roles)
            
            user.updated_at = datetime.utcnow()
            
            await db.commit()
            await db.refresh(user)
            
            logger.info(f"User admin updated: {user.email} (ID: {user.id}) by {current_user.email}")
            return user
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Error admin updating user: {str(e)}")
            raise
    
    @staticmethod
    async def delete_user(db: AsyncSession, user_id: int, current_user: User) -> bool:
        """Delete a user (soft delete by setting is_active to False)"""
        try:
            # Check admin permissions
            has_permission = await RBACService.has_permission(
                db, current_user.id, "user", "manage"
            )
            if not has_permission:
                raise AuthorizationError("Insufficient permissions to delete user")
            
            user = await UserService.get_user_by_id(db, user_id)
            if not user:
                raise ResourceNotFoundError("User not found")
            
            # Prevent self-deletion
            if user.id == current_user.id:
                raise ValidationError("Cannot delete your own account")
            
            # Soft delete
            user.is_active = False
            user.status = "inactive"
            user.updated_at = datetime.utcnow()
            
            await db.commit()
            
            logger.info(f"User deleted: {user.email} (ID: {user.id}) by {current_user.email}")
            return True
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Error deleting user: {str(e)}")
            raise
    
    @staticmethod
    async def change_password(
        db: AsyncSession, 
        user_id: int, 
        current_password: str, 
        new_password: str
    ) -> bool:
        """Change user password"""
        try:
            user = await UserService.get_user_by_id(db, user_id)
            if not user:
                raise ResourceNotFoundError("User not found")
            
            # Verify current password
            if not verify_password(current_password, user.hashed_password):
                raise ValidationError("Current password is incorrect")
            
            # Hash new password
            hashed_password = get_password_hash(new_password)
            user.hashed_password = hashed_password
            user.password_change_required = False  # Clear password change requirement
            user.updated_at = datetime.utcnow()
            
            await db.commit()
            
            logger.info(f"Password changed for user: {user.email} (ID: {user.id})")
            return True
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Error changing password: {str(e)}")
            raise
    
    @staticmethod
    async def assign_roles_to_user(db: AsyncSession, user_id: int, role_names: List[str]) -> bool:
        """Assign roles to a user"""
        try:
            user = await UserService.get_user_by_id(db, user_id)
            if not user:
                raise ResourceNotFoundError("User not found")
            
            # Get roles by names
            result = await db.execute(
                select(Role).where(Role.name.in_(role_names))
            )
            roles = result.scalars().all()
            
            if len(roles) != len(role_names):
                found_role_names = [role.name for role in roles]
                missing_roles = [name for name in role_names if name not in found_role_names]
                raise ValidationError(f"Roles not found: {missing_roles}")
            
            # Clear existing roles and assign new ones
            user.roles.clear()
            user.roles.extend(roles)
            
            await db.commit()
            
            logger.info(f"Roles assigned to user {user.email}: {role_names}")
            return True
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Error assigning roles to user: {str(e)}")
            raise
    
    @staticmethod
    def _generate_temp_password(length: int = 12) -> str:
        """Generate a secure temporary password"""
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        password = ''.join(secrets.choice(alphabet) for i in range(length))
        return password
    
    @staticmethod
    async def get_user_stats(db: AsyncSession, current_user: User) -> UserStats:
        """Get user statistics"""
        try:
            # Check permissions
            has_permission = await RBACService.has_permission(
                db, current_user.id, "analytics", "read"
            )
            if not has_permission:
                raise AuthorizationError("Insufficient permissions to view user statistics")
            
            # Get basic counts
            total_users = await db.scalar(select(func.count(User.id)))
            active_users = await db.scalar(select(func.count(User.id)).where(User.is_active == True))
            inactive_users = await db.scalar(select(func.count(User.id)).where(User.is_active == False))
            verified_users = await db.scalar(select(func.count(User.id)).where(User.is_verified == True))
            unverified_users = await db.scalar(select(func.count(User.id)).where(User.is_verified == False))
            
            # Get status counts
            suspended_users = await db.scalar(select(func.count(User.id)).where(User.status == "suspended"))
            pending_users = await db.scalar(select(func.count(User.id)).where(User.status == "pending"))
            
            # Get new users this month and week
            now = datetime.utcnow()
            month_ago = now - timedelta(days=30)
            week_ago = now - timedelta(days=7)
            
            new_users_this_month = await db.scalar(
                select(func.count(User.id)).where(User.created_at >= month_ago)
            )
            new_users_this_week = await db.scalar(
                select(func.count(User.id)).where(User.created_at >= week_ago)
            )
            
            # Get users by role (simplified - would need proper join)
            users_by_role = {
                "super_admin": 0,
                "organization_admin": 0,
                "tutor": 0,
                "student": 0
            }
            
            # Get users by organization
            result = await db.execute(
                select(User.organization_id, func.count(User.id))
                .where(User.organization_id.isnot(None))
                .group_by(User.organization_id)
            )
            org_counts = result.all()
            
            users_by_organization = {}
            for org_id, count in org_counts:
                org = await db.get(Organization, org_id)
                org_name = org.name if org else f"Org {org_id}"
                users_by_organization[org_name] = count
            
            return UserStats(
                total_users=total_users,
                active_users=active_users,
                inactive_users=inactive_users,
                suspended_users=suspended_users,
                pending_users=pending_users,
                verified_users=verified_users,
                unverified_users=unverified_users,
                users_by_role=users_by_role,
                users_by_organization=users_by_organization,
                new_users_this_month=new_users_this_month,
                new_users_this_week=new_users_this_week
            )
            
        except Exception as e:
            logger.error(f"Error getting user stats: {str(e)}")
            raise

    @staticmethod
    async def create_tutor(db: AsyncSession, tutor_data: dict, organization_id: int, current_user: User) -> User:
        """Create a new tutor for an organization"""
        try:
            # Check if current user is organization admin
            if current_user.role != "organization_admin" or current_user.organization_id != organization_id:
                raise AuthorizationError("Only organization admins can create tutors")
            
            # Check if email already exists
            existing_user = await UserService.get_user_by_email(db, tutor_data["email"])
            if existing_user:
                raise ValidationError("User with this email already exists")
            
            # Handle password: use provided password if available, otherwise generate temp password
            temp_password = None
            password_provided = tutor_data.get("password") and tutor_data["password"].strip()
            
            if password_provided:
                # Password provided by organization admin - use it
                # Validation is already done by Pydantic schema
                hashed_password = get_password_hash(tutor_data["password"])
                password_change_required = False
            else:
                # No password provided - generate temp password
                temp_password = UserService._generate_temp_password()
                hashed_password = get_password_hash(temp_password)
                password_change_required = True
            
            # Get organization name for email
            from app.models.organization import Organization
            org_result = await db.execute(select(Organization).where(Organization.id == organization_id))
            organization = org_result.scalar_one_or_none()
            organization_name = organization.name if organization else "the organization"
            
            # Create new tutor user
            tutor = User(
                email=tutor_data["email"],
                hashed_password=hashed_password,
                first_name=tutor_data["first_name"],
                last_name=tutor_data["last_name"],
                phone=tutor_data.get("phone"),
                bio=tutor_data.get("bio"),
                role="tutor",
                organization_id=organization_id,
                is_active=tutor_data.get("is_active", True),
                status="active",
                is_verified=False,
                password_change_required=password_change_required  # Only require change if temp password was generated
            )
            
            db.add(tutor)
            await db.commit()
            await db.refresh(tutor)
            
            # Send welcome email with credentials
            # Determine login URL - use frontend URL from CORS origins or default
            login_url = 'http://localhost:3000/login'
            if settings.BACKEND_CORS_ORIGINS and len(settings.BACKEND_CORS_ORIGINS) > 0:
                # Get the first origin that looks like a frontend URL (contains :3000 or is https)
                for origin in settings.BACKEND_CORS_ORIGINS:
                    if ':3000' in origin or origin.startswith('https://'):
                        login_url = f"{origin}/login"
                        break
                else:
                    # Fallback to first origin
                    login_url = f"{settings.BACKEND_CORS_ORIGINS[0]}/login"
            
            # Send welcome email only if temp password was generated
            if password_change_required and temp_password:
                app_logger.info(f"📧 Attempting to send welcome email to {tutor.email} for tutor account")
                app_logger.info(f"🔗 Login URL: {login_url}")
                
                try:
                    email_sent = await email_service.send_welcome_email_tutor(
                        email=tutor.email,
                        first_name=tutor.first_name or "Tutor",
                        organization_name=organization_name,
                        temp_password=temp_password,
                        login_url=login_url
                    )
                    
                    if email_sent:
                        app_logger.info(f"✅ Welcome email sent successfully to {tutor.email}")
                    else:
                        app_logger.error(f"❌ Failed to send welcome email to {tutor.email}")
                        app_logger.error(f"   ⚠️  If AWS SES is in sandbox mode, recipient email must be verified")
                        app_logger.error(f"   Verify email: https://console.aws.amazon.com/ses/home?region={settings.AWS_REGION}#/verified-identities")
                except Exception as e:
                    app_logger.error(f"❌ Exception while sending welcome email to {tutor.email}: {str(e)}")
                    import traceback
                    app_logger.error(f"   Traceback: {traceback.format_exc()}")
            elif not password_change_required:
                app_logger.info(f"ℹ️  Tutor {tutor.email} created with custom password - no welcome email sent")
            
            logger.info(f"Tutor created: {tutor.email} (ID: {tutor.id}) for organization {organization_id}")
            return tutor
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Error creating tutor: {str(e)}")
            raise

    @staticmethod
    async def get_tutors_by_organization(
        db: AsyncSession, 
        organization_id: int, 
        skip: int = 0, 
        limit: int = 100,
        search: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> tuple[List[User], int]:
        """Get paginated list of tutors for an organization"""
        try:
            # Build query
            query = select(User).options(selectinload(User.roles)).where(
                and_(
                    User.organization_id == organization_id,
                    User.role == "tutor"
                )
            )
            
            # Add search filter
            if search:
                search_term = f"%{search}%"
                query = query.where(
                    or_(
                        User.first_name.ilike(search_term),
                        User.last_name.ilike(search_term),
                        User.email.ilike(search_term)
                    )
                )
            
            # Add active filter
            if is_active is not None:
                query = query.where(User.is_active == is_active)
            
            # Get total count - use a simpler approach
            count_query = select(func.count(User.id)).where(
                and_(
                    User.organization_id == organization_id,
                    User.role == "tutor"
                )
            )
            
            # Add search filter to count
            if search:
                search_term = f"%{search}%"
                count_query = count_query.where(
                    or_(
                        User.first_name.ilike(search_term),
                        User.last_name.ilike(search_term),
                        User.email.ilike(search_term)
                    )
                )
            
            # Add active filter to count
            if is_active is not None:
                count_query = count_query.where(User.is_active == is_active)
            
            total = await db.scalar(count_query)
            
            # Get paginated results
            query = query.offset(skip).limit(limit).order_by(User.created_at.desc())
            result = await db.execute(query)
            tutors = result.scalars().all()
            
            return list(tutors), total
            
        except Exception as e:
            logger.error(f"Error getting tutors by organization: {str(e)}")
            raise
