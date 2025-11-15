"""
RBAC Service for role and permission management
"""
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.rbac import Role, Permission
from app.models.user import User


class RBACService:
    """Service for managing roles and permissions"""
    
    @staticmethod
    async def get_user_roles(db: AsyncSession, user_id: int) -> List[Role]:
        """Get all roles for a user"""
        result = await db.execute(
            select(User)
            .options(selectinload(User.roles))
            .where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        if not user:
            return []
        return user.roles
    
    @staticmethod
    async def get_user_permissions(db: AsyncSession, user_id: int) -> List[Permission]:
        """Get all permissions for a user through their roles"""
        result = await db.execute(
            select(User)
            .options(
                selectinload(User.roles).selectinload(Role.permissions)
            )
            .where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        if not user:
            return []
        
        permissions = set()
        for role in user.roles:
            if role.is_active:
                for permission in role.permissions:
                    if permission.is_active:
                        permissions.add(permission)
        
        return list(permissions)
    
    @staticmethod
    async def has_permission(db: AsyncSession, user_id: int, resource: str, action: str) -> bool:
        """Check if user has specific permission"""
        permissions = await RBACService.get_user_permissions(db, user_id)
        
        for permission in permissions:
            if permission.resource == resource and permission.action == action:
                return True
        
        return False
    
    @staticmethod
    async def has_role(db: AsyncSession, user_id: int, role_name: str) -> bool:
        """Check if user has specific role"""
        roles = await RBACService.get_user_roles(db, user_id)
        
        for role in roles:
            if role.name == role_name and role.is_active:
                return True
        
        return False
    
    @staticmethod
    async def assign_role_to_user(db: AsyncSession, user_id: int, role_id: int) -> bool:
        """Assign a role to a user"""
        user = await db.get(User, user_id)
        role = await db.get(Role, role_id)
        
        if not user or not role:
            return False
        
        if role not in user.roles:
            user.roles.append(role)
            await db.commit()
        
        return True
    
    @staticmethod
    async def remove_role_from_user(db: AsyncSession, user_id: int, role_id: int) -> bool:
        """Remove a role from a user"""
        user = await db.get(User, user_id)
        role = await db.get(Role, role_id)
        
        if not user or not role:
            return False
        
        if role in user.roles:
            user.roles.remove(role)
            await db.commit()
        
        return True
    
    @staticmethod
    async def create_role(db: AsyncSession, name: str, description: str = None) -> Role:
        """Create a new role"""
        role = Role(name=name, description=description)
        db.add(role)
        await db.commit()
        await db.refresh(role)
        return role
    
    @staticmethod
    async def create_permission(db: AsyncSession, name: str, resource: str, action: str, description: str = None) -> Permission:
        """Create a new permission"""
        permission = Permission(
            name=name,
            resource=resource,
            action=action,
            description=description
        )
        db.add(permission)
        await db.commit()
        await db.refresh(permission)
        return permission
    
    @staticmethod
    async def assign_permission_to_role(db: AsyncSession, role_id: int, permission_id: int) -> bool:
        """Assign a permission to a role"""
        role = await db.get(Role, role_id)
        permission = await db.get(Permission, permission_id)
        
        if not role or not permission:
            return False
        
        if permission not in role.permissions:
            role.permissions.append(permission)
            await db.commit()
        
        return True
