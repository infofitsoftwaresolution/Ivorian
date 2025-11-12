"""
Analytics API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.organization import Organization
from app.models.course import Course, Enrollment

router = APIRouter()


@router.get("/platform/stats")
async def get_platform_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get platform-wide statistics (Super Admin only)
    Returns total organizations, users, courses, revenue, etc.
    """
    try:
        # Check if user is super admin
        if current_user.role != "super_admin":
            raise HTTPException(status_code=403, detail="Only super admins can access platform stats")
        
        # Get total organizations
        orgs_result = await db.execute(select(func.count(Organization.id)))
        total_organizations = orgs_result.scalar() or 0
        
        # Get active organizations
        active_orgs_result = await db.execute(
            select(func.count(Organization.id)).where(Organization.is_active == True)
        )
        active_organizations = active_orgs_result.scalar() or 0
        
        # Get new organizations this month
        this_month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        new_orgs_result = await db.execute(
            select(func.count(Organization.id))
            .where(Organization.created_at >= this_month_start)
        )
        new_organizations_this_month = new_orgs_result.scalar() or 0
        
        # Get total users
        users_result = await db.execute(select(func.count(User.id)))
        total_users = users_result.scalar() or 0
        
        # Get total courses
        courses_result = await db.execute(select(func.count(Course.id)))
        total_courses = courses_result.scalar() or 0
        
        # Get total revenue from enrollments
        revenue_result = await db.execute(
            select(func.coalesce(func.sum(Enrollment.payment_amount), 0))
            .where(and_(
                Enrollment.payment_status == "paid",
                Enrollment.payment_amount.isnot(None)
            ))
        )
        total_revenue = float(revenue_result.scalar() or 0)
        
        return {
            "total_organizations": total_organizations,
            "active_organizations": active_organizations,
            "new_organizations_this_month": new_organizations_this_month,
            "total_users": total_users,
            "total_courses": total_courses,
            "total_revenue": total_revenue
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving platform stats: {str(e)}")
