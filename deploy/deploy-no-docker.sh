#!/bin/bash

# Deployment script for non-Docker setup
# This script is run by CI/CD pipeline or manually

# Use set -e but allow some commands to fail
set -e

# Function to handle errors
handle_error() {
    echo "❌ Error occurred at line $1"
    echo "Command: $2"
    exit 1
}

# Trap errors
trap 'handle_error $LINENO "$BASH_COMMAND"' ERR

echo "🚀 Starting deployment (No Docker)..."

# Navigate to deployment directory
cd /home/ec2-user/lms-app || cd /home/ubuntu/lms-app

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Ensure AWS S3 settings in .env file (if not already set)
echo "🔧 Checking AWS S3 configuration..."
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
    
    # Check if EMAILS_FROM_EMAIL is set, if not add it (use a default or leave empty for user to set)
    if ! grep -q "^EMAILS_FROM_EMAIL=" lms_backend/.env 2>/dev/null; then
        echo "# Email Configuration (AWS SES)" >> lms_backend/.env
        echo "EMAILS_FROM_EMAIL=" >> lms_backend/.env
        echo "EMAILS_FROM_NAME=InfoFit LMS" >> lms_backend/.env
        echo "✅ Added EMAIL configuration placeholders to .env (please update EMAILS_FROM_EMAIL)"
    fi
    
    # Fix BACKEND_CORS_ORIGINS format - remove any existing and add correct format
    if grep -q "^BACKEND_CORS_ORIGINS=" lms_backend/.env 2>/dev/null; then
        # Remove existing BACKEND_CORS_ORIGINS line
        sed -i '/^BACKEND_CORS_ORIGINS=/d' lms_backend/.env
    fi
    # Add correct format
    echo 'BACKEND_CORS_ORIGINS="http://15.206.84.110,http://15.206.84.110:3000,http://15.206.84.110:8000,http://localhost:3000"' >> lms_backend/.env
    echo "✅ Fixed BACKEND_CORS_ORIGINS format"
else
    # Create .env file if it doesn't exist
    echo "Creating lms_backend/.env file..."
    touch lms_backend/.env
    echo "AWS_REGION=ap-south-1" >> lms_backend/.env
    echo "AWS_S3_BUCKET=infofitlabs-lms-videos" >> lms_backend/.env
    echo 'BACKEND_CORS_ORIGINS="http://15.206.84.110,http://15.206.84.110:3000,http://15.206.84.110:8000,http://localhost:3000"' >> lms_backend/.env
    echo "# Email Configuration (AWS SES)" >> lms_backend/.env
    echo "EMAILS_FROM_EMAIL=" >> lms_backend/.env
    echo "EMAILS_FROM_NAME=InfoFit LMS" >> lms_backend/.env
    echo "✅ Created .env file with AWS S3 and Email settings"
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
pip install --upgrade pip || echo "⚠️  pip upgrade failed, continuing..."
pip install -r requirements.txt || {
    echo "❌ Failed to install backend dependencies"
    exit 1
}

# Run database migrations
echo "📊 Running database migrations..."
alembic upgrade head || echo "⚠️  Migrations failed - check database connection"

# Restart backend service
echo "🔄 Restarting backend service..."
sudo systemctl restart lms-backend

# Frontend deployment
echo "⚛️  Deploying frontend..."
cd ../lms_frontend

# Check memory and create swap if needed
echo "💾 Checking available memory..."
FREE_MEM=$(free -m | awk 'NR==2{printf "%.0f", $7}')
if [ "$FREE_MEM" -lt 1000 ]; then
    echo "⚠️  Low memory detected (${FREE_MEM}MB free). Checking swap..."
    if [ ! -f /swapfile ] || [ $(swapon --show=SIZE --noheadings --bytes /swapfile 2>/dev/null | awk '{print int($1/1024/1024)}') -lt 512 ]; then
        echo "📦 Creating swap file..."
        # Try to create swap file with better error handling
        if sudo fallocate -l 1G /swapfile 2>/dev/null; then
            echo "✅ Swap file allocated using fallocate"
        elif sudo dd if=/dev/zero of=/swapfile bs=512M count=1 2>/dev/null; then
            echo "✅ Swap file allocated using dd"
        else
            echo "⚠️  Failed to create swap file, continuing anyway..."
        fi
        
        if [ -f /swapfile ]; then
            sudo chmod 600 /swapfile || true
            sudo mkswap /swapfile 2>/dev/null || true
            sudo swapon /swapfile 2>/dev/null || true
            echo "✅ Swap file configured"
        fi
    else
        echo "✅ Swap file already exists"
        sudo swapon /swapfile 2>/dev/null || true
    fi
fi

# Clear Next.js cache
echo "🧹 Clearing Next.js cache..."
rm -rf .next
rm -rf node_modules/.cache

# Install/update dependencies with timeout and verbose output
echo "📦 Installing frontend dependencies..."
echo "⏱️  This may take a few minutes..."
echo "📊 Starting at $(date)"

# Try npm ci first with verbose output
if timeout 600 npm ci --prefer-offline --no-audit --loglevel=info 2>&1 | tee /tmp/npm-install.log; then
    echo "✅ npm ci completed successfully"
else
    EXIT_CODE=${PIPESTATUS[0]}
    echo "⚠️  npm ci failed with exit code $EXIT_CODE"
    echo "📋 Last 50 lines of npm output:"
    tail -50 /tmp/npm-install.log || true
    
    if [ $EXIT_CODE -eq 124 ]; then
        echo "⏱️  npm ci timed out after 10 minutes"
    fi
    
    echo "🔄 Trying npm install as fallback..."
    if timeout 600 npm install --prefer-offline --no-audit --loglevel=info 2>&1 | tee /tmp/npm-install.log; then
        echo "✅ npm install completed successfully"
    else
        INSTALL_EXIT_CODE=${PIPESTATUS[0]}
        echo "❌ npm install also failed with exit code $INSTALL_EXIT_CODE"
        echo "📋 Last 50 lines of npm output:"
        tail -50 /tmp/npm-install.log || true
        exit 1
    fi
fi

echo "📊 Completed at $(date)"

# Build frontend with memory limit and API URL
echo "🏗️  Building frontend..."
echo "⏱️  This may take several minutes..."
echo "📊 Starting build at $(date)"
export NEXT_PUBLIC_API_URL="http://15.206.84.110:8000"
export NODE_OPTIONS="--max-old-space-size=1024"

# Run build with timeout and capture output
if timeout 1200 npm run build 2>&1 | tee /tmp/npm-build.log; then
    echo "✅ Frontend build completed successfully"
    echo "📊 Build completed at $(date)"
else
    BUILD_EXIT_CODE=${PIPESTATUS[0]}
    echo "❌ Frontend build failed with exit code $BUILD_EXIT_CODE"
    if [ $BUILD_EXIT_CODE -eq 124 ]; then
        echo "⏱️  Build timed out after 20 minutes"
    fi
    echo "📋 Last 100 lines of build output:"
    tail -100 /tmp/npm-build.log || true
    exit 1
fi

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

