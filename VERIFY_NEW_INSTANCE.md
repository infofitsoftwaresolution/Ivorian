# Verification Checklist for New EC2 Instance

## Today's Changes Summary

1. ✅ **S3 Video Storage** - Videos stored in AWS S3 bucket
2. ✅ **AWS SES Email Service** - Welcome emails with temp credentials
3. ✅ **Password Change Required** - First login requires password change
4. ✅ **Email Templates** - For organizations, tutors, and students
5. ✅ **Database Migration** - Added `password_change_required` field
6. ✅ **Auto Configuration** - Deployment script auto-configures settings

## Quick Verification Commands

Run these commands on your new EC2 instance (15.206.84.110) to verify everything:

### Step 1: Check if repository is cloned

```bash
cd /home/ec2-user/lms-app && pwd
```

### Step 2: Check if .env file exists and has today's changes

```bash
cd /home/ec2-user/lms-app/lms_backend && cat .env | grep -E "(AWS_S3_BUCKET|EMAILS_FROM_EMAIL|AWS_REGION)"
```

Should show:
- `AWS_REGION=ap-south-1`
- `AWS_S3_BUCKET=infofitlabs-lms-videos`
- `EMAILS_FROM_EMAIL=infofitsoftware@gmail.com`
- `EMAILS_FROM_NAME=InfoFit LMS`

### Step 3: Check if boto3 is installed

```bash
cd /home/ec2-user/lms-app/lms_backend && source venv/bin/activate && pip list | grep boto3
```

Should show: `boto3` installed

### Step 4: Check if migration ran (password_change_required field)

```bash
cd /home/ec2-user/lms-app/lms_backend && source venv/bin/activate && alembic current
```

Should show migration `002` (password_change_required)

### Step 5: Check if email service exists

```bash
ls -la /home/ec2-user/lms-app/lms_backend/app/services/email_service.py
```

Should exist

### Step 6: Check if S3 service exists

```bash
ls -la /home/ec2-user/lms-app/lms_backend/app/services/s3_service.py
```

Should exist

### Step 7: Check if upload endpoint exists

```bash
grep -r "upload" /home/ec2-user/lms-app/lms_backend/app/api/v1/ | grep -i "upload.py"
```

Should show upload.py file

### Step 8: Check backend logs for S3 and SES initialization

```bash
sudo journalctl -u lms-backend -n 100 --no-pager | grep -i -E "(s3|ses|email|bucket)"
```

Should show initialization messages

## If CI/CD Deployment Succeeds

The deployment script will automatically:
- ✅ Pull latest code (with all today's changes)
- ✅ Add AWS S3 configuration
- ✅ Add email configuration  
- ✅ Run database migrations
- ✅ Install boto3
- ✅ Restart services

## Manual Setup (If CI/CD Fails)

If you need to set up manually, run:

```bash
cd /home/ec2-user/lms-app
git pull origin main
chmod +x deploy/deploy-no-docker.sh
./deploy/deploy-no-docker.sh
```

This will handle everything automatically!

