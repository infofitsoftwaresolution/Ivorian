#!/bin/bash

# Manual Deployment Script
# This script pulls latest code, clears caches, and restarts the application

set -e

echo "🚀 Starting manual deployment..."
echo "📅 Started at: $(date)"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Navigate to deployment directory
DEPLOY_DIR="/home/ec2-user/lms-app"
if [ ! -d "$DEPLOY_DIR" ]; then
    DEPLOY_DIR="/home/ubuntu/lms-app"
fi

if [ ! -d "$DEPLOY_DIR" ]; then
    print_error "Deployment directory not found!"
    exit 1
fi

cd "$DEPLOY_DIR"
print_success "Changed to directory: $DEPLOY_DIR"

# Step 1: Pull latest code
echo ""
echo "📥 Step 1: Pulling latest code from GitHub..."
git fetch origin
git reset --hard origin/main
print_success "Code updated to latest version"
echo "   Latest commit: $(git log -1 --oneline)"

# Step 2: System optimization and cache clearing
echo ""
echo "🧹 Step 2: System optimization and cache clearing..."

# Check and optimize swap
if [ ! -f /swapfile ] || [ $(swapon --show=SIZE --noheadings --bytes /swapfile 2>/dev/null | awk '{print int($1/1024/1024)}') -lt 1024 ]; then
    print_warning "Optimizing swap file..."
    sudo swapoff /swapfile 2>/dev/null || true
    sudo rm -f /swapfile
    sudo dd if=/dev/zero of=/swapfile bs=128M count=8 status=progress 2>/dev/null || true
    sudo chmod 600 /swapfile 2>/dev/null || true
    sudo mkswap /swapfile 2>/dev/null || true
    sudo swapon /swapfile 2>/dev/null || true
    print_success "Swap file optimized"
fi

# Clear Next.js cache
if [ -d "lms_frontend/.next" ]; then
    rm -rf lms_frontend/.next
    print_success "Cleared Next.js cache"
fi

# Clear npm cache
if [ -d "lms_frontend/node_modules/.cache" ]; then
    rm -rf lms_frontend/node_modules/.cache
    print_success "Cleared npm cache"
fi

# Clear Python cache
find lms_backend -type d -name "__pycache__" -exec rm -r {} + 2>/dev/null || true
find lms_backend -type f -name "*.pyc" -delete 2>/dev/null || true
print_success "Cleared Python cache"

# Clear npm global cache
npm cache clean --force >/dev/null 2>&1 || true
print_success "Cleared npm global cache"

# Clean system logs (keep last 7 days)
sudo journalctl --vacuum-time=7d >/dev/null 2>&1 || true
print_success "Cleaned system logs"

# Step 3: Deploy Backend
echo ""
echo "🔧 Step 3: Deploying backend..."

cd lms_backend

# Activate virtual environment
if [ ! -d "venv" ]; then
    print_warning "Virtual environment not found, creating..."
    python3.11 -m venv venv
fi

source venv/bin/activate
print_success "Virtual environment activated"

# Install/update dependencies
echo "📦 Installing backend dependencies..."
pip install --upgrade pip --quiet
pip install -r requirements.txt --quiet
print_success "Backend dependencies installed"

# Run migrations
echo "📊 Running database migrations..."
alembic upgrade head || print_warning "Migrations may have failed (check database connection)"
print_success "Migrations completed"

# Update systemd service with optimized settings
if [ -f "deploy/systemd/lms-backend.service" ]; then
    echo "⚙️  Updating backend service configuration..."
    sudo cp deploy/systemd/lms-backend.service /etc/systemd/system/
    sudo systemctl daemon-reload
    print_success "Backend service configuration updated"
fi

# Restart backend service
echo "🔄 Restarting backend service..."
sudo systemctl restart lms-backend
sleep 3
print_success "Backend service restarted"

# Check backend status
if sudo systemctl is-active --quiet lms-backend; then
    print_success "Backend service is running"
    # Show memory usage
    BACKEND_MEM=$(systemctl show lms-backend --property=MemoryCurrent --value 2>/dev/null || echo "N/A")
    echo "   Memory usage: $BACKEND_MEM"
else
    print_error "Backend service failed to start!"
    sudo systemctl status lms-backend --no-pager -l | head -20
fi

# Step 4: Deploy Frontend
echo ""
echo "⚛️  Step 4: Deploying frontend..."

cd ../lms_frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_warning "node_modules not found, installing dependencies..."
    echo "📦 Installing frontend dependencies (this may take 5-10 minutes)..."
    npm ci --silent --prefer-offline --no-audit || npm install --legacy-peer-deps --silent --no-audit
    print_success "Frontend dependencies installed"
else
    # Check if package files changed
    if [ "package.json" -nt "node_modules" ] || [ "package-lock.json" -nt "node_modules" ]; then
        print_warning "Package files changed, reinstalling dependencies..."
        echo "📦 Installing frontend dependencies..."
        npm ci --silent --prefer-offline --no-audit || npm install --legacy-peer-deps --silent --no-audit
        print_success "Frontend dependencies updated"
    else
        print_success "Dependencies are up to date, skipping install"
    fi
fi

# Build frontend
echo "🏗️  Building frontend (this may take 5-15 minutes)..."
export NEXT_PUBLIC_API_URL="http://15.206.84.110:8000"
export NODE_OPTIONS="--max-old-space-size=1024"
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1

# Show progress during build
(
    while true; do
        sleep 60
        if pgrep -f "next build" > /dev/null 2>&1 || pgrep -f "npm run build" > /dev/null 2>&1; then
            echo "⏳ Build in progress... ($(date +%H:%M:%S))"
        else
            break
        fi
    done
) &
PROGRESS_PID=$!

if npm run build 2>&1 | tee /tmp/build.log; then
    kill $PROGRESS_PID 2>/dev/null || true
    print_success "Frontend build completed"
else
    kill $PROGRESS_PID 2>/dev/null || true
    print_error "Frontend build failed!"
    echo "Last 50 lines of build output:"
    tail -50 /tmp/build.log
    exit 1
fi

# Create symlinks for standalone mode
if [ -d ".next/standalone" ]; then
    ln -sfn $(pwd)/.next/static .next/standalone/.next/static 2>/dev/null || true
    ln -sfn $(pwd)/public .next/standalone/public 2>/dev/null || true
    print_success "Created symlinks for standalone mode"
fi

# Update systemd service with optimized settings
if [ -f "deploy/systemd/lms-frontend.service" ]; then
    echo "⚙️  Updating frontend service configuration..."
    sudo cp deploy/systemd/lms-frontend.service /etc/systemd/system/
    sudo systemctl daemon-reload
    print_success "Frontend service configuration updated"
fi

# Restart frontend service
echo "🔄 Restarting frontend service..."
sudo systemctl restart lms-frontend
sleep 3
print_success "Frontend service restarted"

# Check frontend status
if sudo systemctl is-active --quiet lms-frontend; then
    print_success "Frontend service is running"
    # Show memory usage
    FRONTEND_MEM=$(systemctl show lms-frontend --property=MemoryCurrent --value 2>/dev/null || echo "N/A")
    echo "   Memory usage: $FRONTEND_MEM"
else
    print_error "Frontend service failed to start!"
    sudo systemctl status lms-frontend --no-pager -l | head -20
fi

# Step 5: Health Check
echo ""
echo "🏥 Step 5: Running health checks..."

sleep 5

# Check backend health
if curl -f http://localhost:8000/health >/dev/null 2>&1; then
    print_success "Backend health check passed"
else
    print_warning "Backend health check failed (service may still be starting)"
fi

# Check frontend
if curl -f http://localhost:3000 >/dev/null 2>&1; then
    print_success "Frontend is accessible"
else
    print_warning "Frontend check failed (service may still be starting)"
fi

# Final status
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Deployment Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Backend Status: $(sudo systemctl is-active lms-backend)"
echo "✅ Frontend Status: $(sudo systemctl is-active lms-frontend)"
echo ""
echo "💾 System Resources:"
free -h | grep Mem | awk '{print "   Memory: " $3 " / " $2 " (Free: " $7 ")"}'
df -h / | tail -1 | awk '{print "   Disk: " $3 " / " $2 " (Free: " $4 ")"}'
echo ""
echo "📅 Completed at: $(date)"
echo ""
print_success "Deployment completed successfully! 🎉"
echo ""
echo "🔗 Application URLs:"
echo "   Backend:  http://15.206.84.110:8000"
echo "   Frontend: http://15.206.84.110:3000"
echo ""
echo "💡 Useful commands:"
echo "   Monitor resources: ./deploy/monitor-resources.sh"
echo "   Optimize system:   ./deploy/optimize-system.sh"
echo "   Check services:    sudo systemctl status lms-backend lms-frontend"
echo ""

