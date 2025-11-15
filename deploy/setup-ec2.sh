#!/bin/bash

set -e

echo "🔧 Setting up EC2 server for LMS deployment..."

# Update system
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo "✅ Docker installed successfully"
else
    echo "✅ Docker already installed"
fi

# Install Docker Compose
echo "🐙 Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose installed successfully"
else
    echo "✅ Docker Compose already installed"
fi

# Install required tools
echo "🛠️ Installing additional tools..."
sudo apt-get install -y \
    curl \
    git \
    htop \
    ufw \
    fail2ban \
    unattended-upgrades

# Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw --force enable
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw allow 8000/tcp # Backend API (if direct access needed)
sudo ufw allow 3000/tcp # Frontend (if direct access needed)
sudo ufw status

# Create deployment directory
echo "📁 Creating deployment directory..."
mkdir -p /home/ubuntu/lms-app
mkdir -p /home/ubuntu/lms-app/deploy/ssl

# Set permissions
sudo chown -R ubuntu:ubuntu /home/ubuntu/lms-app

# Create .env file template
echo "📝 Creating .env template..."
cat > /home/ubuntu/lms-app/.env.example << 'EOF'
# Application Settings
DEBUG=False
APP_VERSION=1.0.0

# Security
SECRET_KEY=change-this-to-a-random-secret-key-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Database - AWS RDS PostgreSQL
DATABASE_URL=postgresql+asyncpg://postgres:infofitlabs%23123@infofitlabs.c7yic444gxi0.ap-south-1.rds.amazonaws.com:5432/infofitlabs
DATABASE_ECHO=False

# Redis
REDIS_URL=redis://redis:6379

# CORS
BACKEND_CORS_ORIGINS=["http://65.2.122.123","http://65.2.122.123:3000","http://65.2.122.123:8000"]

# API URL
NEXT_PUBLIC_API_URL=http://65.2.122.123:8000

# AWS Configuration (if needed)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=

# AI Services (if needed)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Email Configuration (if needed)
SMTP_TLS=True
SMTP_PORT=587
SMTP_HOST=smtp.gmail.com
SMTP_USER=
SMTP_PASSWORD=
EMAILS_FROM_EMAIL=noreply@infofitlabs.com
EMAILS_FROM_NAME=InfoFit LMS

# Payment Gateway (if needed)
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=

# Monitoring (if needed)
SENTRY_DSN=
EOF

echo "✅ EC2 server setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Copy your .env file to /home/ubuntu/lms-app/.env"
echo "2. Update the .env file with your actual configuration"
echo "3. Set up SSH key for GitHub Actions deployment"
echo "4. Run the deployment script when code is pushed"

