"""
Organization API endpoints for the LMS application
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.logging import app_logger
from app.models.user import User
from app.models.organization import Organization
from app.models.course import Course
from app.schemas.organization import (
    OrganizationCreate,
    OrganizationUpdate,
    OrganizationResponse,
    OrganizationListResponse
)

router = APIRouter()


@router.get("/", response_model=OrganizationListResponse, summary="Get all organizations")
async def get_organizations(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
    search: Optional[str] = Query(None, description="Search term for organization name/description"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    industry: Optional[str] = Query(None, description="Filter by industry"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all organizations with filtering and pagination.
    Only accessible by super_admin.
    """
    if current_user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super administrators can access organizations."
        )
    
    try:
        # Build query
        query = select(Organization)
        count_query = select(func.count(Organization.id))
        
        # Apply filters
        conditions = []
        if search:
            conditions.append(
                or_(
                    Organization.name.ilike(f"%{search}%"),
                    Organization.description.ilike(f"%{search}%"),
                    Organization.contact_email.ilike(f"%{search}%")
                )
            )
        if is_active is not None:
            conditions.append(Organization.is_active == is_active)
        if industry:
            conditions.append(Organization.industry == industry)
        
        if conditions:
            for condition in conditions:
                query = query.where(condition)
                count_query = count_query.where(condition)
        
        # Get total count
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0
        
        # Apply pagination
        query = query.order_by(Organization.created_at.desc()).offset(skip).limit(limit)
        
        # Execute query
        result = await db.execute(query)
        organizations = result.scalars().all()
        
        # Get user and course counts for each organization
        organization_responses = []
        for org in organizations:
            # Count users
            user_count_result = await db.execute(
                select(func.count(User.id)).where(User.organization_id == org.id)
            )
            user_count = user_count_result.scalar() or 0
            
            # Count courses
            course_count_result = await db.execute(
                select(func.count(Course.id)).where(Course.organization_id == org.id)
            )
            course_count = course_count_result.scalar() or 0
            
            org_dict = {
                "id": org.id,
                "name": org.name,
                "description": org.description,
                "website": org.website,
                "contact_email": org.contact_email,
                "contact_phone": org.contact_phone,
                "address": org.address,
                "industry": org.industry,
                "size": org.size,
                "domain": org.domain,
                "logo_url": org.logo_url,
                "is_active": org.is_active,
                "created_at": org.created_at,
                "updated_at": org.updated_at,
                "user_count": user_count,
                "course_count": course_count
            }
            organization_responses.append(OrganizationResponse(**org_dict))
        
        pages = (total + limit - 1) // limit if limit > 0 else 1
        page = (skip // limit) + 1 if limit > 0 else 1
        
        return OrganizationListResponse(
            organizations=organization_responses,
            total=total,
            page=page,
            size=limit,
            pages=pages
        )
        
    except Exception as e:
        app_logger.error(f"Error fetching organizations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve organizations: {str(e)}"
        )


@router.get("/{organization_id}", response_model=OrganizationResponse, summary="Get organization by ID")
async def get_organization(
    organization_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific organization by ID.
    Only accessible by super_admin.
    """
    if current_user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super administrators can access organizations."
        )
    
    try:
        result = await db.execute(
            select(Organization).where(Organization.id == organization_id)
        )
        organization = result.scalar_one_or_none()
        
        if not organization:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Organization with ID {organization_id} not found."
            )
        
        # Get user and course counts
        user_count_result = await db.execute(
            select(func.count(User.id)).where(User.organization_id == organization.id)
        )
        user_count = user_count_result.scalar() or 0
        
        course_count_result = await db.execute(
            select(func.count(Course.id)).where(Course.organization_id == organization.id)
        )
        course_count = course_count_result.scalar() or 0
        
        org_dict = {
            "id": organization.id,
            "name": organization.name,
            "description": organization.description,
            "website": organization.website,
            "contact_email": organization.contact_email,
            "contact_phone": organization.contact_phone,
            "address": organization.address,
            "industry": organization.industry,
            "size": organization.size,
            "domain": organization.domain,
            "logo_url": organization.logo_url,
            "is_active": organization.is_active,
            "created_at": organization.created_at,
            "updated_at": organization.updated_at,
            "user_count": user_count,
            "course_count": course_count
        }
        
        return OrganizationResponse(**org_dict)
        
    except HTTPException:
        raise
    except Exception as e:
        app_logger.error(f"Error fetching organization {organization_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve organization: {str(e)}"
        )


@router.put("/{organization_id}", response_model=OrganizationResponse, summary="Update organization")
async def update_organization(
    organization_id: int,
    organization_data: OrganizationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update an organization.
    Only accessible by super_admin.
    """
    if current_user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super administrators can update organizations."
        )
    
    try:
        result = await db.execute(
            select(Organization).where(Organization.id == organization_id)
        )
        organization = result.scalar_one_or_none()
        
        if not organization:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Organization with ID {organization_id} not found."
            )
        
        # Update fields
        update_data = organization_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(organization, field, value)
        
        await db.commit()
        await db.refresh(organization)
        
        # Get user and course counts
        user_count_result = await db.execute(
            select(func.count(User.id)).where(User.organization_id == organization.id)
        )
        user_count = user_count_result.scalar() or 0
        
        course_count_result = await db.execute(
            select(func.count(Course.id)).where(Course.organization_id == organization.id)
        )
        course_count = course_count_result.scalar() or 0
        
        org_dict = {
            "id": organization.id,
            "name": organization.name,
            "description": organization.description,
            "website": organization.website,
            "contact_email": organization.contact_email,
            "contact_phone": organization.contact_phone,
            "address": organization.address,
            "industry": organization.industry,
            "size": organization.size,
            "domain": organization.domain,
            "logo_url": organization.logo_url,
            "is_active": organization.is_active,
            "created_at": organization.created_at,
            "updated_at": organization.updated_at,
            "user_count": user_count,
            "course_count": course_count
        }
        
        return OrganizationResponse(**org_dict)
        
    except HTTPException:
        raise
    except Exception as e:
        app_logger.error(f"Error updating organization {organization_id}: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update organization: {str(e)}"
        )


@router.delete("/{organization_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete organization")
async def delete_organization(
    organization_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete an organization.
    Only accessible by super_admin.
    """
    if current_user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super administrators can delete organizations."
        )
    
    try:
        result = await db.execute(
            select(Organization).where(Organization.id == organization_id)
        )
        organization = result.scalar_one_or_none()
        
        if not organization:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Organization with ID {organization_id} not found."
            )
        
        # Check if organization has users or courses
        user_count_result = await db.execute(
            select(func.count(User.id)).where(User.organization_id == organization.id)
        )
        user_count = user_count_result.scalar() or 0
        
        course_count_result = await db.execute(
            select(func.count(Course.id)).where(Course.organization_id == organization.id)
        )
        course_count = course_count_result.scalar() or 0
        
        if user_count > 0 or course_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete organization with {user_count} users and {course_count} courses. Please remove all users and courses first."
            )
        
        await db.delete(organization)
        await db.commit()
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        app_logger.error(f"Error deleting organization {organization_id}: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete organization: {str(e)}"
        )

