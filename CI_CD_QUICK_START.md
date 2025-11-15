# CI/CD Quick Start Guide

## ⚠️ First-Time Setup Required

**Before using CI/CD, you need to manually set up the application on EC2 for the first time.**

### Option 1: Without Docker (Recommended)

```bash
ssh ubuntu@65.2.122.123
curl -o setup-ec2-no-docker.sh https://raw.githubusercontent.com/infofitsoftwaresolution/Ivorian/main/deploy/setup-ec2-no-docker.sh
chmod +x setup-ec2-no-docker.sh
./setup-ec2-no-docker.sh
```

See `FIRST_TIME_SETUP_NO_DOCKER.md` for detailed instructions.

### Option 2: With Docker

```bash
ssh ubuntu@65.2.122.123
curl -o first-time-setup.sh https://raw.githubusercontent.com/infofitsoftwaresolution/Ivorian/main/deploy/first-time-setup.sh
chmod +x first-time-setup.sh
./first-time-setup.sh
```

See `FIRST_TIME_SETUP.md` for detailed instructions.

After the first-time setup, CI/CD will handle all future deployments automatically.

---

## 🚀 CI/CD Setup (5 Steps)

### 1. Set Up EC2 Server (One-time)

```bash
ssh ubuntu@65.2.122.123

# Run setup script
curl -o setup-ec2.sh https://raw.githubusercontent.com/infofitsoftwaresolution/Ivorian/main/deploy/setup-ec2.sh
chmod +x setup-ec2.sh
./setup-ec2.sh
```

### 2. Configure Environment

```bash
cd /home/ubuntu/lms-app
cp .env.example .env
nano .env  # Update SECRET_KEY, POSTGRES_PASSWORD, etc.
```

### 3. Generate SSH Key for GitHub Actions

```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/ec2_deploy_key -N ""
ssh-copy-id -i ~/.ssh/ec2_deploy_key.pub ubuntu@65.2.122.123
```

### 4. Add SSH Key to GitHub Secrets

1. Go to: https://github.com/infofitsoftwaresolution/Ivorian/settings/secrets/actions
2. Click "New repository secret"
3. Name: `EC2_SSH_PRIVATE_KEY`
4. Value: `cat ~/.ssh/ec2_deploy_key` (copy entire output)

### 5. Deploy!

```bash
git add .
git commit -m "Setup CI/CD"
git push origin main
```

Monitor: https://github.com/infofitsoftwaresolution/Ivorian/actions

## 📍 Access Your App

- Frontend: http://65.2.122.123:3000
- Backend: http://65.2.122.123:8000
- Health: http://65.2.122.123:8000/health

## 🔧 Manual Commands

```bash
# View logs
ssh ubuntu@65.2.122.123
cd /home/ubuntu/lms-app
docker-compose -f docker-compose.prod.yml logs -f

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Check status
docker-compose -f docker-compose.prod.yml ps
```

## 📚 Full Documentation

- `DEPLOYMENT_SETUP.md` - Detailed setup instructions
- `deploy/README.md` - Complete deployment guide
- `.github/workflows/deploy.yml` - CI/CD pipeline config

