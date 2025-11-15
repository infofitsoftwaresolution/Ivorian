# Step-by-Step Setup Commands

Run these commands **one at a time** on your EC2 server. Wait for each command to complete before running the next one.

## Step 1: SSH into your EC2 server

```bash
ssh ubuntu@65.2.122.123
```

---

## Step 2: Update system packages

```bash
sudo apt-get update
```

---

## Step 3: Upgrade system packages

```bash
sudo apt-get upgrade -y
```

---

## Step 4: Install Python 3.11 and dependencies

```bash
sudo apt-get install -y python3.11 python3.11-venv python3.11-dev python3-pip build-essential libpq-dev
```

---

## Step 5: Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
```

---

## Step 6: Install Node.js packages

```bash
sudo apt-get install -y nodejs
```

---

## Step 7: Verify Node.js installation

```bash
node --version
```

(Should show v20.x.x)

---

## Step 8: Install Redis

```bash
sudo apt-get install -y redis-server
```

---

## Step 9: Start and enable Redis

```bash
sudo systemctl enable redis-server
```

---

## Step 10: Start Redis service

```bash
sudo systemctl start redis-server
```

---

## Step 11: Install Nginx

```bash
sudo apt-get install -y nginx
```

---

## Step 12: Install additional tools

```bash
sudo apt-get install -y git curl htop ufw fail2ban postgresql-client
```

---

## Step 13: Configure firewall - Enable UFW

```bash
sudo ufw --force enable
```

---

## Step 14: Allow SSH port

```bash
sudo ufw allow 22/tcp
```

---

## Step 15: Allow HTTP port

```bash
sudo ufw allow 80/tcp
```

---

## Step 16: Allow HTTPS port

```bash
sudo ufw allow 443/tcp
```

---

## Step 17: Allow Backend port

```bash
sudo ufw allow 8000/tcp
```

---

## Step 18: Allow Frontend port

```bash
sudo ufw allow 3000/tcp
```

---

## Step 19: Check firewall status

```bash
sudo ufw status
```

---

## Step 20: Create deployment directory

```bash
mkdir -p /home/ubuntu/lms-app
```

---

## Step 21: Navigate to deployment directory

```bash
cd /home/ubuntu/lms-app
```

---

## Step 22: Clone the repository

```bash
git clone https://github.com/infofitsoftwaresolution/Ivorian.git .
```

---

## Step 23: Navigate to backend directory

```bash
cd /home/ubuntu/lms-app/lms_backend
```

---

## Step 24: Create Python virtual environment

```bash
python3.11 -m venv venv
```

---

## Step 25: Activate virtual environment

```bash
source venv/bin/activate
```

---

## Step 26: Upgrade pip

```bash
pip install --upgrade pip
```

---

## Step 27: Install backend dependencies

```bash
pip install -r requirements.txt
```

(This may take a few minutes)

---

## Step 28: Navigate to frontend directory

```bash
cd /home/ubuntu/lms-app/lms_frontend
```

---

## Step 29: Install frontend dependencies

```bash
npm install
```

(This may take a few minutes)

---

## Step 30: Navigate back to root directory

```bash
cd /home/ubuntu/lms-app
```

---

## Step 31: Create .env file

```bash
nano .env
```

---

## Step 32: Paste this content in nano editor

Copy and paste this entire block:

```env
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
```

---

## Step 33: Generate a secure SECRET_KEY

In a new terminal (keep nano open), run:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copy the output.

---

## Step 34: Update SECRET_KEY in .env file

In nano editor:
1. Find the line: `SECRET_KEY=CHANGE-THIS-TO-A-RANDOM-SECRET-KEY-MIN-32-CHARACTERS`
2. Replace `CHANGE-THIS-TO-A-RANDOM-SECRET-KEY-MIN-32-CHARACTERS` with the value from Step 33
3. Press `Ctrl+X` to exit
4. Press `Y` to save
5. Press `Enter` to confirm

---

## Step 35: Create backend systemd service file

```bash
sudo nano /etc/systemd/system/lms-backend.service
```

---

## Step 36: Paste backend service configuration

Copy and paste this entire block:

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

Press `Ctrl+X`, then `Y`, then `Enter` to save.

---

## Step 37: Create frontend systemd service file

```bash
sudo nano /etc/systemd/system/lms-frontend.service
```

---

## Step 38: Paste frontend service configuration

Copy and paste this entire block:

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

Press `Ctrl+X`, then `Y`, then `Enter` to save.

---

## Step 39: Reload systemd daemon

```bash
sudo systemctl daemon-reload
```

---

## Step 40: Enable backend service

```bash
sudo systemctl enable lms-backend
```

---

## Step 41: Enable frontend service

```bash
sudo systemctl enable lms-frontend
```

---

## Step 42: Create Nginx configuration file

```bash
sudo nano /etc/nginx/sites-available/lms
```

---

## Step 43: Paste Nginx configuration

Copy and paste this entire block:

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

Press `Ctrl+X`, then `Y`, then `Enter` to save.

---

## Step 44: Enable Nginx site

```bash
sudo ln -sf /etc/nginx/sites-available/lms /etc/nginx/sites-enabled/
```

---

## Step 45: Remove default Nginx site

```bash
sudo rm -f /etc/nginx/sites-enabled/default
```

---

## Step 46: Test Nginx configuration

```bash
sudo nginx -t
```

(Should show "syntax is ok" and "test is successful")

---

## Step 47: Restart Nginx

```bash
sudo systemctl restart nginx
```

---

## Step 48: Enable Nginx to start on boot

```bash
sudo systemctl enable nginx
```

---

## Step 49: Navigate to frontend directory

```bash
cd /home/ubuntu/lms-app/lms_frontend
```

---

## Step 50: Load environment variables

```bash
export $(cat ../.env | grep -v '^#' | xargs) 2>/dev/null || true
```

---

## Step 51: Build frontend

```bash
npm run build
```

(This may take a few minutes)

---

## Step 52: Navigate to backend directory

```bash
cd /home/ubuntu/lms-app/lms_backend
```

---

## Step 53: Activate virtual environment

```bash
source venv/bin/activate
```

---

## Step 54: Load environment variables for backend

```bash
export $(cat ../.env | grep -v '^#' | xargs) 2>/dev/null || true
```

---

## Step 55: Run database migrations

```bash
alembic upgrade head
```

---

## Step 56: Start backend service

```bash
sudo systemctl start lms-backend
```

---

## Step 57: Start frontend service

```bash
sudo systemctl start lms-frontend
```

---

## Step 58: Wait a few seconds for services to start

```bash
sleep 10
```

---

## Step 59: Check backend service status

```bash
sudo systemctl status lms-backend
```

(Press `q` to exit if it looks good)

---

## Step 60: Check frontend service status

```bash
sudo systemctl status lms-frontend
```

(Press `q` to exit if it looks good)

---

## Step 61: Test backend health endpoint

```bash
curl http://localhost:8000/health
```

(Should return a JSON response)

---

## Step 62: Test frontend

```bash
curl http://localhost:3000
```

(Should return HTML)

---

## ✅ Setup Complete!

Your application should now be running. Access it at:

- **Frontend**: http://65.2.122.123
- **Backend API**: http://65.2.122.123:8000
- **Health Check**: http://65.2.122.123:8000/health

---

## Useful Commands for Later

```bash
# View backend logs
sudo journalctl -u lms-backend -f

# View frontend logs
sudo journalctl -u lms-frontend -f

# Restart backend
sudo systemctl restart lms-backend

# Restart frontend
sudo systemctl restart lms-frontend

# Check service status
sudo systemctl status lms-backend
sudo systemctl status lms-frontend
```

---

## Troubleshooting

If any step fails:

1. **Check logs**: `sudo journalctl -u lms-backend -n 50`
2. **Verify .env file**: `cat /home/ubuntu/lms-app/.env`
3. **Check RDS security group**: Ensure port 5432 is open for EC2
4. **Test database connection**: `./deploy/verify-db-connection.sh`

