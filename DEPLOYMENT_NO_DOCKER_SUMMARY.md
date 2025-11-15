# Non-Docker Deployment Summary

## ✅ What's Been Set Up

I've updated the CI/CD pipeline to deploy **without Docker**. The application will run directly on the EC2 server using:

- **Python 3.11** with virtual environment for backend
- **Node.js 20** for frontend
- **systemd** services to manage processes
- **Nginx** as reverse proxy
- **Redis** for caching

## 📁 New Files Created

1. **`deploy/setup-ec2-no-docker.sh`** - Automated first-time setup script
2. **`deploy/deploy-no-docker.sh`** - Deployment script for CI/CD
3. **`.github/workflows/deploy-no-docker.yml`** - CI/CD workflow (active)
4. **`FIRST_TIME_SETUP_NO_DOCKER.md`** - Complete setup guide
5. **`.github/workflows/deploy.yml`** - Docker workflow (disabled)

## 🚀 Quick Start

### First-Time Setup

```bash
ssh ubuntu@65.2.122.123
curl -o setup-ec2-no-docker.sh https://raw.githubusercontent.com/infofitsoftwaresolution/Ivorian/main/deploy/setup-ec2-no-docker.sh
chmod +x setup-ec2-no-docker.sh
./setup-ec2-no-docker.sh
```

The script will:
- ✅ Install Python 3.11, Node.js 20, Redis, Nginx
- ✅ Clone repository
- ✅ Set up virtual environment
- ✅ Install dependencies
- ✅ Create systemd services
- ✅ Configure Nginx
- ✅ Build frontend
- ✅ Run migrations
- ✅ Start all services

## 📋 Architecture

```
┌─────────────────┐
│   Nginx (80)    │ ← Reverse Proxy
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────┐
│Frontend│ │Backend│
│ :3000  │ │ :8000 │
└────────┘ └───────┘
              │
         ┌────┴────┐
         │         │
    ┌────▼───┐ ┌──▼────┐
    │  Redis │ │  RDS  │
    │ :6379  │ │ :5432 │
    └────────┘ └───────┘
```

## 🔧 Services

### Backend Service
- **Service**: `lms-backend.service`
- **Command**: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
- **Location**: `/home/ubuntu/lms-app/lms_backend`
- **Virtual Env**: `/home/ubuntu/lms-app/lms_backend/venv`

### Frontend Service
- **Service**: `lms-frontend.service`
- **Command**: `npm start` (production mode)
- **Location**: `/home/ubuntu/lms-app/lms_frontend`

### Nginx
- **Config**: `/etc/nginx/sites-available/lms`
- **Port**: 80 (HTTP)
- **Proxies**: Frontend (3000) and Backend (8000)

## 📝 Useful Commands

```bash
# View logs
sudo journalctl -u lms-backend -f
sudo journalctl -u lms-frontend -f

# Restart services
sudo systemctl restart lms-backend
sudo systemctl restart lms-frontend

# Check status
sudo systemctl status lms-backend
sudo systemctl status lms-frontend

# Run migrations
cd /home/ubuntu/lms-app/lms_backend
source venv/bin/activate
alembic upgrade head
```

## 🔄 CI/CD Pipeline

The CI/CD pipeline (`.github/workflows/deploy-no-docker.yml`) will:

1. ✅ Run tests (backend + frontend)
2. ✅ SSH to EC2
3. ✅ Pull latest code
4. ✅ Run `deploy-no-docker.sh` script
5. ✅ Restart services
6. ✅ Health check

## 📍 Access Points

- **Frontend**: http://65.2.122.123
- **Backend API**: http://65.2.122.123:8000
- **API via Nginx**: http://65.2.122.123/api
- **Health Check**: http://65.2.122.123:8000/health

## 🔐 Security

- ✅ Firewall configured (UFW)
- ✅ Services run as `ubuntu` user (not root)
- ✅ Environment variables in `.env` file
- ✅ Nginx as reverse proxy
- ✅ Fail2ban installed

## 📚 Documentation

- **`FIRST_TIME_SETUP_NO_DOCKER.md`** - Complete first-time setup guide
- **`deploy/setup-ec2-no-docker.sh`** - Automated setup script
- **`deploy/deploy-no-docker.sh`** - Deployment script
- **`.github/workflows/deploy-no-docker.yml`** - CI/CD workflow

## ⚠️ Important Notes

1. **SECRET_KEY**: Must be updated in `.env` file during setup
2. **RDS Security Group**: Must allow connections from EC2 on port 5432
3. **Ports**: Ensure firewall allows 22, 80, 443, 3000, 8000
4. **Services**: Managed by systemd, auto-restart on failure

## 🐛 Troubleshooting

See `FIRST_TIME_SETUP_NO_DOCKER.md` for detailed troubleshooting guide.

Common issues:
- Service not starting → Check logs: `sudo journalctl -u lms-backend -n 50`
- Port conflicts → Check: `sudo netstat -tulpn | grep :8000`
- Database connection → Verify RDS security group
- Build failures → Check Node.js/Python versions

---

**Ready to deploy!** Run the setup script to get started.

