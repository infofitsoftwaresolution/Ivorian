#!/bin/bash

# First-time setup script for EC2 server (without Docker)
# Run this script on your EC2 instance to set up the application

set -e

echo "🚀 Starting first-time setup for LMS application (No Docker)..."
echo ""

# Check if running as root or ubuntu user
if [ "$EUID" -eq 0 ]; then 
    echo "⚠️  Please run this script as the ubuntu user, not root"
    exit 1
fi

# Set variables
DEPLOY_PATH="/home/ubuntu/lms-app"
REPO_URL="https://github.com/infofitsoftwaresolution/Ivorian.git"

# Step 1: Update system
echo "📦 Step 1: Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Step 2: Install Python 3.11 and dependencies
echo ""
echo "🐍 Step 2: Installing Python 3.11..."
sudo apt-get install -y \
    python3.11 \
    python3.11-venv \
    python3.11-dev \
    python3-pip \
    build-essential \
    libpq-dev \
    curl \
    git \
    nginx \
    supervisor \
    htop \
    ufw \
    fail2ban

# Step 3: Install Node.js 20
echo ""
echo "📦 Step 3: Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
npm --version

# Step 4: Install PostgreSQL client (for testing)
echo ""
echo "🐘 Step 4: Installing PostgreSQL client..."
sudo apt-get install -y postgresql-client

# Step 5: Install Redis
echo ""
echo "🔴 Step 5: Installing Redis..."
sudo apt-get install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Step 6: Configure firewall
echo ""
echo "🔥 Step 6: Configuring firewall..."
sudo ufw --force enable
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw allow 8000/tcp # Backend API
sudo ufw allow 3000/tcp # Frontend
sudo ufw status

# Step 7: Create deployment directory
echo ""
echo "📁 Step 7: Creating deployment directory..."
mkdir -p $DEPLOY_PATH
cd $DEPLOY_PATH

# Step 8: Clone repository
echo ""
echo "📥 Step 8: Cloning repository..."
if [ -d ".git" ]; then
    echo "⚠️  Repository already exists, pulling latest changes..."
    git pull origin main
else
    git clone $REPO_URL .
fi

# Step 9: Set up backend
echo ""
echo "🔧 Step 9: Setting up backend..."
cd $DEPLOY_PATH/lms_backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Step 10: Set up frontend
echo ""
echo "⚛️  Step 10: Setting up frontend..."
cd $DEPLOY_PATH/lms_frontend
npm install

# Step 11: Create .env file
echo ""
echo "📝 Step 11: Setting up environment file..."
cd $DEPLOY_PATH
if [ ! -f ".env" ]; then
    cat > .env << 'ENVEOF'
# Application Settings
DEBUG=False
APP_VERSION=1.0.0

# Security - CHANGE THIS!
SECRET_KEY=CHANGE-THIS-TO-A-RANDOM-SECRET-KEY-MIN-32-CHARACTERS
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Database - AWS RDS PostgreSQL
DATABASE_URL=postgresql+asyncpg://postgres:infofitlabs%23123@infofitlabs.c7yic444gxi0.ap-south-1.rds.amazonaws.com:5432/infofitlabs
DATABASE_ECHO=False

# Redis
REDIS_URL=redis://localhost:6379

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
    echo "⚠️  IMPORTANT: Please edit .env file and update SECRET_KEY:"
    echo "   nano $DEPLOY_PATH/.env"
    echo ""
    read -p "Press Enter after you've updated the SECRET_KEY in .env file..."
else
    echo "✅ .env file already exists"
fi

# Step 12: Create systemd service for backend
echo ""
echo "⚙️  Step 12: Creating systemd service for backend..."
sudo tee /etc/systemd/system/lms-backend.service > /dev/null << EOF
[Unit]
Description=LMS Backend API
After=network.target redis.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=$DEPLOY_PATH/lms_backend
Environment="PATH=$DEPLOY_PATH/lms_backend/venv/bin"
EnvironmentFile=$DEPLOY_PATH/.env
ExecStart=$DEPLOY_PATH/lms_backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Step 13: Create systemd service for frontend
echo ""
echo "⚙️  Step 13: Creating systemd service for frontend..."
sudo tee /etc/systemd/system/lms-frontend.service > /dev/null << EOF
[Unit]
Description=LMS Frontend
After=network.target lms-backend.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=$DEPLOY_PATH/lms_frontend
Environment="NODE_ENV=production"
EnvironmentFile=$DEPLOY_PATH/.env
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Step 14: Configure Nginx
echo ""
echo "🌐 Step 14: Configuring Nginx..."
sudo tee /etc/nginx/sites-available/lms > /dev/null << 'NGINXEOF'
upstream backend {
    server localhost:8000;
}

upstream frontend {
    server localhost:3000;
}

server {
    listen 80;
    server_name 65.2.122.123;

    client_max_body_size 100M;

    # Backend API
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINXEOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/lms /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

# Step 15: Build frontend
echo ""
echo "🏗️  Step 15: Building frontend..."
cd $DEPLOY_PATH/lms_frontend
export $(cat ../.env | grep -v '^#' | xargs) 2>/dev/null || true
npm run build

# Step 16: Run database migrations
echo ""
echo "📊 Step 16: Running database migrations..."
cd $DEPLOY_PATH/lms_backend
source venv/bin/activate
export $(cat ../.env | grep -v '^#' | xargs) 2>/dev/null || true
alembic upgrade head || echo "⚠️  Migrations failed - check database connection"

# Step 17: Start services
echo ""
echo "🚀 Step 17: Starting services..."
sudo systemctl daemon-reload
sudo systemctl enable lms-backend
sudo systemctl enable lms-frontend
sudo systemctl start lms-backend
sudo systemctl start lms-frontend

# Wait a bit
sleep 10

# Step 18: Check status
echo ""
echo "🏥 Step 18: Checking service status..."
sudo systemctl status lms-backend --no-pager -l
sudo systemctl status lms-frontend --no-pager -l

# Final instructions
echo ""
echo "✅ First-time setup completed!"
echo ""
echo "📍 Access your application:"
echo "   Frontend: http://65.2.122.123"
echo "   Backend:  http://65.2.122.123:8000"
echo "   API:      http://65.2.122.123/api"
echo "   Health:   http://65.2.122.123:8000/health"
echo ""
echo "📝 Useful commands:"
echo "   View backend logs:  sudo journalctl -u lms-backend -f"
echo "   View frontend logs: sudo journalctl -u lms-frontend -f"
echo "   Restart backend:    sudo systemctl restart lms-backend"
echo "   Restart frontend:   sudo systemctl restart lms-frontend"
echo "   Stop services:      sudo systemctl stop lms-backend lms-frontend"
echo "   Status:             sudo systemctl status lms-backend lms-frontend"
echo ""
echo "🔄 For future deployments, the CI/CD pipeline will handle updates automatically"

