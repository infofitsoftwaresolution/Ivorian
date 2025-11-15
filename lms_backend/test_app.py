"""
Simple test script to verify FastAPI application setup
"""
import asyncio
import sys
from pathlib import Path

# Add the app directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

from app.main import app
from app.core.config import settings
from app.core.logging import app_logger


async def test_app_startup():
    """Test application startup"""
    try:
        app_logger.info("🧪 Testing FastAPI application startup...")
        
        # Test basic configuration
        app_logger.info(f"✅ App Title: {settings.PROJECT_NAME}")
        app_logger.info(f"✅ App Version: {settings.APP_VERSION}")
        app_logger.info(f"✅ API Version: {settings.API_V1_STR}")
        app_logger.info(f"✅ Debug Mode: {settings.DEBUG}")
        app_logger.info(f"✅ Server Host: {settings.HOST}")
        app_logger.info(f"✅ Server Port: {settings.PORT}")
        
        # Test routes
        routes = [route.path for route in app.routes]
        app_logger.info(f"✅ Available Routes: {len(routes)} routes found")
        
        # Test OpenAPI schema
        openapi_schema = app.openapi()
        app_logger.info(f"✅ OpenAPI Schema: {len(openapi_schema.get('paths', {}))} endpoints")
        
        app_logger.info("🎉 FastAPI application setup test completed successfully!")
        return True
        
    except Exception as e:
        app_logger.error(f"❌ FastAPI application test failed: {str(e)}")
        return False


if __name__ == "__main__":
    success = asyncio.run(test_app_startup())
    sys.exit(0 if success else 1)
