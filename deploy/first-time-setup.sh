#!/bin/bash

# First-time manual setup script for EC2 server
# Run this script on your EC2 instance to set up the application for the first time

set -e

echo "🚀 Starting first-time setup for LMS application..."
echo ""

# Check if running as root or ubuntu user
if [ "$EUID" -eq 0 ]; then 
    echo "⚠️  Please run this script as the ubuntu user, not root"
    exit 1
fi

# Set variables
DEPLOY_PATH="/home/ubuntu/lms-app"
REPO_URL="https://github.com/infofitsoftwaresolution/Ivorian.git"

# Step 1: Install prerequisites
echo "📦 Step 1: Installing prerequisites..."
sudo apt-get update
sudo apt-get install -y \
    curl \
    git \
    docker.io \
    docker-compose \
    htop \
    ufw \
    fail2ban

# Add user to docker group
sudo usermod -aG docker $USER
echo "✅ Prerequisites installed"

# Step 2: Configure firewall
echo ""
echo "🔥 Step 2: Configuring firewall..."
sudo ufw --force enable
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw allow 8000/tcp # Backend API
sudo ufw allow 3000/tcp # Frontend
sudo ufw status
echo "✅ Firewall configured"

# Step 3: Create deployment directory
echo ""
echo "📁 Step 3: Creating deployment directory..."
mkdir -p $DEPLOY_PATH
cd $DEPLOY_PATH
echo "✅ Directory created: $DEPLOY_PATH"

# Step 4: Clone repository
echo ""
echo "📥 Step 4: Cloning repository..."
if [ -d ".git" ]; then
    echo "⚠️  Repository already exists, pulling latest changes..."
    git pull origin main
else
    git clone $REPO_URL .
fi
echo "✅ Repository cloned"

# Step 5: Create .env file
echo ""
echo "📝 Step 5: Setting up environment file..."
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cat > .env << 'ENVEOF'
# Application Settings
DEBUG=False
APP_VERSION=1.0.0

# Security
SECRET_KEY=CHANGE-THIS-TO-A-RANDOM-SECRET-KEY-MIN-32-CHARACTERS
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Database - AWS RDS PostgreSQL
DATABASE_URL=postgresql+asyncpg://postgres:infofitlabs%23123@infofitlabs.c7yic444gxi0.ap-south-1.rds.amazonaws.com:5432/infofitlabs
DATABASE_ECHO=False

# Redis
REDIS_URL=redis://redis:6379

# CORS
BACKEND_CORS_ORIGINS=["http://65.2.122.123","http://65.2.122.123:3000","http://65.2.122.123:8000","http://localhost:3000"]

# API URL
NEXT_PUBLIC_API_URL=http://65.2.122.123:8000

# AWS Configuration
AWS_REGION=ap-south-1

# Email Configuration (optional)
SMTP_TLS=True
SMTP_PORT=587
SMTP_HOST=smtp.gmail.com
EMAILS_FROM_EMAIL=noreply@infofitlabs.com
EMAILS_FROM_NAME=InfoFit LMS
ENVEOF
    echo "✅ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env file and update SECRET_KEY with a random value:"
    echo "   nano $DEPLOY_PATH/.env"
    echo ""
    read -p "Press Enter after you've updated the SECRET_KEY in .env file..."
else
    echo "✅ .env file already exists"
fi

# Step 6: Make scripts executable
echo ""
echo "🔧 Step 6: Making scripts executable..."
chmod +x deploy/*.sh 2>/dev/null || true
echo "✅ Scripts made executable"

# Step 7: Verify database connection
echo ""
echo "🔍 Step 7: Verifying database connection..."
if [ -f "deploy/verify-db-connection.sh" ]; then
    chmod +x deploy/verify-db-connection.sh
    echo "Running database connection test..."
    ./deploy/verify-db-connection.sh || echo "⚠️  Database connection test failed - please check RDS security group"
else
    echo "⚠️  Database verification script not found, skipping..."
fi

# Step 8: Build and start services
echo ""
echo "🐳 Step 8: Building and starting Docker containers..."
echo "This may take several minutes..."

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Build and start
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

echo ""
echo "⏳ Waiting for services to start..."
sleep 30

# Step 9: Run database migrations
echo ""
echo "📊 Step 9: Running database migrations..."
docker-compose -f docker-compose.prod.yml exec -T backend alembic upgrade head || echo "⚠️  Migrations failed - check database connection"

# Step 10: Check service status
echo ""
echo "🏥 Step 10: Checking service status..."
docker-compose -f docker-compose.prod.yml ps

# Step 11: Show logs
echo ""
echo "📋 Recent logs:"
docker-compose -f docker-compose.prod.yml logs --tail=20

# Final instructions
echo ""
echo "✅ First-time setup completed!"
echo ""
echo "📍 Access your application:"
echo "   Frontend: http://65.2.122.123:3000"
echo "   Backend:  http://65.2.122.123:8000"
echo "   Health:   http://65.2.122.123:8000/health"
echo ""
echo "📝 Useful commands:"
echo "   View logs:    docker-compose -f docker-compose.prod.yml logs -f"
echo "   Restart:      docker-compose -f docker-compose.prod.yml restart"
echo "   Stop:         docker-compose -f docker-compose.prod.yml down"
echo "   Status:       docker-compose -f docker-compose.prod.yml ps"
echo ""
echo "🔄 For future deployments, the CI/CD pipeline will handle updates automatically"
echo "   when you push to the main branch."

