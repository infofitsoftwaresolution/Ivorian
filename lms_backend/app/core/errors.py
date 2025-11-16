"""
Error handling and custom exceptions for the LMS application
"""
from typing import Any, Dict, Optional
from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from pydantic import ValidationError

from app.core.logging import app_logger
from app.core.config import settings


class LMSException(HTTPException):
    """Base exception for LMS application"""
    
    def __init__(
        self,
        status_code: int,
        detail: str,
        error_code: Optional[str] = None,
        headers: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(status_code=status_code, detail=detail, headers=headers)
        self.error_code = error_code


class AuthenticationError(LMSException):
    """Authentication related errors"""
    
    def __init__(self, detail: str = "Authentication failed"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            error_code="AUTH_ERROR"
        )


class AuthorizationError(LMSException):
    """Authorization related errors"""
    
    def __init__(self, detail: str = "Insufficient permissions"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
            error_code="AUTHZ_ERROR"
        )


class ResourceNotFoundError(LMSException):
    """Resource not found errors"""
    
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail,
            error_code="NOT_FOUND"
        )


class ValidationError(LMSException):
    """Validation errors"""
    
    def __init__(self, detail: str = "Validation error"):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail,
            error_code="VALIDATION_ERROR"
        )


class DatabaseError(LMSException):
    """Database related errors"""
    
    def __init__(self, detail: str = "Database error occurred"):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail,
            error_code="DB_ERROR"
        )


class ExternalServiceError(LMSException):
    """External service errors"""
    
    def __init__(self, detail: str = "External service error"):
        super().__init__(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=detail,
            error_code="EXTERNAL_SERVICE_ERROR"
        )


def get_cors_headers(request: Request) -> Dict[str, str]:
    """Get CORS headers based on request origin"""
    origin = request.headers.get("origin")
    cors_headers = {}
    
    if origin and origin in settings.BACKEND_CORS_ORIGINS:
        cors_headers = {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
            "Access-Control-Allow-Headers": "Accept, Accept-Language, Content-Language, Content-Type, Authorization, X-Requested-With, Origin, Access-Control-Request-Method, Access-Control-Request-Headers, Cache-Control, Pragma",
        }
    
    return cors_headers


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handle HTTP exceptions"""
    app_logger.error(
        "HTTP Exception: {} - {}".format(exc.status_code, exc.detail),
        extra={
            "path": request.url.path,
            "method": request.method,
            "status_code": exc.status_code,
        }
    )
    
    # Merge CORS headers with existing headers
    headers = {**(exc.headers or {}), **get_cors_headers(request)}
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": getattr(exc, 'error_code', 'HTTP_ERROR'),
                "message": exc.detail,
                "status_code": exc.status_code,
            }
        },
        headers=headers,
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Handle validation exceptions"""
    # DEBUG: Print the actual error structure
    print(f"[DEBUG] Validation error type: {type(exc)}")
    print(f"[DEBUG] Error errors(): {exc.errors()}")
    print(f"[DEBUG] First error: {exc.errors()[0] if exc.errors() else 'No errors'}")
    print(f"[DEBUG] First error type: {type(exc.errors()[0]) if exc.errors() else 'No errors'}")
    
    # Safely extract error details
    error_details = []
    
    try:
        for i, error in enumerate(exc.errors()):
            print(f"[DEBUG] Processing error {i}: {error}")
            print(f"[DEBUG] Error type: {type(error)}")
            print(f"[DEBUG] Error dir: {dir(error)}")
            
            try:
                # Handle different error structures safely
                if isinstance(error, dict):
                    error_detail = {
                        "loc": error.get("loc", []),
                        "msg": error.get("msg", "Validation error"),
                        "type": error.get("type", "validation_error")
                    }
                elif hasattr(error, '__dict__'):
                    # Handle objects with attributes
                    error_dict = getattr(error, '__dict__', {})
                    error_detail = {
                        "loc": error_dict.get("loc", []),
                        "msg": error_dict.get("msg", str(error)),
                        "type": error_dict.get("type", "validation_error")
                    }
                else:
                    # Handle string or other error types
                    error_detail = {
                        "loc": [],
                        "msg": str(error),
                        "type": "validation_error"
                    }
                error_details.append(error_detail)
                print(f"[DEBUG] Added error detail: {error_detail}")
            except Exception as inner_e:
                print(f"[DEBUG] Inner error processing failed: {inner_e}")
                # Fallback if individual error processing fails
                error_details.append({
                    "loc": [],
                    "msg": f"Error processing validation error: {str(error)}",
                    "type": "validation_error"
                })
    except Exception as outer_e:
        print(f"[DEBUG] Outer error processing failed: {outer_e}")
        # Ultimate fallback
        error_details = [{
            "loc": [],
            "msg": f"Validation error occurred: {str(exc)}",
            "type": "validation_error"
        }]
    
    # Convert error_details to safe format for logging
    safe_error_details = []
    for error in error_details:
        if isinstance(error, dict):
            safe_error_details.append({
                "loc": str(error.get("loc", [])),
                "msg": str(error.get("msg", "")),
                "type": str(error.get("type", ""))
            })
        else:
            safe_error_details.append(str(error))
    
    app_logger.error(
        f"Validation Error: {len(error_details)} errors found",
        extra={
            "path": request.url.path,
            "method": request.method,
            "validation_errors": safe_error_details,
        }
    )
    
    # Add CORS headers
    headers = get_cors_headers(request)
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Validation error",
                "status_code": status.HTTP_422_UNPROCESSABLE_ENTITY,
                "details": error_details,
            }
        },
        headers=headers,
    )


async def pydantic_validation_exception_handler(request: Request, exc: ValidationError) -> JSONResponse:
    """Handle Pydantic validation exceptions"""
    # Safely extract error details
    error_details = []
    for error in exc.errors():
        try:
            # Handle different error structures
            if isinstance(error, dict):
                error_detail = {
                    "loc": error.get("loc", []),
                    "msg": error.get("msg", "Validation error"),
                    "type": error.get("type", "validation_error")
                }
            elif hasattr(error, 'loc') and hasattr(error, 'msg') and hasattr(error, 'type'):
                # Handle Pydantic error objects
                error_detail = {
                    "loc": getattr(error, "loc", []),
                    "msg": getattr(error, "msg", "Validation error"),
                    "type": getattr(error, "type", "validation_error")
                }
            else:
                # Handle string or other error types
                error_detail = {
                    "loc": [],
                    "msg": str(error),
                    "type": "validation_error"
                }
            error_details.append(error_detail)
        except Exception as e:
            # Fallback if error structure is unexpected
            error_details.append({
                "loc": [],
                "msg": str(error),
                "type": "validation_error"
            })
    
    # Convert error_details to safe format for logging
    safe_error_details = []
    for error in error_details:
        if isinstance(error, dict):
            safe_error_details.append({
                "loc": str(error.get("loc", [])),
                "msg": str(error.get("msg", "")),
                "type": str(error.get("type", ""))
            })
        else:
            safe_error_details.append(str(error))
    
    app_logger.error(
        f"Pydantic Validation Error: {len(error_details)} errors found",
        extra={
            "path": request.url.path,
            "method": request.method,
            "validation_errors": safe_error_details,
        }
    )
    
    # Add CORS headers
    headers = get_cors_headers(request)
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Validation error",
                "status_code": status.HTTP_422_UNPROCESSABLE_ENTITY,
                "details": error_details,
            }
        },
        headers=headers,
    )


async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle general exceptions"""
    app_logger.error(
        "Unhandled Exception: {}".format(str(exc)),
        extra={
            "path": request.url.path,
            "method": request.method,
            "exception_type": type(exc).__name__,
            "exception": str(exc),
        },
        exc_info=True,
    )
    
    # Add CORS headers
    headers = get_cors_headers(request)
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred",
                "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
            }
        },
        headers=headers,
    )


def setup_exception_handlers(app):
    """Setup exception handlers for the FastAPI application"""
    
    # Register exception handlers
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(ValidationError, pydantic_validation_exception_handler)
    app.add_exception_handler(Exception, general_exception_handler)
    
    # Register custom exception handlers
    app.add_exception_handler(AuthenticationError, http_exception_handler)
    app.add_exception_handler(AuthorizationError, http_exception_handler)
    app.add_exception_handler(ResourceNotFoundError, http_exception_handler)
    app.add_exception_handler(ValidationError, http_exception_handler)
    app.add_exception_handler(DatabaseError, http_exception_handler)
    app.add_exception_handler(ExternalServiceError, http_exception_handler)
