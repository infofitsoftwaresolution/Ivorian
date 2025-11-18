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
    
    # Fix BACKEND_CORS_ORIGINS format - remove any existing and add correct format with domain
    if grep -q "^BACKEND_CORS_ORIGINS=" lms_backend/.env 2>/dev/null; then
        # Remove existing BACKEND_CORS_ORIGINS line
        sed -i '/^BACKEND_CORS_ORIGINS=/d' lms_backend/.env
    fi
    # Add correct format with edumentry.com domain
    echo 'BACKEND_CORS_ORIGINS=["http://localhost:3000","http://localhost:8080","http://127.0.0.1:3000","http://15.206.84.110:3000","https://15.206.84.110:3000","https://edumentry.com","http://edumentry.com","https://www.edumentry.com","http://www.edumentry.com"]' >> lms_backend/.env
    echo "✅ Updated BACKEND_CORS_ORIGINS with edumentry.com domain"
else
    # Create .env file if it doesn't exist
    echo "Creating lms_backend/.env file..."
    touch lms_backend/.env
    echo "AWS_REGION=ap-south-1" >> lms_backend/.env
    echo "AWS_S3_BUCKET=infofitlabs-lms-videos" >> lms_backend/.env
    echo 'BACKEND_CORS_ORIGINS=["http://localhost:3000","http://localhost:8080","http://127.0.0.1:3000","http://15.206.84.110:3000","https://15.206.84.110:3000","https://edumentry.com","http://edumentry.com","https://www.edumentry.com","http://www.edumentry.com"]' >> lms_backend/.env
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

# Ensure frontend .env.local file has correct API URL
echo "🔧 Checking frontend environment configuration..."
if [ -f .env.local ]; then
    # Update or add NEXT_PUBLIC_API_URL if needed
    if grep -q "^NEXT_PUBLIC_API_URL=" .env.local 2>/dev/null; then
        # Check if it's already set to production URL, if not update it
        if ! grep -q "edumentry.com" .env.local 2>/dev/null; then
            # Keep existing value if it's not localhost (might be custom)
            if ! grep -q "localhost:8000" .env.local 2>/dev/null; then
                echo "ℹ️  NEXT_PUBLIC_API_URL already set to custom value, keeping it"
            else
                # Update localhost to production URL
                sed -i 's|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=https://edumentry.com/api|' .env.local
                echo "✅ Updated NEXT_PUBLIC_API_URL to production domain"
            fi
        fi
    else
        # Add NEXT_PUBLIC_API_URL if not present
        echo "NEXT_PUBLIC_API_URL=https://edumentry.com/api" >> .env.local
        echo "✅ Added NEXT_PUBLIC_API_URL to .env.local"
    fi
else
    # Create .env.local if it doesn't exist
    echo "Creating .env.local file..."
    touch .env.local
    echo "NEXT_PUBLIC_API_URL=https://edumentry.com/api" >> .env.local
    echo "✅ Created .env.local with production API URL"
fi

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

# Clear Next.js cache (only if needed)
echo "🧹 Preparing build environment..."
# Only clear .next if it exists and is old (older than 1 day)
if [ -d ".next" ]; then
    if find .next -type f -mtime +1 | grep -q .; then
        echo "🗑️  Clearing stale Next.js cache..."
        rm -rf .next
    else
        echo "✅ Using recent .next cache"
    fi
fi
rm -rf node_modules/.cache

# Install/update dependencies - Optimized approach
echo "📦 Installing frontend dependencies..."
echo "📊 Starting at $(date)"

# Check if we can skip install (smart caching)
SKIP_INSTALL=false
if [ -d "node_modules" ] && [ -f "package-lock.json" ]; then
    # Check if package files changed
    if [ "package.json" -nt "node_modules" ] || [ "package-lock.json" -nt "node_modules" ]; then
        echo "📝 Package files changed, will reinstall"
    else
        echo "✅ Dependencies up to date, skipping install"
        SKIP_INSTALL=true
    fi
fi

if [ "$SKIP_INSTALL" = false ]; then
    # Optimize npm settings for faster installs
    export npm_config_progress=false
    export npm_config_loglevel=error
    export npm_config_prefer_offline=true
    export npm_config_audit=false
    export npm_config_fund=false
    
    # Configure npm for better performance
    npm config set prefer-offline true
    npm config set audit false
    npm config set fund false
    npm config set progress false
    
    # Quick registry check (non-blocking)
    echo "🌐 Checking npm registry..."
    timeout 5 npm ping >/dev/null 2>&1 || echo "⚠️  Registry check skipped"
    
    # Install with optimized settings
    echo "📥 Installing dependencies (this may take 5-10 minutes)..."
    
    # Progress monitor
    (
        COUNTER=0
        while [ $COUNTER -lt 20 ]; do  # Max 20 checks (10 minutes)
            sleep 30
            if pgrep -f "npm" > /dev/null 2>&1; then
                COUNTER=$((COUNTER + 1))
                echo "⏳ Still installing... ($(date +%H:%M:%S)) [Check $COUNTER/20]"
            else
                break
            fi
        done
    ) &
    MONITOR_PID=$!
    
    # Try npm ci first (faster and more reliable)
    if timeout 600 npm ci --silent 2>&1 | tee /tmp/npm-install.log; then
        kill $MONITOR_PID 2>/dev/null || true
        wait $MONITOR_PID 2>/dev/null || true
        echo "✅ Dependencies installed successfully"
    else
        kill $MONITOR_PID 2>/dev/null || true
        wait $MONITOR_PID 2>/dev/null || true
        EXIT_CODE=${PIPESTATUS[0]}
        
        if [ $EXIT_CODE -eq 124 ]; then
            echo "⏱️  npm ci timed out"
            echo "🔄 Trying npm install with legacy peer deps..."
            timeout 600 npm install --legacy-peer-deps --silent 2>&1 | tee /tmp/npm-install.log || {
                echo "❌ Installation failed"
                tail -30 /tmp/npm-install.log
                exit 1
            }
        else
            echo "⚠️  npm ci failed (exit $EXIT_CODE), trying npm install..."
            timeout 600 npm install --legacy-peer-deps --silent 2>&1 | tee /tmp/npm-install.log || {
                echo "❌ Installation failed"
                tail -30 /tmp/npm-install.log
                exit 1
            }
        fi
        echo "✅ Dependencies installed (fallback method)"
    fi
else
    echo "⏭️  Skipped install (using cached dependencies)"
fi

echo "📊 Install completed at $(date)"

# Build frontend - Optimized
echo "🏗️  Building frontend..."
echo "📊 Starting build at $(date)"

# Set environment variables
# Use production domain from .env.local if available, otherwise fallback to IP
if [ -f .env.local ] && grep -q "edumentry.com" .env.local 2>/dev/null; then
    export NEXT_PUBLIC_API_URL="https://edumentry.com/api"
else
    export NEXT_PUBLIC_API_URL="http://15.206.84.110:8000"
fi
export NODE_OPTIONS="--max-old-space-size=1024"
export NODE_ENV=production

# Optimize Next.js build
export NEXT_TELEMETRY_DISABLED=1

# Build with progress monitoring
echo "🏗️  Starting Next.js build (this may take 5-15 minutes)..."
(
    COUNTER=0
    while [ $COUNTER -lt 30 ]; do  # Max 30 checks (30 minutes)
        sleep 60
        if pgrep -f "next build" > /dev/null 2>&1 || pgrep -f "npm run build" > /dev/null 2>&1; then
            COUNTER=$((COUNTER + 1))
            MEM_INFO=$(free -h | grep Mem | awk '{print "💾 " $3 "/" $2 " (Free: " $7 ")"}')
            echo "⏳ Build in progress... [$(date +%H:%M:%S)] $MEM_INFO"
        else
            break
        fi
    done
) &
BUILD_MONITOR_PID=$!

# Run build
if timeout 1800 npm run build 2>&1 | tee /tmp/npm-build.log; then
    kill $BUILD_MONITOR_PID 2>/dev/null || true
    wait $BUILD_MONITOR_PID 2>/dev/null || true
    echo "✅ Build completed successfully"
    echo "📊 Build finished at $(date)"
else
    kill $BUILD_MONITOR_PID 2>/dev/null || true
    wait $BUILD_MONITOR_PID 2>/dev/null || true
    BUILD_EXIT_CODE=${PIPESTATUS[0]}
    
    if [ $BUILD_EXIT_CODE -eq 124 ]; then
        echo "❌ Build timed out after 30 minutes"
    else
        echo "❌ Build failed with exit code $BUILD_EXIT_CODE"
    fi
    
    echo "📋 Build output (last 50 lines):"
    tail -50 /tmp/npm-build.log || true
    exit 1
fi

# Create symlinks for standalone mode
echo "🔗 Creating symlinks and copying public folder for standalone mode..."
ln -sfn $(pwd)/.next/static .next/standalone/.next/static 2>/dev/null || true
# Copy public folder (standalone mode doesn't always follow symlinks reliably)
rm -rf .next/standalone/public 2>/dev/null || true
cp -r $(pwd)/public .next/standalone/public 2>/dev/null || true

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

# SSL/HTTPS Check
echo ""
echo "🔒 Checking SSL/HTTPS configuration..."
if [ -f "/etc/letsencrypt/live/edumentry.com/fullchain.pem" ]; then
    echo "✅ SSL certificate found - HTTPS is configured"
    # Check if certificate is valid and not expired soon
    CERT_EXPIRY=$(sudo openssl x509 -in /etc/letsencrypt/live/edumentry.com/cert.pem -noout -enddate 2>/dev/null | cut -d= -f2)
    if [ ! -z "$CERT_EXPIRY" ]; then
        EXPIRY_EPOCH=$(date -d "$CERT_EXPIRY" +%s 2>/dev/null || echo "0")
        CURRENT_EPOCH=$(date +%s)
        DAYS_UNTIL_EXPIRY=$(( ($EXPIRY_EPOCH - $CURRENT_EPOCH) / 86400 ))
        if [ $DAYS_UNTIL_EXPIRY -lt 30 ]; then
            echo "⚠️  SSL certificate expires in $DAYS_UNTIL_EXPIRY days - renewal recommended"
        else
            echo "✅ SSL certificate valid for $DAYS_UNTIL_EXPIRY more days"
        fi
    fi
else
    echo "⚠️  SSL certificate not found - HTTPS is not configured"
    echo "📋 To set up HTTPS, run:"
    echo "   cd $DEPLOY_PATH && sudo ./deploy/setup-ssl.sh"
    echo "   Or see: deploy/SSL_SETUP_GUIDE.md"
fi

echo "✅ Deployment completed successfully!"

