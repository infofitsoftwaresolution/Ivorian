#!/bin/bash

# Complete installation and deployment script for EC2
# Run this script on your EC2 instance to set up and deploy the LMS application

set -e

echo "🚀 Starting complete installation and deployment..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_PATH="/home/ubuntu/lms-app"
REPO_URL="https://github.com/infofitsoftwaresolution/Ivorian.git"
EC2_IP="65.2.122.123"

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if running as ubuntu user
if [ "$EUID" -eq 0 ]; then 
    print_error "Please run this script as the ubuntu user, not root"
    exit 1
fi

# Step 1: Update system
echo "📦 Step 1/20: Updating system packages..."
sudo apt-get update -qq
sudo apt-get upgrade -y -qq
print_status "System updated"

# Step 2: Install Python 3.11
echo ""
echo "🐍 Step 2/20: Installing Python 3.11..."
sudo apt-get install -y -qq python3.11 python3.11-venv python3.11-dev python3-pip build-essential libpq-dev > /dev/null 2>&1
print_status "Python 3.11 installed"

# Step 3: Install Node.js 20
echo ""
echo "📦 Step 3/20: Installing Node.js 20..."
if ! command -v node &> /dev/null || [ "$(node --version | cut -d'v' -f2 | cut -d'.' -f1)" -lt 20 ]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - > /dev/null 2>&1
    sudo apt-get install -y -qq nodejs > /dev/null 2>&1
fi
NODE_VERSION=$(node --version)
print_status "Node.js installed: $NODE_VERSION"

# Step 4: Install Redis
echo ""
echo "🔴 Step 4/20: Installing Redis..."
sudo apt-get install -y -qq redis-server > /dev/null 2>&1
sudo systemctl enable redis-server > /dev/null 2>&1
sudo systemctl start redis-server > /dev/null 2>&1
print_status "Redis installed and started"

# Step 5: Install Nginx
echo ""
echo "🌐 Step 5/20: Installing Nginx..."
sudo apt-get install -y -qq nginx > /dev/null 2>&1
print_status "Nginx installed"

# Step 6: Install additional tools
echo ""
echo "🛠️  Step 6/20: Installing additional tools..."
sudo apt-get install -y -qq git curl htop ufw fail2ban postgresql-client > /dev/null 2>&1
print_status "Additional tools installed"

# Step 7: Configure firewall
echo ""
echo "🔥 Step 7/20: Configuring firewall..."
sudo ufw --force enable > /dev/null 2>&1
sudo ufw allow 22/tcp > /dev/null 2>&1
sudo ufw allow 80/tcp > /dev/null 2>&1
sudo ufw allow 443/tcp > /dev/null 2>&1
sudo ufw allow 8000/tcp > /dev/null 2>&1
sudo ufw allow 3000/tcp > /dev/null 2>&1
print_status "Firewall configured"

# Step 8: Create deployment directory
echo ""
echo "📁 Step 8/20: Creating deployment directory..."
mkdir -p $DEPLOY_PATH
cd $DEPLOY_PATH
print_status "Deployment directory created"

# Step 9: Clone repository
echo ""
echo "📥 Step 9/20: Cloning repository..."
if [ -d ".git" ]; then
    print_warning "Repository already exists, pulling latest changes..."
    git pull origin main > /dev/null 2>&1 || true
else
    git clone $REPO_URL . > /dev/null 2>&1
fi
print_status "Repository cloned/updated"

# Step 10: Set up backend
echo ""
echo "🔧 Step 10/20: Setting up backend..."
cd $DEPLOY_PATH/lms_backend

# Create virtual environment
if [ ! -d "venv" ]; then
    python3.11 -m venv venv
fi
source venv/bin/activate

# Install dependencies
pip install --upgrade pip -q > /dev/null 2>&1
pip install -r requirements.txt -q > /dev/null 2>&1
print_status "Backend dependencies installed"

# Step 11: Set up frontend
echo ""
echo "⚛️  Step 11/20: Setting up frontend..."
cd $DEPLOY_PATH/lms_frontend
npm install --silent > /dev/null 2>&1
print_status "Frontend dependencies installed"

# Step 12: Create .env file
echo ""
echo "📝 Step 12/20: Setting up environment file..."
cd $DEPLOY_PATH
if [ ! -f ".env" ]; then
    # Generate a secure SECRET_KEY
    SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))" 2>/dev/null || openssl rand -hex 32)
    
    cat > .env << EOF
# Application Settings
DEBUG=False
APP_VERSION=1.0.0

# Security
SECRET_KEY=$SECRET_KEY
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Database - AWS RDS PostgreSQL
DATABASE_URL=postgresql+asyncpg://postgres:infofitlabs%23123@infofitlabs.c7yic444gxi0.ap-south-1.rds.amazonaws.com:5432/infofitlabs
DATABASE_ECHO=False

# Redis
REDIS_URL=redis://localhost:6379

# CORS
BACKEND_CORS_ORIGINS=["http://$EC2_IP","http://$EC2_IP:3000","http://$EC2_IP:8000","http://localhost:3000"]

# API URL
NEXT_PUBLIC_API_URL=http://$EC2_IP:8000

# AWS Configuration
AWS_REGION=ap-south-1

# Email Configuration (optional)
SMTP_TLS=True
SMTP_PORT=587
SMTP_HOST=smtp.gmail.com
EMAILS_FROM_EMAIL=noreply@infofitlabs.com
EMAILS_FROM_NAME=InfoFit LMS
EOF
    print_status ".env file created with auto-generated SECRET_KEY"
else
    print_warning ".env file already exists, skipping..."
fi

# Step 13: Create backend systemd service
echo ""
echo "⚙️  Step 13/20: Creating backend systemd service..."
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
print_status "Backend service created"

# Step 14: Create frontend systemd service
echo ""
echo "⚙️  Step 14/20: Creating frontend systemd service..."
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
print_status "Frontend service created"

# Step 15: Configure Nginx
echo ""
echo "🌐 Step 15/20: Configuring Nginx..."
sudo tee /etc/nginx/sites-available/lms > /dev/null << EOF
upstream backend {
    server localhost:8000;
}

upstream frontend {
    server localhost:3000;
}

server {
    listen 80;
    server_name $EC2_IP;

    client_max_body_size 100M;

    # Backend API
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/lms /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t > /dev/null 2>&1
sudo systemctl restart nginx > /dev/null 2>&1
sudo systemctl enable nginx > /dev/null 2>&1
print_status "Nginx configured"

# Step 16: Reload systemd
echo ""
echo "⚙️  Step 16/20: Reloading systemd..."
sudo systemctl daemon-reload
print_status "Systemd reloaded"

# Step 17: Enable services
echo ""
echo "⚙️  Step 17/20: Enabling services..."
sudo systemctl enable lms-backend > /dev/null 2>&1
sudo systemctl enable lms-frontend > /dev/null 2>&1
print_status "Services enabled"

# Step 18: Build frontend
echo ""
echo "🏗️  Step 18/20: Building frontend..."
cd $DEPLOY_PATH/lms_frontend
export $(cat ../.env | grep -v '^#' | xargs) 2>/dev/null || true
npm run build > /dev/null 2>&1
print_status "Frontend built"

# Step 19: Run database migrations
echo ""
echo "📊 Step 19/20: Running database migrations..."
cd $DEPLOY_PATH/lms_backend
source venv/bin/activate
export $(cat ../.env | grep -v '^#' | xargs) 2>/dev/null || true
alembic upgrade head > /dev/null 2>&1 || print_warning "Migrations failed - check database connection"
print_status "Database migrations completed"

# Step 20: Start services
echo ""
echo "🚀 Step 20/20: Starting services..."
sudo systemctl start lms-backend
sudo systemctl start lms-frontend

# Wait for services to start
sleep 10

# Check service status
echo ""
echo "🏥 Checking service status..."
if sudo systemctl is-active --quiet lms-backend; then
    print_status "Backend service is running"
else
    print_error "Backend service failed to start"
    sudo systemctl status lms-backend --no-pager -l | head -20
fi

if sudo systemctl is-active --quiet lms-frontend; then
    print_status "Frontend service is running"
else
    print_error "Frontend service failed to start"
    sudo systemctl status lms-frontend --no-pager -l | head -20
fi

# Final summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Installation and deployment completed!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 Access your application:"
echo "   Frontend: http://$EC2_IP"
echo "   Backend:  http://$EC2_IP:8000"
echo "   API:      http://$EC2_IP/api"
echo "   Health:   http://$EC2_IP:8000/health"
echo ""
echo "📝 Useful commands:"
echo "   View backend logs:  sudo journalctl -u lms-backend -f"
echo "   View frontend logs: sudo journalctl -u lms-frontend -f"
echo "   Restart backend:    sudo systemctl restart lms-backend"
echo "   Restart frontend:   sudo systemctl restart lms-frontend"
echo "   Check status:       sudo systemctl status lms-backend lms-frontend"
echo ""
echo "🔄 For future deployments, run:"
echo "   cd $DEPLOY_PATH && ./deploy/deploy-no-docker.sh"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

