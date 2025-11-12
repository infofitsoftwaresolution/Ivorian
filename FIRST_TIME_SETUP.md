# First-Time Manual Setup Guide

Yes, you're correct! For the first time, you need to manually set up the application on your EC2 server. After that, the CI/CD pipeline will handle automatic deployments.

## Quick Setup (Automated Script)

### Option 1: Run the automated setup script

```bash
# SSH into your EC2 instance
ssh ubuntu@65.2.122.123

# Download and run the setup script
curl -o first-time-setup.sh https://raw.githubusercontent.com/infofitsoftwaresolution/Ivorian/main/deploy/first-time-setup.sh
chmod +x first-time-setup.sh
./first-time-setup.sh
```

The script will:
1. ✅ Install Docker, Docker Compose, and required tools
2. ✅ Configure firewall
3. ✅ Clone the repository
4. ✅ Create .env file with RDS database configuration
5. ✅ Build and start all services
6. ✅ Run database migrations

**Important**: The script will pause and ask you to update the `SECRET_KEY` in the .env file. Make sure to set a strong random key!

## Manual Setup (Step by Step)

If you prefer to do it manually or the script doesn't work:

### Step 1: SSH into EC2

```bash
ssh ubuntu@65.2.122.123
```

### Step 2: Install Prerequisites

```bash
# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
rm get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install other tools
sudo apt-get install -y git curl htop ufw fail2ban

# Log out and back in for docker group to take effect
exit
# SSH back in
ssh ubuntu@65.2.122.123
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

### Step 5: Create .env File

```bash
cd /home/ubuntu/lms-app
nano .env
```

Paste this content (update SECRET_KEY with a random value):

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
REDIS_URL=redis://redis:6379

# CORS
BACKEND_CORS_ORIGINS=["http://65.2.122.123","http://65.2.122.123:3000","http://65.2.122.123:8000"]

# API URL
NEXT_PUBLIC_API_URL=http://65.2.122.123:8000

# AWS Configuration
AWS_REGION=ap-south-1
```

**Generate a secure SECRET_KEY:**
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

Save and exit (Ctrl+X, then Y, then Enter)

### Step 6: Verify RDS Security Group

**IMPORTANT**: Before proceeding, ensure your RDS security group allows connections from EC2:

1. Go to AWS Console → RDS → Databases
2. Select `infofitlabs` database
3. Click on the VPC security group
4. Edit inbound rules
5. Add rule:
   - Type: PostgreSQL
   - Port: 5432
   - Source: Your EC2 security group or IP (65.2.122.123/32)

### Step 7: Test Database Connection (Optional)

```bash
cd /home/ubuntu/lms-app
chmod +x deploy/verify-db-connection.sh
./deploy/verify-db-connection.sh
```

### Step 8: Build and Start Services

```bash
cd /home/ubuntu/lms-app

# Make scripts executable
chmod +x deploy/*.sh

# Build and start
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

### Step 9: Wait for Services to Start

```bash
# Wait a bit for services to start
sleep 30

# Check status
docker-compose -f docker-compose.prod.yml ps
```

### Step 10: Run Database Migrations

```bash
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

### Step 11: Verify Everything is Working

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs --tail=50

# Test health endpoint
curl http://localhost:8000/health
```

## Verify Installation

### Check Services

```bash
docker-compose -f docker-compose.prod.yml ps
```

You should see:
- ✅ lms_backend (running)
- ✅ lms_frontend (running)
- ✅ lms_redis (running)
- ✅ lms_nginx (running)

### Test Endpoints

```bash
# Backend health check
curl http://65.2.122.123:8000/health

# Frontend
curl http://65.2.122.123:3000
```

### Access in Browser

- **Frontend**: http://65.2.122.123:3000
- **Backend API**: http://65.2.122.123:8000
- **Health Check**: http://65.2.122.123:8000/health

## Troubleshooting

### Services Not Starting

```bash
# View logs
docker-compose -f docker-compose.prod.yml logs

# View specific service logs
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend
```

### Database Connection Issues

1. **Check RDS Security Group**: Ensure port 5432 is open for EC2
2. **Test connection**:
   ```bash
   ./deploy/verify-db-connection.sh
   ```
3. **Check DATABASE_URL** in .env file (password # should be %23)

### Port Already in Use

```bash
# Check what's using the port
sudo netstat -tulpn | grep :8000
sudo netstat -tulpn | grep :3000

# Stop conflicting services
sudo systemctl stop <service-name>
```

### Permission Issues

```bash
# Fix permissions
sudo chown -R ubuntu:ubuntu /home/ubuntu/lms-app
chmod +x /home/ubuntu/lms-app/deploy/*.sh
```

## After First-Time Setup

Once the application is running:

1. ✅ **CI/CD is ready**: Future pushes to `main` branch will automatically deploy
2. ✅ **Monitor deployments**: Check GitHub Actions for deployment status
3. ✅ **Manual updates**: You can still manually pull and restart:
   ```bash
   cd /home/ubuntu/lms-app
   git pull origin main
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

## Useful Commands

```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Stop services
docker-compose -f docker-compose.prod.yml down

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build

# Check service status
docker-compose -f docker-compose.prod.yml ps

# Run migrations
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

## Next Steps

1. ✅ Set up SSL/HTTPS (see `deploy/README.md`)
2. ✅ Configure domain name
3. ✅ Set up monitoring
4. ✅ Configure automated backups

---

**That's it!** Your application should now be running. The CI/CD pipeline will handle future deployments automatically when you push to the `main` branch.

