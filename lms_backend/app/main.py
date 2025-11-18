"""
Main FastAPI application entry point
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import uvicorn
import time
from datetime import datetime

from app.core.config import settings
from app.core.database import init_db, close_db, get_db
from app.core.logging import app_logger
from app.core.errors import setup_exception_handlers, get_cors_headers
from app.api.v1 import auth, rbac, courses, users, upload, analytics, organizations, assessments, contact
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends
from fastapi.responses import JSONResponse
# from app.api.v1 import ai  # TODO: Uncomment when implemented

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan events
    """
    # Startup
    app_logger.info("🚀 Starting LMS API...")
    try:
        await init_db()
        app_logger.info("✅ Database initialized successfully")
    except Exception as e:
        app_logger.error(f"❌ Failed to initialize database: {str(e)}")
        raise
    
    app_logger.info(f"✅ LMS API started successfully on port {settings.PORT}")
    yield
    
    # Shutdown
    app_logger.info("🛑 Shutting down LMS API...")
    try:
        await close_db()
        app_logger.info("✅ Database connections closed successfully")
    except Exception as e:
        app_logger.error(f"❌ Error closing database connections: {str(e)}")
    
    app_logger.info("✅ LMS API shutdown complete")


# Create FastAPI application
# Set redirect_slashes=False to prevent automatic redirects that can cause CORS issues
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.APP_VERSION,
    description="Modern AI-Integrated Learning Management System API",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
    redirect_slashes=False  # Disable automatic trailing slash redirects to prevent CORS issues
)

# Setup exception handlers
setup_exception_handlers(app)

# Add CORS middleware - Must be added before other middleware
# This ensures CORS headers are set even on redirects
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=[
        "Accept",
        "Accept-Language", 
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Origin",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers",
        "Cache-Control",
        "Pragma",
    ],
    expose_headers=["Content-Length", "Content-Range", "X-Process-Time"],
    max_age=86400,  # 24 hours
)

# Add GZip middleware for compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Add trusted host middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"]  # Configure this properly for production
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests and responses"""
    start_time = time.time()
    
    # Log request
    app_logger.info(
        f"Request: {request.method} {request.url.path}",
        extra={
            "method": request.method,
            "path": request.url.path,
            "query_params": str(request.query_params),
            "client_ip": request.client.host if request.client else None,
            "user_agent": request.headers.get("user-agent"),
        }
    )
    
    try:
        # Process request
        response = await call_next(request)
    except Exception as e:
        # Ensure CORS headers are added even if an exception occurs
        app_logger.error(f"Unhandled exception in middleware: {str(e)}", exc_info=True)
        
        cors_headers = get_cors_headers(request)
        response = JSONResponse(
            status_code=500,
            content={
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected error occurred",
                    "status_code": 500,
                }
            },
            headers=cors_headers,
        )
    
    # Calculate processing time
    process_time = time.time() - start_time
    
    # Log response
    app_logger.info(
        f"Response: {response.status_code} - {process_time:.3f}s",
        extra={
            "status_code": response.status_code,
            "process_time": process_time,
            "content_length": response.headers.get("content-length"),
        }
    )
    
    # Add processing time to response headers
    response.headers["X-Process-Time"] = str(process_time)
    
    # Ensure CORS headers are present on all responses
    origin = request.headers.get("origin")
    if origin and origin in settings.BACKEND_CORS_ORIGINS:
        if "Access-Control-Allow-Origin" not in response.headers:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
    
    return response

# Include API routers
app.include_router(
    auth.router,
    prefix=f"{settings.API_V1_STR}/auth",
    tags=["Authentication"]
)

app.include_router(
    rbac.router,
    prefix=f"{settings.API_V1_STR}/rbac",
    tags=["RBAC"]
)

app.include_router(
    courses.router,
    prefix=f"{settings.API_V1_STR}/courses",
    tags=["Courses"]
)

# TODO: Uncomment when these routers are implemented
app.include_router(
    users.router,
    prefix=f"{settings.API_V1_STR}/users",
    tags=["Users"]
)

app.include_router(
    upload.router,
    prefix=f"{settings.API_V1_STR}/upload",
    tags=["File Upload"]
)

app.include_router(
    assessments.router,
    prefix=f"{settings.API_V1_STR}/assessments",
    tags=["Assessments"]
)

# app.include_router(
#     ai.router,
#     prefix=f"{settings.API_V1_STR}/ai",
#     tags=["AI Services"]
# )

app.include_router(
    analytics.router,
    prefix=f"{settings.API_V1_STR}/analytics",
    tags=["Analytics"]
)

app.include_router(
    organizations.router,
    prefix=f"{settings.API_V1_STR}/organizations",
    tags=["Organizations"]
)

app.include_router(
    contact.router,
    prefix=f"{settings.API_V1_STR}",
    tags=["Contact"]
)


@app.get("/")
async def root():
    """
    Root endpoint
    """
    return {
        "message": "Welcome to Modern AI-Integrated LMS API",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "timestamp": datetime.now().isoformat(),
        "cors_origins": settings.BACKEND_CORS_ORIGINS
    }

@app.get("/test-cors")
async def test_cors():
    """
    Test CORS endpoint
    """
    return {
        "message": "CORS is working!",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/debug/course/{course_id}")
async def debug_course_data(course_id: int, db: AsyncSession = Depends(get_db)):
    """
    Debug endpoint to check course data in database
    """
    from app.services.course import CourseService, TopicService
    from sqlalchemy import select
    from app.models.course import Course, Topic, Lesson
    
    # Get course
    course = await CourseService.get_course_with_details(db, course_id)
    if not course:
        return {"error": "Course not found"}
    
    # Get topics directly from database
    topics_result = await db.execute(select(Topic).where(Topic.course_id == course_id))
    topics = topics_result.scalars().all()
    
    # Get lessons for each topic
    debug_data = {
        "course_id": course.id,
        "course_title": course.title,
        "topics_from_relationship": len(course.topics),
        "topics_from_direct_query": len(topics),
        "topics_detail": []
    }
    
    for topic in topics:
        lessons_result = await db.execute(select(Lesson).where(Lesson.topic_id == topic.id))
        lessons = lessons_result.scalars().all()
        
        debug_data["topics_detail"].append({
            "topic_id": topic.id,
            "topic_title": topic.title,
            "lessons_from_relationship": len(topic.lessons) if hasattr(topic, 'lessons') else 0,
            "lessons_from_direct_query": len(lessons),
            "lessons": [{"id": l.id, "title": l.title} for l in lessons]
        })
    
    return debug_data

@app.post("/debug/test-topic-creation/{course_id}")
async def test_topic_creation(course_id: int, db: AsyncSession = Depends(get_db)):
    """
    Test endpoint to create a simple topic
    """
    from app.models.course import Topic
    from app.services.course import CourseService
    
    try:
        # Check if course exists
        course = await CourseService.get_course(db, course_id)
        if not course:
            return {"error": "Course not found", "course_id": course_id}
        
        # Create a simple topic directly
        topic = Topic(
            course_id=course_id,
            title="Test Topic",
            description="Test topic description",
            content="Test content",
            order=1,
            estimated_duration=30,
            is_required=True
        )
        
        db.add(topic)
        await db.commit()
        await db.refresh(topic)
        
        return {
            "success": True,
            "topic_id": topic.id,
            "topic_title": topic.title,
            "course_id": course_id
        }
        
    except Exception as e:
        import traceback
        return {
            "error": str(e),
            "traceback": traceback.format_exc()
        }


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info" if not settings.DEBUG else "debug",
        access_log=True,
        use_colors=True,
    ) 