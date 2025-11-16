"""
Analytics API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, case
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.organization import Organization
from app.models.course import Course, Enrollment, CourseInstructor

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
    period: Optional[str] = Query("30d", description="Time period: 7d, 30d, 90d, or all"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get analytics for a tutor/instructor
    Returns course performance, student progress, enrollments, revenue, etc.
    """
    try:
        # Check if user is tutor or instructor
        if current_user.role not in ["tutor", "instructor", "organization_admin"]:
            raise HTTPException(status_code=403, detail="Only tutors and instructors can access tutor analytics")
        
        # Calculate date range based on period
        now = datetime.utcnow()
        if period == "7d":
            start_date = now - timedelta(days=7)
        elif period == "30d":
            start_date = now - timedelta(days=30)
        elif period == "90d":
            start_date = now - timedelta(days=90)
        else:  # all
            start_date = datetime(2000, 1, 1)  # Very old date to get all data
        
        # Get courses created by or assigned to this tutor
        courses_query = select(Course).where(
            and_(
                or_(
                    Course.created_by == current_user.id,
                    Course.organization_id == current_user.organization_id
                ),
                Course.created_at >= start_date if period != "all" else True
            )
        )
        courses_result = await db.execute(courses_query)
        courses = courses_result.scalars().all()
        course_ids = [course.id for course in courses]
        
        if not course_ids:
            # Return empty analytics if no courses
            return {
                "overview": {
                    "total_courses": 0,
                    "total_students": 0,
                    "total_enrollments": 0,
                    "total_revenue": 0.0,
                    "average_completion_rate": 0.0,
                    "active_students": 0,
                    "course_growth": 0.0,
                    "enrollment_growth": 0.0
                },
                "enrollment_trend": {"labels": [], "data": []},
                "course_performance": {"labels": [], "data": []},
                "revenue_trend": {"labels": [], "data": []},
                "student_distribution": {"labels": [], "data": []},
                "top_courses": [],
                "top_students": []
            }
        
        # Get enrollments for these courses
        enrollments_query = select(Enrollment).where(Enrollment.course_id.in_(course_ids))
        enrollments_result = await db.execute(enrollments_query)
        enrollments = enrollments_result.scalars().all()
        
        # Calculate overview stats
        total_courses = len(courses)
        total_enrollments = len(enrollments)
        
        # Get unique students
        student_ids = list(set([e.student_id for e in enrollments]))
        total_students = len(student_ids)
        
        # Calculate revenue
        total_revenue = sum([e.payment_amount or 0 for e in enrollments if e.payment_status == "paid"])
        
        # Calculate average completion rate
        completion_rates = [e.progress_percentage for e in enrollments if e.progress_percentage is not None]
        average_completion_rate = sum(completion_rates) / len(completion_rates) if completion_rates else 0.0
        
        # Active students (enrolled in last 30 days)
        active_students_query = select(func.count(func.distinct(Enrollment.student_id))).where(
            and_(
                Enrollment.course_id.in_(course_ids),
                Enrollment.enrollment_date >= (now - timedelta(days=30))
            )
        )
        active_students_result = await db.execute(active_students_query)
        active_students = active_students_result.scalar() or 0
        
        # Calculate growth (compare with previous period)
        prev_start_date = start_date - (now - start_date)
        prev_courses_query = select(func.count(Course.id)).where(
            and_(
                or_(
                    Course.created_by == current_user.id,
                    Course.organization_id == current_user.organization_id
                ),
                Course.created_at >= prev_start_date,
                Course.created_at < start_date
            )
        )
        prev_courses_result = await db.execute(prev_courses_query)
        prev_courses = prev_courses_result.scalar() or 0
        course_growth = ((total_courses - prev_courses) / prev_courses * 100) if prev_courses > 0 else 0.0
        
        prev_enrollments_query = select(func.count(Enrollment.id)).where(
            and_(
                Enrollment.course_id.in_(course_ids),
                Enrollment.enrollment_date >= prev_start_date,
                Enrollment.enrollment_date < start_date
            )
        )
        prev_enrollments_result = await db.execute(prev_enrollments_query)
        prev_enrollments = prev_enrollments_result.scalar() or 0
        enrollment_growth = ((total_enrollments - prev_enrollments) / prev_enrollments * 100) if prev_enrollments > 0 else 0.0
        
        # Enrollment trend (last 7 days or period days)
        trend_days = 7 if period == "7d" else (30 if period == "30d" else 90)
        enrollment_trend_labels = []
        enrollment_trend_data = []
        for i in range(trend_days):
            date = now - timedelta(days=trend_days - 1 - i)
            date_str = date.strftime("%m/%d")
            enrollment_trend_labels.append(date_str)
            
            day_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            
            day_enrollments_query = select(func.count(Enrollment.id)).where(
                and_(
                    Enrollment.course_id.in_(course_ids),
                    Enrollment.enrollment_date >= day_start,
                    Enrollment.enrollment_date < day_end
                )
            )
            day_enrollments_result = await db.execute(day_enrollments_query)
            day_enrollments = day_enrollments_result.scalar() or 0
            enrollment_trend_data.append(day_enrollments)
        
        # Course performance (top 5 courses by enrollments)
        course_performance_labels = []
        course_performance_data = []
        course_enrollment_counts = {}
        course_completion_rates = {}
        
        for enrollment in enrollments:
            course_id = enrollment.course_id
            if course_id not in course_enrollment_counts:
                course_enrollment_counts[course_id] = 0
                course_completion_rates[course_id] = []
            course_enrollment_counts[course_id] += 1
            if enrollment.progress_percentage is not None:
                course_completion_rates[course_id].append(enrollment.progress_percentage)
        
        # Sort courses by enrollments and get top 5
        sorted_courses = sorted(course_enrollment_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        for course_id, count in sorted_courses:
            course = next((c for c in courses if c.id == course_id), None)
            if course:
                course_performance_labels.append(course.title[:30])  # Truncate long titles
                avg_completion = sum(course_completion_rates[course_id]) / len(course_completion_rates[course_id]) if course_completion_rates[course_id] else 0
                course_performance_data.append(round(avg_completion, 1))
        
        # Revenue trend (same as enrollment trend)
        revenue_trend_labels = enrollment_trend_labels.copy()
        revenue_trend_data = []
        for i in range(trend_days):
            date = now - timedelta(days=trend_days - 1 - i)
            day_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            
            day_revenue_query = select(func.coalesce(func.sum(Enrollment.payment_amount), 0)).where(
                and_(
                    Enrollment.course_id.in_(course_ids),
                    Enrollment.enrollment_date >= day_start,
                    Enrollment.enrollment_date < day_end,
                    Enrollment.payment_status == "paid"
                )
            )
            day_revenue_result = await db.execute(day_revenue_query)
            day_revenue = float(day_revenue_result.scalar() or 0)
            revenue_trend_data.append(day_revenue)
        
        # Student distribution (by status: active, completed, dropped)
        active_count = len([e for e in enrollments if e.status == "active"])
        completed_count = len([e for e in enrollments if e.status == "completed"])
        dropped_count = len([e for e in enrollments if e.status == "dropped"])
        
        student_distribution_labels = ["Active", "Completed", "Dropped"]
        student_distribution_data = [active_count, completed_count, dropped_count]
        
        # Top courses
        top_courses = []
        for course_id, count in sorted_courses[:5]:
            course = next((c for c in courses if c.id == course_id), None)
            if course:
                course_revenue = sum([e.payment_amount or 0 for e in enrollments if e.course_id == course_id and e.payment_status == "paid"])
                avg_completion = sum(course_completion_rates[course_id]) / len(course_completion_rates[course_id]) if course_completion_rates[course_id] else 0
                top_courses.append({
                    "id": course.id,
                    "title": course.title,
                    "enrollments": count,
                    "completion_rate": round(avg_completion, 1),
                    "revenue": round(course_revenue, 2)
                })
        
        # Top students (by number of courses enrolled and completion rate)
        student_course_counts = {}
        student_completion_rates = {}
        student_progress = {}
        
        for enrollment in enrollments:
            student_id = enrollment.student_id
            if student_id not in student_course_counts:
                student_course_counts[student_id] = 0
                student_completion_rates[student_id] = []
                student_progress[student_id] = []
            student_course_counts[student_id] += 1
            if enrollment.progress_percentage is not None:
                student_completion_rates[student_id].append(enrollment.progress_percentage)
                student_progress[student_id].append(enrollment.progress_percentage)
        
        # Get student names
        students_query = select(User).where(User.id.in_(list(student_course_counts.keys())))
        students_result = await db.execute(students_query)
        students = {s.id: s for s in students_result.scalars().all()}
        
        # Sort students by course count and completion rate
        student_scores = []
        for student_id, course_count in student_course_counts.items():
            student = students.get(student_id)
            if student:
                avg_completion = sum(student_completion_rates[student_id]) / len(student_completion_rates[student_id]) if student_completion_rates[student_id] else 0
                avg_progress = sum(student_progress[student_id]) / len(student_progress[student_id]) if student_progress[student_id] else 0
                student_scores.append({
                    "id": student_id,
                    "name": f"{student.first_name or ''} {student.last_name or ''}".strip() or student.email,
                    "courses_enrolled": course_count,
                    "completion_rate": round(avg_completion, 1),
                    "total_progress": round(avg_progress, 1)
                })
        
        top_students = sorted(student_scores, key=lambda x: (x["courses_enrolled"], x["completion_rate"]), reverse=True)[:5]
        
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
