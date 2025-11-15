"""
Permission checking middleware and decorators
"""
from typing import Optional, Callable
from fastapi import HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.rbac import RBACService


def require_permission(resource: str, action: str):
    """
    Decorator to require specific permission for an endpoint
    """
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Get dependencies from the function signature
            current_user = None
            db = None
            
            # Try to get current_user and db from kwargs
            for arg_name, arg_value in kwargs.items():
                if isinstance(arg_value, User):
                    current_user = arg_value
                elif isinstance(arg_value, AsyncSession):
                    db = arg_value
            
            # If not found in kwargs, try to get from dependencies
            if not current_user or not db:
                # This is a simplified approach - in a real implementation,
                # you'd need to properly inject dependencies
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Permission check failed - dependencies not available"
                )
            
            # Check permission
            has_perm = await RBACService.has_permission(
                db, current_user.id, resource, action
            )
            if not has_perm:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Insufficient permissions. Required: {resource}:{action}"
                )
            
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator


def require_role(role_name: str):
    """
    Decorator to require specific role for an endpoint
    """
    def role_checker(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
    ):
        async def check_role():
            has_role = await RBACService.has_role(
                db, current_user.id, role_name
            )
            if not has_role:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Insufficient permissions. Required role: {role_name}"
                )
            return current_user
        
        return check_role
    
    return role_checker


def require_any_role(*role_names: str):
    """
    Decorator to require any of the specified roles for an endpoint
    """
    def role_checker(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
    ):
        async def check_any_role():
            for role_name in role_names:
                has_role = await RBACService.has_role(
                    db, current_user.id, role_name
                )
                if has_role:
                    return current_user
            
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required one of: {', '.join(role_names)}"
            )
        
        return check_any_role
    
    return role_checker


# Predefined permission checkers for common operations
require_super_admin = require_role("super_admin")
require_organization_admin = require_role("organization_admin")
require_tutor = require_role("tutor")
require_student = require_role("student")

# Common permission combinations
require_course_management = require_permission("course", "manage")
require_user_management = require_permission("user", "manage")
require_organization_management = require_permission("organization", "manage")
require_assessment_management = require_permission("assessment", "manage")
require_analytics_access = require_permission("analytics", "read")


async def get_user_permissions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """
    Get current user's permissions and roles
    """
    permissions = await RBACService.get_user_permissions(db, current_user.id)
    roles = await RBACService.get_user_roles(db, current_user.id)
    
    return {
        "user_id": current_user.id,
        "permissions": [
            {
                "name": p.name,
                "resource": p.resource,
                "action": p.action
            } for p in permissions
        ],
        "roles": [
            {
                "name": r.name,
                "description": r.description
            } for r in roles
        ]
    }
