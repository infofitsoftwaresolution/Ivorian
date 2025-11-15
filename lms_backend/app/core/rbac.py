"""
Role-Based Access Control (RBAC) module for the LMS application
"""
from functools import wraps
from typing import List, Optional
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.rbac import RBACService


def require_permission(permission: str):
    """
    Decorator to require a specific permission
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get current user and database session
            current_user = kwargs.get('current_user')
            db = kwargs.get('db')
            
            if not current_user or not db:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            # Check if user has the required permission
            has_perm = await RBACService.has_permission(db, current_user.id, permission)
            if not has_perm:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Permission '{permission}' required"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


def require_role(role_name: str):
    """
    Decorator to require a specific role
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get current user and database session
            current_user = kwargs.get('current_user')
            db = kwargs.get('db')
            
            if not current_user or not db:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            # Check if user has the required role
            has_role = await RBACService.has_role(db, current_user.id, role_name)
            if not has_role:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Role '{role_name}' required"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


def require_super_admin():
    """
    Decorator to require super admin role
    """
    return require_role("super_admin")


def require_organization_admin():
    """
    Decorator to require organization admin role
    """
    return require_role("organization_admin")


def require_tutor():
    """
    Decorator to require tutor role
    """
    return require_role("tutor")


def require_student():
    """
    Decorator to require student role
    """
    return require_role("student")


async def check_permission(
    db: Session,
    user_id: int,
    permission: str
) -> bool:
    """
    Check if a user has a specific permission
    """
    return await RBACService.has_permission(db, user_id, permission)


async def check_role(
    db: Session,
    user_id: int,
    role_name: str
) -> bool:
    """
    Check if a user has a specific role
    """
    return await RBACService.has_role(db, user_id, role_name)


async def get_user_permissions(
    db: Session,
    user_id: int
) -> List[str]:
    """
    Get all permissions for a user
    """
    return await RBACService.get_user_permissions(db, user_id)


async def get_user_roles(
    db: Session,
    user_id: int
) -> List[str]:
    """
    Get all roles for a user
    """
    return await RBACService.get_user_roles(db, user_id)
