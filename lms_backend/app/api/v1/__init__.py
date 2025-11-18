"""
API v1 package for the LMS application
"""
from fastapi import APIRouter

from .auth import router as auth_router
from .users import router as users_router
from .rbac import router as rbac_router
from .courses import router as courses_router
from .assessments import router as assessments_router
from .analytics import router as analytics_router
from .ai import router as ai_router
from .contact import router as contact_router

# Create main API v1 router
api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users_router, prefix="/users", tags=["Users"])
api_router.include_router(rbac_router, prefix="/rbac", tags=["RBAC"])
api_router.include_router(courses_router, prefix="/courses", tags=["Courses"])
api_router.include_router(assessments_router, prefix="/assessments", tags=["Assessments"])
api_router.include_router(analytics_router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(ai_router, prefix="/ai", tags=["AI Services"])
api_router.include_router(contact_router, prefix="", tags=["Contact"]) 