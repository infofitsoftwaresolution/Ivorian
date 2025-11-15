"""
RBAC Pydantic schemas
"""
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime


class PermissionBase(BaseModel):
    name: str
    description: Optional[str] = None
    resource: str
    action: str


class PermissionCreate(PermissionBase):
    pass


class PermissionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    resource: Optional[str] = None
    action: Optional[str] = None
    is_active: Optional[bool] = None


class Permission(PermissionBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None


class RoleCreate(RoleBase):
    pass


class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class Role(RoleBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    permissions: List[Permission] = []

    class Config:
        from_attributes = True


class RoleWithPermissions(Role):
    permissions: List[Permission] = []


class UserRoleAssignment(BaseModel):
    user_id: int
    role_id: int


class RolePermissionAssignment(BaseModel):
    role_id: int
    permission_id: int


class PermissionCheck(BaseModel):
    resource: str
    action: str


class UserPermissions(BaseModel):
    user_id: int
    permissions: List[Permission]
    roles: List[Role]
