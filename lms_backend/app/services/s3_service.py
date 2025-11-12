"""
S3 Service for file uploads and storage
"""
import boto3
from botocore.exceptions import ClientError, BotoCoreError
from typing import Optional, BinaryIO
import uuid
from datetime import datetime
import os
from pathlib import Path

from app.core.config import settings
from app.core.logging import app_logger


class S3Service:
    """Service for handling S3 file uploads"""
    
    def __init__(self):
        """Initialize S3 client"""
        # Check if bucket name is configured (required)
        if not settings.AWS_S3_BUCKET:
            app_logger.warning("⚠️  AWS S3 bucket not configured. File uploads will fail.")
            self.s3_client = None
            self.bucket_name = None
            return
        
        self.bucket_name = settings.AWS_S3_BUCKET
        
        try:
            # If access keys are provided, use them
            if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
                self.s3_client = boto3.client(
                    's3',
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                    region_name=settings.AWS_REGION
                )
                app_logger.info(f"✅ S3 client initialized with access keys for bucket: {self.bucket_name}")
            else:
                # No access keys - will use IAM role (for EC2 instances)
                self.s3_client = boto3.client(
                    's3',
                    region_name=settings.AWS_REGION
                )
                app_logger.info(f"✅ S3 client initialized with IAM role for bucket: {self.bucket_name}")
        except Exception as e:
            app_logger.error(f"❌ Failed to initialize S3 client: {str(e)}")
            self.s3_client = None
            self.bucket_name = None
    
    def is_configured(self) -> bool:
        """Check if S3 is properly configured"""
        return self.s3_client is not None and self.bucket_name is not None
    
    def generate_file_key(self, file_name: str, folder: str = "videos") -> str:
        """
        Generate a unique S3 key for a file
        
        Args:
            file_name: Original file name
            folder: S3 folder prefix (default: "videos")
        
        Returns:
            Unique S3 key (path) for the file
        """
        # Get file extension
        file_ext = Path(file_name).suffix.lower()
        
        # Generate unique filename with timestamp and UUID
        timestamp = datetime.utcnow().strftime("%Y%m%d")
        unique_id = str(uuid.uuid4())[:8]
        safe_filename = Path(file_name).stem.replace(" ", "_").lower()
        safe_filename = "".join(c for c in safe_filename if c.isalnum() or c in "._-")
        
        # Construct key: folder/YYYYMMDD/unique_id-safe_filename.ext
        key = f"{folder}/{timestamp}/{unique_id}-{safe_filename}{file_ext}"
        
        return key
    
    async def upload_file(
        self,
        file_content: bytes,
        file_name: str,
        content_type: str,
        folder: str = "videos",
        make_public: bool = False
    ) -> Optional[str]:
        """
        Upload a file to S3
        
        Args:
            file_content: File content as bytes
            file_name: Original file name
            content_type: MIME type of the file
            folder: S3 folder prefix (default: "videos")
            make_public: Whether to make the file publicly accessible
        
        Returns:
            S3 URL of the uploaded file, or None if upload failed
        """
        if not self.is_configured():
            app_logger.error("❌ S3 not configured. Cannot upload file.")
            return None
        
        try:
            # Generate unique S3 key
            s3_key = self.generate_file_key(file_name, folder)
            
            # Prepare upload parameters
            upload_params = {
                'Bucket': self.bucket_name,
                'Key': s3_key,
                'Body': file_content,
                'ContentType': content_type,
            }
            
            # Add ACL if file should be public
            if make_public:
                upload_params['ACL'] = 'public-read'
            
            # Upload file
            self.s3_client.put_object(**upload_params)
            
            # Generate URL
            if make_public:
                # Public URL
                url = f"https://{self.bucket_name}.s3.{settings.AWS_REGION}.amazonaws.com/{s3_key}"
            else:
                # Generate presigned URL (valid for 1 year)
                url = self.s3_client.generate_presigned_url(
                    'get_object',
                    Params={'Bucket': self.bucket_name, 'Key': s3_key},
                    ExpiresIn=31536000  # 1 year
                )
            
            app_logger.info(f"✅ File uploaded to S3: {s3_key}")
            return url
            
        except ClientError as e:
            app_logger.error(f"❌ AWS S3 ClientError: {str(e)}")
            return None
        except BotoCoreError as e:
            app_logger.error(f"❌ AWS BotoCoreError: {str(e)}")
            return None
        except Exception as e:
            app_logger.error(f"❌ Unexpected error uploading to S3: {str(e)}")
            return None
    
    async def delete_file(self, s3_key: str) -> bool:
        """
        Delete a file from S3
        
        Args:
            s3_key: S3 key (path) of the file to delete
        
        Returns:
            True if deletion was successful, False otherwise
        """
        if not self.is_configured():
            app_logger.error("❌ S3 not configured. Cannot delete file.")
            return False
        
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            app_logger.info(f"✅ File deleted from S3: {s3_key}")
            return True
            
        except ClientError as e:
            app_logger.error(f"❌ AWS S3 ClientError deleting file: {str(e)}")
            return False
        except Exception as e:
            app_logger.error(f"❌ Unexpected error deleting from S3: {str(e)}")
            return False
    
    def extract_key_from_url(self, url: str) -> Optional[str]:
        """
        Extract S3 key from a URL
        
        Args:
            url: S3 URL (public or presigned)
        
        Returns:
            S3 key if URL is valid, None otherwise
        """
        try:
            # Handle public URLs: https://bucket.s3.region.amazonaws.com/key
            if f"{self.bucket_name}.s3" in url:
                parts = url.split(f"{self.bucket_name}.s3.{settings.AWS_REGION}.amazonaws.com/")
                if len(parts) == 2:
                    return parts[1].split('?')[0]  # Remove query params if any
            
            # Handle presigned URLs: https://bucket.s3.region.amazonaws.com/key?signature
            if "amazonaws.com" in url:
                # Extract key from URL path
                parts = url.split("amazonaws.com/")
                if len(parts) == 2:
                    return parts[1].split('?')[0]  # Remove query params
            
            return None
        except Exception as e:
            app_logger.error(f"❌ Error extracting S3 key from URL: {str(e)}")
            return None


# Create singleton instance
s3_service = S3Service()

