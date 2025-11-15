# First-Time Manual Setup Guide (No Docker)

This guide explains how to set up the LMS application on EC2 **without Docker**.

## Quick Setup (Automated Script)

### Run the automated setup script

```bash
# SSH into your EC2 instance
ssh ubuntu@65.2.122.123

# Download and run the setup script
curl -o setup-ec2-no-docker.sh https://raw.githubusercontent.com/infofitsoftwaresolution/Ivorian/main/deploy/setup-ec2-no-docker.sh
chmod +x setup-ec2-no-docker.sh
./setup-ec2-no-docker.sh
```

The script will:
1. ✅ Install Python 3.11, Node.js 20, Redis, Nginx
2. ✅ Configure firewall
3. ✅ Clone the repository
4. ✅ Set up Python virtual environment
5. ✅ Install backend and frontend dependencies
6. ✅ Create systemd services
7. ✅ Configure Nginx reverse proxy
8. ✅ Build frontend
9. ✅ Run database migrations
10. ✅ Start all services

**Important**: The script will pause and ask you to update the `SECRET_KEY` in the .env file. Make sure to set a strong random key!

## Manual Setup (Step by Step)

If you prefer to do it manually:

### Step 1: SSH into EC2

```bash
ssh ubuntu@65.2.122.123
```

### Step 2: Install Prerequisites

```bash
# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Python 3.11
sudo apt-get install -y python3.11 python3.11-venv python3.11-dev python3-pip build-essential libpq-dev

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Redis
sudo apt-get install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Install Nginx
sudo apt-get install -y nginx

# Install other tools
sudo apt-get install -y git curl htop ufw fail2ban postgresql-client
```

### Step 3: Configure Firewall

```bash
sudo ufw --force enable
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw allow 8000/tcp # Backend
sudo ufw allow 3000/tcp # Frontend
sudo ufw status
```

### Step 4: Clone Repository

```bash
mkdir -p /home/ubuntu/lms-app
cd /home/ubuntu/lms-app
git clone https://github.com/infofitsoftwaresolution/Ivorian.git .
```

### Step 5: Set Up Backend

```bash
cd /home/ubuntu/lms-app/lms_backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 6: Set Up Frontend

```bash
cd /home/ubuntu/lms-app/lms_frontend
npm install
```

### Step 7: Create .env File

```bash
cd /home/ubuntu/lms-app
nano .env
```

Paste this content (update SECRET_KEY):

```env
# Application Settings
DEBUG=False
APP_VERSION=1.0.0

# Security - CHANGE THIS!
SECRET_KEY=your-very-secure-random-key-minimum-32-characters-long
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Database - AWS RDS PostgreSQL
DATABASE_URL=postgresql+asyncpg://postgres:infofitlabs%23123@infofitlabs.c7yic444gxi0.ap-south-1.rds.amazonaws.com:5432/infofitlabs
DATABASE_ECHO=False

# Redis
REDIS_URL=redis://localhost:6379

# CORS
BACKEND_CORS_ORIGINS=["http://65.2.122.123","http://65.2.122.123:3000","http://65.2.122.123:8000"]

# API URL
NEXT_PUBLIC_API_URL=http://65.2.122.123:8000

# AWS Configuration
AWS_REGION=ap-south-1
```

Generate a secure SECRET_KEY:
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Step 8: Create Systemd Service for Backend

```bash
sudo nano /etc/systemd/system/lms-backend.service
```

Paste:

```ini
[Unit]
Description=LMS Backend API
After=network.target redis.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/lms-app/lms_backend
Environment="PATH=/home/ubuntu/lms-app/lms_backend/venv/bin"
EnvironmentFile=/home/ubuntu/lms-app/.env
ExecStart=/home/ubuntu/lms-app/lms_backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable lms-backend
sudo systemctl start lms-backend
```

### Step 9: Create Systemd Service for Frontend

```bash
sudo nano /etc/systemd/system/lms-frontend.service
```

Paste:

```ini
[Unit]
Description=LMS Frontend
After=network.target lms-backend.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/lms-app/lms_frontend
Environment="NODE_ENV=production"
EnvironmentFile=/home/ubuntu/lms-app/.env
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable lms-frontend
sudo systemctl start lms-frontend
```

### Step 10: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/lms
```

Paste:

```nginx
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
```

Enable site:
```bash
sudo ln -sf /etc/nginx/sites-available/lms /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### Step 11: Build Frontend

```bash
cd /home/ubuntu/lms-app/lms_frontend
export $(cat ../.env | grep -v '^#' | xargs) 2>/dev/null || true
npm run build
```

### Step 12: Run Database Migrations

```bash
cd /home/ubuntu/lms-app/lms_backend
source venv/bin/activate
export $(cat ../.env | grep -v '^#' | xargs) 2>/dev/null || true
alembic upgrade head
```

### Step 13: Restart Services

```bash
sudo systemctl restart lms-backend
sudo systemctl restart lms-frontend
```

## Verify Installation

### Check Services

```bash
sudo systemctl status lms-backend
sudo systemctl status lms-frontend
sudo systemctl status nginx
sudo systemctl status redis-server
```

### View Logs

```bash
# Backend logs
sudo journalctl -u lms-backend -f

# Frontend logs
sudo journalctl -u lms-frontend -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Test Endpoints

```bash
# Backend health check
curl http://localhost:8000/health

# Frontend
curl http://localhost:3000

# Via Nginx
curl http://localhost/api/health
curl http://localhost
```

## Access Your Application

- **Frontend**: http://65.2.122.123
- **Backend API**: http://65.2.122.123:8000
- **API via Nginx**: http://65.2.122.123/api
- **Health Check**: http://65.2.122.123:8000/health

## Useful Commands

```bash
# View logs
sudo journalctl -u lms-backend -f
sudo journalctl -u lms-frontend -f

# Restart services
sudo systemctl restart lms-backend
sudo systemctl restart lms-frontend

# Stop services
sudo systemctl stop lms-backend lms-frontend

# Start services
sudo systemctl start lms-backend lms-frontend

# Check status
sudo systemctl status lms-backend
sudo systemctl status lms-frontend

# Run migrations
cd /home/ubuntu/lms-app/lms_backend
source venv/bin/activate
alembic upgrade head
```

## Troubleshooting

### Service Not Starting

```bash
# Check logs
sudo journalctl -u lms-backend -n 50
sudo journalctl -u lms-frontend -n 50

# Check if port is in use
sudo netstat -tulpn | grep :8000
sudo netstat -tulpn | grep :3000
```

### Database Connection Issues

1. Check RDS security group allows EC2
2. Test connection:
   ```bash
   psql -h infofitlabs.c7yic444gxi0.ap-south-1.rds.amazonaws.com -U postgres -d infofitlabs
   ```

### Frontend Build Issues

```bash
cd /home/ubuntu/lms-app/lms_frontend
rm -rf .next node_modules
npm install
npm run build
```

## After First-Time Setup

Once the application is running:

1. ✅ **CI/CD is ready**: Future pushes to `main` branch will automatically deploy
2. ✅ **Monitor deployments**: Check GitHub Actions for deployment status
3. ✅ **Manual updates**: You can still manually pull and restart:
   ```bash
   cd /home/ubuntu/lms-app
   git pull origin main
   ./deploy/deploy-no-docker.sh
   ```

---

**That's it!** Your application should now be running without Docker. The CI/CD pipeline will handle future deployments automatically.

