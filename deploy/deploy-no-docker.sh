#!/bin/bash

# Deployment script for non-Docker setup
# This script is run by CI/CD pipeline or manually

set -e

echo "🚀 Starting deployment (No Docker)..."

# Navigate to deployment directory
cd /home/ec2-user/lms-app || cd /home/ubuntu/lms-app

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Ensure AWS S3 and Email settings in .env file (if not already set)
echo "🔧 Checking configuration..."
if [ -f lms_backend/.env ]; then
    # Check if AWS_REGION is set, if not add it
    if ! grep -q "^AWS_REGION=" lms_backend/.env 2>/dev/null; then
        echo "AWS_REGION=ap-south-1" >> lms_backend/.env
        echo "✅ Added AWS_REGION to .env"
    fi
    
    # Check if AWS_S3_BUCKET is set, if not add it
    if ! grep -q "^AWS_S3_BUCKET=" lms_backend/.env 2>/dev/null; then
        echo "AWS_S3_BUCKET=infofitlabs-lms-videos" >> lms_backend/.env
        echo "✅ Added AWS_S3_BUCKET to .env"
    fi
    
    # Check if EMAILS_FROM_EMAIL is set, if not add it
    if ! grep -q "^EMAILS_FROM_EMAIL=" lms_backend/.env 2>/dev/null; then
        echo "EMAILS_FROM_EMAIL=infofitsoftware@gmail.com" >> lms_backend/.env
        echo "✅ Added EMAILS_FROM_EMAIL to .env"
    fi
    
    # Check if EMAILS_FROM_NAME is set, if not add it
    if ! grep -q "^EMAILS_FROM_NAME=" lms_backend/.env 2>/dev/null; then
        echo "EMAILS_FROM_NAME=InfoFit LMS" >> lms_backend/.env
        echo "✅ Added EMAILS_FROM_NAME to .env"
    fi
else
    # Create .env file if it doesn't exist
    echo "Creating lms_backend/.env file..."
    touch lms_backend/.env
    echo "AWS_REGION=ap-south-1" >> lms_backend/.env
    echo "AWS_S3_BUCKET=infofitlabs-lms-videos" >> lms_backend/.env
    echo "EMAILS_FROM_EMAIL=infofitsoftware@gmail.com" >> lms_backend/.env
    echo "EMAILS_FROM_NAME=InfoFit LMS" >> lms_backend/.env
    echo "✅ Created .env file with configuration"
fi

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Backend deployment
echo "🔧 Deploying backend..."
cd lms_backend

# Activate virtual environment
source venv/bin/activate

# Install/update dependencies
echo "📦 Installing backend dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Run database migrations
echo "📊 Running database migrations..."
cd lms_backend
source venv/bin/activate
alembic upgrade head || echo "⚠️  Migrations failed - check database connection"
cd ..

# Restart backend service
echo "🔄 Restarting backend service..."
sudo systemctl restart lms-backend

# Frontend deployment
echo "⚛️  Deploying frontend..."
cd ../lms_frontend

# Install/update dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Build frontend
echo "🏗️  Building frontend..."
npm run build

# Create symlinks for standalone mode
echo "🔗 Creating symlinks for standalone mode..."
ln -sfn $(pwd)/.next/static .next/standalone/.next/static 2>/dev/null || true
ln -sfn $(pwd)/public .next/standalone/public 2>/dev/null || true

# Restart frontend service
echo "🔄 Restarting frontend service..."
sudo systemctl restart lms-frontend

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Check service status
echo "🏥 Checking service status..."
sudo systemctl status lms-backend --no-pager -l | head -20
sudo systemctl status lms-frontend --no-pager -l | head -20

# Health check
echo "🏥 Running health check..."
sleep 5
curl -f http://localhost:8000/health || echo "⚠️  Health check failed"

echo "✅ Deployment completed successfully!"

