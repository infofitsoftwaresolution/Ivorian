#!/bin/bash

set -e

echo "🚀 Starting deployment..."

# Navigate to deployment directory
cd /home/ubuntu/lms-app

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down || true

# Pull latest images (if using registry)
# docker-compose -f docker-compose.prod.yml pull

# Build and start containers
echo "🔨 Building and starting containers..."
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 30

# Run database migrations
echo "📊 Running database migrations..."
echo "⚠️  Note: Using external RDS database - ensure network connectivity"
docker-compose -f docker-compose.prod.yml exec -T backend alembic upgrade head || echo "Migrations skipped or failed - check database connection"

# Check service health
echo "🏥 Checking service health..."
docker-compose -f docker-compose.prod.yml ps

# Show logs
echo "📋 Recent logs:"
docker-compose -f docker-compose.prod.yml logs --tail=50

echo "✅ Deployment completed successfully!"

