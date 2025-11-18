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
from typing import Optional
from fastapi import Query

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


@router.get("/tutor")
async def get_tutor_analytics(
    period: Optional[str] = Query("30d", description="Time period: 7d, 30d, 90d, all"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get tutor analytics data
    Returns course performance, student progress, revenue, etc. for the current tutor
    """
    try:
        # Check if user is tutor or instructor
        if current_user.role not in ["tutor", "instructor"]:
            raise HTTPException(status_code=403, detail="Only tutors and instructors can access tutor analytics")
        
        # Calculate date range based on period
        now = datetime.now()
        if period == "7d":
            start_date = now - timedelta(days=7)
        elif period == "30d":
            start_date = now - timedelta(days=30)
        elif period == "90d":
            start_date = now - timedelta(days=90)
        else:  # all
            start_date = None
        
        # Get all courses created by this tutor from their organization
        courses_query = select(Course).where(
            and_(
                Course.created_by == current_user.id,
                Course.organization_id == current_user.organization_id
            )
        )
        if start_date:
            courses_query = courses_query.where(Course.created_at >= start_date)
        
        courses_result = await db.execute(courses_query)
        courses = courses_result.scalars().all()
        course_ids = [course.id for course in courses]
        
        # Calculate overview stats
        total_courses = len(courses)
        
        # Get enrollments for tutor's courses
        enrollments_query = select(Enrollment).where(Enrollment.course_id.in_(course_ids))
        if start_date:
            enrollments_query = enrollments_query.where(Enrollment.enrollment_date >= start_date)
        
        enrollments_result = await db.execute(enrollments_query)
        enrollments = enrollments_result.scalars().all()
        
        total_enrollments = len(enrollments)
        
        # Get unique students
        unique_student_ids = set([e.student_id for e in enrollments])
        total_students = len(unique_student_ids)
        
        # Get active students (enrolled in last 30 days)
        active_date = now - timedelta(days=30)
        active_enrollments = [e for e in enrollments if e.enrollment_date >= active_date]
        active_student_ids = set([e.student_id for e in active_enrollments])
        active_students = len(active_student_ids)
        
        # Calculate revenue
        total_revenue = sum([float(e.payment_amount or 0) for e in enrollments if e.payment_status == "paid"])
        
        # Calculate average completion rate
        completed_enrollments = [e for e in enrollments if e.completion_date is not None]
        average_completion_rate = (len(completed_enrollments) / total_enrollments * 100) if total_enrollments > 0 else 0
        
        # Calculate growth (compare with previous period)
        if start_date:
            previous_start = start_date - (now - start_date)
            previous_courses_query = select(Course).where(
                and_(
                    Course.created_by == current_user.id,
                    Course.organization_id == current_user.organization_id,
                    Course.created_at >= previous_start,
                    Course.created_at < start_date
                )
            )
            previous_courses_result = await db.execute(previous_courses_query)
            previous_courses = previous_courses_result.scalars().all()
            previous_course_ids = [c.id for c in previous_courses]
            
            previous_enrollments_query = select(Enrollment).where(
                and_(
                    Enrollment.course_id.in_(previous_course_ids),
                    Enrollment.enrollment_date >= previous_start,
                    Enrollment.enrollment_date < start_date
                )
            )
            previous_enrollments_result = await db.execute(previous_enrollments_query)
            previous_enrollments = previous_enrollments_result.scalars().all()
            
            previous_courses_count = len(previous_courses)
            previous_enrollments_count = len(previous_enrollments)
            
            course_growth = ((total_courses - previous_courses_count) / previous_courses_count * 100) if previous_courses_count > 0 else 0
            enrollment_growth = ((total_enrollments - previous_enrollments_count) / previous_enrollments_count * 100) if previous_enrollments_count > 0 else 0
        else:
            course_growth = 0
            enrollment_growth = 0
        
        # Generate enrollment trend data (last 7 days or period)
        enrollment_trend_labels = []
        enrollment_trend_data = []
        
        if period == "7d" or period == "30d":
            days = 7 if period == "7d" else 30
            for i in range(days - 1, -1, -1):
                date = now - timedelta(days=i)
                date_str = date.strftime("%m/%d")
                enrollment_trend_labels.append(date_str)
                
                day_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
                day_end = day_start + timedelta(days=1)
                day_enrollments = [e for e in enrollments if day_start <= e.enrollment_date < day_end]
                enrollment_trend_data.append(len(day_enrollments))
        else:
            # For 90d or all, group by weeks
            weeks = 12 if period == "90d" else min(12, (now - (start_date or datetime(2020, 1, 1))).days // 7)
            for i in range(weeks - 1, -1, -1):
                week_start = now - timedelta(weeks=i+1)
                week_end = now - timedelta(weeks=i)
                week_str = week_start.strftime("%m/%d")
                enrollment_trend_labels.append(week_str)
                
                week_enrollments = [e for e in enrollments if week_start <= e.enrollment_date < week_end]
                enrollment_trend_data.append(len(week_enrollments))
        
        # Course performance data
        course_performance_labels = []
        course_performance_data = []
        for course in courses[:10]:  # Top 10 courses
            course_enrollments = [e for e in enrollments if e.course_id == course.id]
            if course_enrollments:
                completed = len([e for e in course_enrollments if e.completion_date is not None])
                completion_rate = (completed / len(course_enrollments) * 100) if course_enrollments else 0
                course_performance_labels.append(course.title[:20] + "..." if len(course.title) > 20 else course.title)
                course_performance_data.append(round(completion_rate, 1))
        
        # Revenue trend (same as enrollment trend for now)
        revenue_trend_labels = enrollment_trend_labels.copy()
        revenue_trend_data = []
        
        if period == "7d" or period == "30d":
            days = 7 if period == "7d" else 30
            for i in range(days - 1, -1, -1):
                date = now - timedelta(days=i)
                day_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
                day_end = day_start + timedelta(days=1)
                day_enrollments = [e for e in enrollments if day_start <= e.enrollment_date < day_end and e.payment_status == "paid"]
                revenue_trend_data.append(sum([float(e.payment_amount or 0) for e in day_enrollments]))
        else:
            weeks = 12 if period == "90d" else min(12, (now - (start_date or datetime(2020, 1, 1))).days // 7)
            for i in range(weeks - 1, -1, -1):
                week_start = now - timedelta(weeks=i+1)
                week_end = now - timedelta(weeks=i)
                week_enrollments = [e for e in enrollments if week_start <= e.enrollment_date < week_end and e.payment_status == "paid"]
                revenue_trend_data.append(sum([float(e.payment_amount or 0) for e in week_enrollments]))
        
        # Student distribution (by completion status)
        completed_count = len([e for e in enrollments if e.completion_date is not None])
        in_progress_count = len([e for e in enrollments if e.completion_date is None and e.progress_percentage > 0])
        not_started_count = len([e for e in enrollments if e.completion_date is None and e.progress_percentage == 0])
        
        student_distribution_labels = ["Completed", "In Progress", "Not Started"]
        student_distribution_data = [completed_count, in_progress_count, not_started_count]
        
        # Top courses
        top_courses = []
        for course in courses:
            course_enrollments = [e for e in enrollments if e.course_id == course.id]
            if course_enrollments:
                completed = len([e for e in course_enrollments if e.completion_date is not None])
                completion_rate = (completed / len(course_enrollments) * 100) if course_enrollments else 0
                course_revenue = sum([float(e.payment_amount or 0) for e in course_enrollments if e.payment_status == "paid"])
                top_courses.append({
                    "id": course.id,
                    "title": course.title,
                    "enrollments": len(course_enrollments),
                    "completion_rate": round(completion_rate, 1),
                    "revenue": round(course_revenue, 2)
                })
        
        # Sort by enrollments and take top 5
        top_courses.sort(key=lambda x: x["enrollments"], reverse=True)
        top_courses = top_courses[:5]
        
        # Top students (by completion rate)
        top_students = []
        for student_id in unique_student_ids:
            student_enrollments = [e for e in enrollments if e.student_id == student_id]
            if student_enrollments:
                completed = len([e for e in student_enrollments if e.completion_date is not None])
                completion_rate = (completed / len(student_enrollments) * 100) if student_enrollments else 0
                total_progress = sum([e.progress_percentage or 0 for e in student_enrollments]) / len(student_enrollments) if student_enrollments else 0
                
                # Get student name
                student_result = await db.execute(select(User).where(User.id == student_id))
                student = student_result.scalar_one_or_none()
                student_name = f"{student.first_name} {student.last_name}".strip() if student else f"Student {student_id}"
                
                top_students.append({
                    "id": student_id,
                    "name": student_name,
                    "courses_enrolled": len(student_enrollments),
                    "completion_rate": round(completion_rate, 1),
                    "total_progress": round(total_progress, 1)
                })
        
        # Sort by completion rate and take top 5
        top_students.sort(key=lambda x: x["completion_rate"], reverse=True)
        top_students = top_students[:5]
        
        return {
            "overview": {
                "total_courses": total_courses,
                "total_students": total_students,
                "total_enrollments": total_enrollments,
                "total_revenue": round(total_revenue, 2),
                "average_completion_rate": round(average_completion_rate, 1),
                "active_students": active_students,
                "course_growth": round(course_growth, 1),
                "enrollment_growth": round(enrollment_growth, 1)
            },
            "enrollment_trend": {
                "labels": enrollment_trend_labels,
                "data": enrollment_trend_data
            },
            "course_performance": {
                "labels": course_performance_labels,
                "data": course_performance_data
            },
            "revenue_trend": {
                "labels": revenue_trend_labels,
                "data": revenue_trend_data
            },
            "student_distribution": {
                "labels": student_distribution_labels,
                "data": student_distribution_data
            },
            "top_courses": top_courses,
            "top_students": top_students
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error retrieving tutor analytics: {str(e)}")
