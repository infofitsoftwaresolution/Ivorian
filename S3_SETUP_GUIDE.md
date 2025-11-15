# AWS S3 Video Storage Setup Guide

This guide explains how to configure AWS S3 for video storage in the LMS application.

## Overview

The application now supports uploading videos directly to AWS S3. Videos are stored in S3 and their URLs are saved in the database.

## Prerequisites

1. AWS Account
2. AWS S3 Bucket created
3. AWS IAM User with S3 permissions

## Step 1: Create S3 Bucket

1. Log in to AWS Console
2. Go to S3 service
3. Click "Create bucket"
4. Configure:
   - **Bucket name**: Choose a unique name (e.g., `infofitlabs-lms-videos`)
   - **Region**: Choose your preferred region (e.g., `ap-south-1`)
   - **Block Public Access**: Uncheck "Block all public access" (or configure bucket policy for public read)
   - **Versioning**: Optional (recommended for production)
5. Click "Create bucket"

## Step 2: Configure Bucket Policy (for Public Access)

If you want videos to be publicly accessible, add this bucket policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    }
  ]
}
```

Replace `YOUR-BUCKET-NAME` with your actual bucket name.

## Step 3: Create IAM User

1. Go to IAM service in AWS Console
2. Click "Users" → "Create user"
3. Enter username (e.g., `lms-s3-uploader`)
4. Select "Programmatic access"
5. Click "Next: Permissions"
6. Click "Attach existing policies directly"
7. Search and select `AmazonS3FullAccess` (or create a custom policy with only necessary permissions)
8. Click "Next: Tags" (optional)
9. Click "Next: Review" → "Create user"
10. **IMPORTANT**: Save the Access Key ID and Secret Access Key (you won't see the secret again!)

### Custom IAM Policy (Recommended for Production)

For better security, create a custom policy that only allows access to your specific bucket:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME"
    }
  ]
}
```

## Step 4: Configure Environment Variables

Update your `.env` file in `lms_backend/`:

```env
# AWS Configuration
AWS_ACCESS_KEY_ID=your-access-key-id-here
AWS_SECRET_ACCESS_KEY=your-secret-access-key-here
AWS_REGION=ap-south-1
AWS_S3_BUCKET=your-bucket-name-here
```

**Important**: 
- Never commit `.env` file to git
- Use environment variables or secrets manager in production
- For EC2 deployment, add these to `/home/ec2-user/lms-app/lms_backend/.env`

## Step 5: Install Dependencies

The `boto3` package is already added to `requirements.txt`. Install it:

```bash
cd lms_backend
source venv/bin/activate
pip install -r requirements.txt
```

Or if deploying to EC2:

```bash
cd /home/ec2-user/lms-app/lms_backend
source venv/bin/activate
pip install boto3>=1.34.0
```

## Step 6: Restart Services

After configuring environment variables, restart the backend service:

```bash
# On EC2
sudo systemctl restart lms-backend
sudo systemctl status lms-backend
```

## How It Works

### Video Upload Flow

1. **User uploads video** via the VideoUploader component
2. **Frontend** sends video file to `/api/v1/upload/video` endpoint
3. **Backend** validates file (type, size)
4. **S3 Service** uploads file to S3 with unique key: `videos/YYYYMMDD/uuid-filename.mp4`
5. **Backend** returns S3 URL
6. **Frontend** saves URL to lesson's `video_url` field

### File Organization

Videos are organized in S3 as:
```
bucket-name/
  videos/
    20251111/
      abc12345-introduction-to-python.mp4
    20251112/
      def67890-advanced-concepts.mp4
```

### Supported Video Formats

- MP4 (`video/mp4`)
- WebM (`video/webm`)
- OGG (`video/ogg`)
- QuickTime (`video/quicktime`)
- AVI (`video/x-msvideo`)
- MKV (`video/x-matroska`)

### File Size Limits

- **Videos**: Maximum 500MB
- **General files**: Maximum 100MB

## API Endpoints

### Upload Video
```
POST /api/v1/upload/video
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body:
  file: <video file>
```

**Response:**
```json
{
  "message": "Video uploaded successfully",
  "url": "https://bucket.s3.region.amazonaws.com/videos/20251111/abc12345-video.mp4",
  "filename": "video.mp4",
  "size": 10485760,
  "content_type": "video/mp4"
}
```

### Upload General File
```
POST /api/v1/upload/file?folder=documents
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body:
  file: <file>
  folder: documents (optional, default: "files")
```

### Delete File
```
DELETE /api/v1/upload/file?url=<s3-url>
Authorization: Bearer <token>
```

## Troubleshooting

### Error: "S3 storage is not configured"

**Solution**: Check that all AWS environment variables are set in `.env`:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `AWS_S3_BUCKET`

### Error: "Access Denied" or "403 Forbidden"

**Solution**: 
1. Verify IAM user has correct permissions
2. Check bucket policy allows uploads
3. Verify Access Key ID and Secret Access Key are correct

### Error: "Bucket does not exist"

**Solution**:
1. Verify bucket name in `AWS_S3_BUCKET` matches actual bucket name
2. Check region matches bucket region
3. Ensure bucket exists in your AWS account

### Videos not playing

**Solution**:
1. Check bucket policy allows public read access
2. Verify CORS configuration on S3 bucket (if needed)
3. Check video URL is correct in database

## CORS Configuration (if needed)

If you encounter CORS issues, add this CORS configuration to your S3 bucket:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

## Security Best Practices

1. **Use IAM roles** instead of access keys when possible (for EC2)
2. **Limit permissions** to only necessary S3 actions
3. **Enable bucket versioning** for recovery
4. **Set up lifecycle policies** to archive old videos
5. **Use CloudFront** for video delivery (CDN)
6. **Enable encryption** at rest (SSE-S3 or SSE-KMS)
7. **Monitor access** with CloudTrail

## Cost Optimization

1. **Use S3 Intelligent-Tiering** for automatic cost optimization
2. **Set up lifecycle policies** to move old videos to Glacier
3. **Enable compression** before upload (if possible)
4. **Use CloudFront** for frequently accessed videos
5. **Monitor usage** with AWS Cost Explorer

## Testing

Test the upload functionality:

1. Log in to the application
2. Go to course creation/editing
3. Add a lesson with video
4. Click "Upload Video"
5. Select a video file
6. Wait for upload to complete
7. Verify video URL is saved
8. Test video playback

## Support

For issues or questions:
1. Check backend logs: `sudo journalctl -u lms-backend -f`
2. Verify S3 bucket access in AWS Console
3. Test IAM credentials with AWS CLI: `aws s3 ls s3://your-bucket-name`

