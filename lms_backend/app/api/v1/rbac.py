"""
RBAC API endpoints
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.permissions import (
    require_super_admin, require_organization_admin,
    require_permission, get_user_permissions
)
from app.models.user import User
from app.models.rbac import Role, Permission
from app.schemas.rbac import (
    RoleCreate, RoleUpdate, Role as RoleSchema, RoleWithPermissions,
    PermissionCreate, PermissionUpdate, Permission as PermissionSchema,
    UserRoleAssignment, RolePermissionAssignment, UserPermissions
)
from app.services.rbac import RBACService
from sqlalchemy import select

router = APIRouter()


# Role Management Endpoints
@router.post("/roles", response_model=RoleSchema, dependencies=[Depends(require_super_admin)])
async def create_role(
    role_data: RoleCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new role (Super Admin only)"""
    try:
        role = await RBACService.create_role(
            db, role_data.name, role_data.description
        )
        return role
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create role: {str(e)}"
        )


@router.get("/roles", response_model=List[RoleSchema])
async def list_roles(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all roles (requires user management permission)"""
    # Check if user has permission to view roles
    has_perm = await RBACService.has_permission(db, current_user.id, "role", "read")
    if not has_perm:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view roles"
        )
    
    result = await db.execute(select(Role).where(Role.is_active == True))
    roles = result.scalars().all()
    return roles


@router.get("/roles/{role_id}", response_model=RoleWithPermissions)
async def get_role(
    role_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get role details with permissions"""
    has_perm = await RBACService.has_permission(db, current_user.id, "role", "read")
    if not has_perm:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view role details"
        )
    
    role = await db.get(Role, role_id)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    
    return role


@router.put("/roles/{role_id}", response_model=RoleSchema, dependencies=[Depends(require_super_admin)])
async def update_role(
    role_id: int,
    role_data: RoleUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a role (Super Admin only)"""
    role = await db.get(Role, role_id)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    
    for field, value in role_data.dict(exclude_unset=True).items():
        setattr(role, field, value)
    
    await db.commit()
    await db.refresh(role)
    return role


# Permission Management Endpoints
@router.post("/permissions", response_model=PermissionSchema, dependencies=[Depends(require_super_admin)])
async def create_permission(
    permission_data: PermissionCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new permission (Super Admin only)"""
    try:
        permission = await RBACService.create_permission(
            db, permission_data.name, permission_data.resource,
            permission_data.action, permission_data.description
        )
        return permission
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create permission: {str(e)}"
        )


@router.get("/permissions", response_model=List[PermissionSchema])
async def list_permissions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all permissions (requires permission management access)"""
    has_perm = await RBACService.has_permission(db, current_user.id, "permission", "read")
    if not has_perm:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view permissions"
        )
    
    result = await db.execute(select(Permission).where(Permission.is_active == True))
    permissions = result.scalars().all()
    return permissions


# User Role Management Endpoints
@router.post("/users/{user_id}/roles", dependencies=[Depends(require_organization_admin)])
async def assign_role_to_user(
    user_id: int,
    assignment: UserRoleAssignment,
    db: AsyncSession = Depends(get_db)
):
    """Assign a role to a user (Organization Admin or Super Admin)"""
    success = await RBACService.assign_role_to_user(db, user_id, assignment.role_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to assign role to user"
        )
    
    return {"message": "Role assigned successfully"}


@router.delete("/users/{user_id}/roles/{role_id}", dependencies=[Depends(require_organization_admin)])
async def remove_role_from_user(
    user_id: int,
    role_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Remove a role from a user (Organization Admin or Super Admin)"""
    success = await RBACService.remove_role_from_user(db, user_id, role_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to remove role from user"
        )
    
    return {"message": "Role removed successfully"}


@router.get("/users/{user_id}/permissions", response_model=UserPermissions)
async def get_user_permissions_detail(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed permissions for a user"""
    # Users can only view their own permissions, or admins can view any user's permissions
    if current_user.id != user_id:
        has_perm = await RBACService.has_permission(db, current_user.id, "user", "read")
        if not has_perm:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to view other user's permissions"
            )
    
    permissions = await RBACService.get_user_permissions(db, user_id)
    roles = await RBACService.get_user_roles(db, user_id)
    
    return UserPermissions(
        user_id=user_id,
        permissions=permissions,
        roles=roles
    )


# Role Permission Management Endpoints
@router.post("/roles/{role_id}/permissions", dependencies=[Depends(require_super_admin)])
async def assign_permission_to_role(
    role_id: int,
    assignment: RolePermissionAssignment,
    db: AsyncSession = Depends(get_db)
):
    """Assign a permission to a role (Super Admin only)"""
    success = await RBACService.assign_permission_to_role(db, role_id, assignment.permission_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to assign permission to role"
        )
    
    return {"message": "Permission assigned to role successfully"}


# Current User Permissions
@router.get("/me/permissions")
async def get_current_user_permissions(
    permissions: dict = Depends(get_user_permissions)
):
    """Get current user's permissions and roles"""
    return permissions


# Permission Check Endpoint
@router.post("/check-permission")
async def check_permission(
    permission_check: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Check if current user has a specific permission"""
    has_perm = await RBACService.has_permission(
        db, current_user.id, permission_check["resource"], permission_check["action"]
    )
    
    return {
        "user_id": current_user.id,
        "resource": permission_check["resource"],
        "action": permission_check["action"],
        "has_permission": has_perm
    }
