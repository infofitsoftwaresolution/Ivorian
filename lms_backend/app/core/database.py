"""
Database configuration and session management
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.pool import StaticPool

from app.core.config import settings

# Create async engine
# For PostgreSQL with psycopg3
if settings.DATABASE_URL.startswith("postgresql"):
    # Convert postgresql:// to postgresql+psycopg:// for psycopg3
    database_url = settings.DATABASE_URL.replace("postgresql://", "postgresql+psycopg://")
else:
    database_url = settings.DATABASE_URL

engine = create_async_engine(
    database_url,
    echo=settings.DATABASE_ECHO,
    pool_pre_ping=True,
    pool_recycle=300,
)

# Create async session factory
AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# Create base class for models
Base = declarative_base()


async def get_db() -> AsyncSession:
    """
    Dependency to get database session
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """
    Initialize database tables
    """
    async with engine.begin() as conn:
        # Import all models here to ensure they are registered
        from app.models import user, course, assessment, analytics, organization
        
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    """
    Close database connections
    """
    await engine.dispose() 