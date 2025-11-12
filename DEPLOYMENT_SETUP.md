# CI/CD Deployment Setup for EC2

This document provides step-by-step instructions to set up CI/CD deployment to your EC2 instance.

## Quick Start

### Step 1: Initial EC2 Server Setup

SSH into your EC2 instance and run:

```bash
ssh ubuntu@65.2.122.123

# Download and run setup script
curl -o setup-ec2.sh https://raw.githubusercontent.com/infofitsoftwaresolution/Ivorian/main/deploy/setup-ec2.sh
chmod +x setup-ec2.sh
./setup-ec2.sh

# Or manually copy the setup script from deploy/setup-ec2.sh
```

This will install:
- Docker and Docker Compose
- Required system tools
- Configure firewall
- Create deployment directory

### Step 2: Configure Environment Variables

```bash
cd /home/ubuntu/lms-app
cp .env.example .env
nano .env
```

**Required changes in .env:**
```env
SECRET_KEY=your-very-secure-random-key-here
# Database is already configured for AWS RDS
DATABASE_URL=postgresql+asyncpg://postgres:infofitlabs%23123@infofitlabs.c7yic444gxi0.ap-south-1.rds.amazonaws.com:5432/infofitlabs
DATABASE_ECHO=False
BACKEND_CORS_ORIGINS=["http://65.2.122.123","http://65.2.122.123:3000","http://65.2.122.123:8000"]
NEXT_PUBLIC_API_URL=http://65.2.122.123:8000
```

**Important**: 
- The database password contains `#` which must be URL-encoded as `%23` in the connection string
- Ensure RDS security group allows inbound connections from EC2 on port 5432

### Step 3: Set Up SSH Key for GitHub Actions

**On your local machine:**

```bash
# Generate SSH key pair
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/ec2_deploy_key -N ""

# Copy public key to EC2
ssh-copy-id -i ~/.ssh/ec2_deploy_key.pub ubuntu@65.2.122.123

# Test connection
ssh -i ~/.ssh/ec2_deploy_key ubuntu@65.2.122.123 "echo 'SSH connection successful!'"
```

**Add to GitHub Secrets:**

1. Go to: https://github.com/infofitsoftwaresolution/Ivorian/settings/secrets/actions
2. Click "New repository secret"
3. Name: `EC2_SSH_PRIVATE_KEY`
4. Value: Copy the entire contents of `~/.ssh/ec2_deploy_key` (the private key)
   ```bash
   cat ~/.ssh/ec2_deploy_key
   ```

### Step 4: Test Deployment

Push to main branch or manually trigger workflow:

```bash
git add .
git commit -m "Add CI/CD pipeline"
git push origin main
```

Monitor deployment:
- Go to: https://github.com/infofitsoftwaresolution/Ivorian/actions
- Watch the workflow run

## Access Your Application

After successful deployment:

- **Frontend**: http://65.2.122.123:3000 or http://65.2.122.123
- **Backend API**: http://65.2.122.123:8000 or http://65.2.122.123/api
- **Health Check**: http://65.2.122.123:8000/health

## Manual Deployment (If Needed)

If you need to deploy manually:

```bash
ssh ubuntu@65.2.122.123
cd /home/ubuntu/lms-app
./deploy/deploy.sh
```

## Troubleshooting

### SSH Connection Issues

```bash
# Test SSH connection
ssh -i ~/.ssh/ec2_deploy_key ubuntu@65.2.122.123

# Check SSH key permissions
chmod 600 ~/.ssh/ec2_deploy_key
```

### Deployment Fails

1. **Check GitHub Actions logs**: Look for error messages
2. **Check EC2 logs**: 
   ```bash
   ssh ubuntu@65.2.122.123
   cd /home/ubuntu/lms-app
   docker-compose -f docker-compose.prod.yml logs
   ```
3. **Verify environment variables**:
   ```bash
   cat /home/ubuntu/lms-app/.env
   ```

### Services Not Starting

```bash
# Check service status
docker-compose -f /home/ubuntu/lms-app/docker-compose.prod.yml ps

# View logs
docker-compose -f /home/ubuntu/lms-app/docker-compose.prod.yml logs -f

# Restart services
docker-compose -f /home/ubuntu/lms-app/docker-compose.prod.yml restart
```

### Port Already in Use

```bash
# Check what's using the port
sudo netstat -tulpn | grep :8000
sudo netstat -tulpn | grep :3000

# Stop conflicting services
sudo systemctl stop <service-name>
```

## Security Checklist

- [ ] Firewall configured (UFW)
- [ ] Strong SECRET_KEY set
- [ ] Strong database password set
- [ ] SSH key-based authentication only
- [ ] .env file not committed to repository
- [ ] Fail2ban installed and configured
- [ ] Auto-updates enabled

## Next Steps

1. Set up SSL/HTTPS (see deploy/README.md)
2. Configure domain name (update CORS and API URLs)
3. Set up monitoring and alerts
4. Configure automated backups
5. Set up staging environment

## Support

For detailed documentation, see:
- `deploy/README.md` - Full deployment guide
- `.github/workflows/deploy.yml` - CI/CD pipeline configuration
- `docker-compose.prod.yml` - Production Docker configuration

