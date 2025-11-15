"""
Shared API dependencies
"""
from typing import Optional
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_active_user
from app.models.user import User


async def get_current_user_optional(
    current_user: Optional[User] = Depends(get_current_user)
) -> Optional[User]:
    """
    Get current user if authenticated, otherwise return None
    """
    return current_user


async def get_db_session(
    db: AsyncSession = Depends(get_db)
) -> AsyncSession:
    """
    Get database session
    """
    return db 