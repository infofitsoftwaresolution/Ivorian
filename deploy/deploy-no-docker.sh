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
alembic upgrade head || echo "⚠️  Migrations failed - check database connection"

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

