"""
File Upload API endpoints for S3 storage
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from fastapi.responses import JSONResponse

from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.s3_service import s3_service
from app.core.logging import app_logger

router = APIRouter()

# Allowed video MIME types
ALLOWED_VIDEO_TYPES = {
    "video/mp4",
    "video/webm",
    "video/ogg",
    "video/quicktime",
    "video/x-msvideo",  # AVI
    "video/x-matroska",  # MKV
}

# Maximum file size: 500MB
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500MB in bytes


@router.post("/video", status_code=status.HTTP_201_CREATED)
async def upload_video(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a video file to S3
    
    - **file**: Video file to upload (max 500MB)
    - Returns: S3 URL of the uploaded video
    """
    # Check if S3 is configured
    if not s3_service.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="S3 storage is not configured. Please contact administrator."
        )
    
    # Validate file type
    if file.content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_VIDEO_TYPES)}"
        )
    
    try:
        # Read file content
        file_content = await file.read()
        file_size = len(file_content)
        
        # Validate file size
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size exceeds maximum allowed size of {MAX_FILE_SIZE / (1024*1024):.0f}MB"
            )
        
        if file_size == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File is empty"
            )
        
        # Upload to S3
        s3_url = await s3_service.upload_file(
            file_content=file_content,
            file_name=file.filename or "video.mp4",
            content_type=file.content_type or "video/mp4",
            folder="videos",
            make_public=True  # Make videos publicly accessible
        )
        
        if not s3_url:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upload file to S3"
            )
        
        app_logger.info(f"✅ Video uploaded by user {current_user.id}: {file.filename}")
        
        return JSONResponse(
            status_code=status.HTTP_201_CREATED,
            content={
                "message": "Video uploaded successfully",
                "url": s3_url,
                "filename": file.filename,
                "size": file_size,
                "content_type": file.content_type
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        app_logger.error(f"❌ Error uploading video: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading video: {str(e)}"
        )


@router.post("/file", status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    folder: str = "files",
    current_user: User = Depends(get_current_user)
):
    """
    Upload a general file to S3
    
    - **file**: File to upload (max 100MB)
    - **folder**: S3 folder prefix (default: "files")
    - Returns: S3 URL of the uploaded file
    """
    # Check if S3 is configured
    if not s3_service.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="S3 storage is not configured. Please contact administrator."
        )
    
    # Maximum file size for general files: 100MB
    max_size = 100 * 1024 * 1024
    
    try:
        # Read file content
        file_content = await file.read()
        file_size = len(file_content)
        
        # Validate file size
        if file_size > max_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size exceeds maximum allowed size of {max_size / (1024*1024):.0f}MB"
            )
        
        if file_size == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File is empty"
            )
        
        # Upload to S3
        s3_url = await s3_service.upload_file(
            file_content=file_content,
            file_name=file.filename or "file",
            content_type=file.content_type or "application/octet-stream",
            folder=folder,
            make_public=True
        )
        
        if not s3_url:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upload file to S3"
            )
        
        app_logger.info(f"✅ File uploaded by user {current_user.id}: {file.filename}")
        
        return JSONResponse(
            status_code=status.HTTP_201_CREATED,
            content={
                "message": "File uploaded successfully",
                "url": s3_url,
                "filename": file.filename,
                "size": file_size,
                "content_type": file.content_type
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        app_logger.error(f"❌ Error uploading file: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading file: {str(e)}"
        )


@router.delete("/file", status_code=status.HTTP_200_OK)
async def delete_file(
    url: str = Query(..., description="S3 URL of the file to delete"),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a file from S3
    
    - **url**: S3 URL of the file to delete
    - Returns: Success message
    """
    # Check if S3 is configured
    if not s3_service.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="S3 storage is not configured. Please contact administrator."
        )
    
    try:
        # Extract S3 key from URL
        s3_key = s3_service.extract_key_from_url(url)
        
        if not s3_key:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid S3 URL"
            )
        
        # Delete from S3
        success = await s3_service.delete_file(s3_key)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete file from S3"
            )
        
        app_logger.info(f"✅ File deleted by user {current_user.id}: {s3_key}")
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "message": "File deleted successfully",
                "url": url
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        app_logger.error(f"❌ Error deleting file: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting file: {str(e)}"
        )

