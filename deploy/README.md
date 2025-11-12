# EC2 Deployment Guide

This guide explains how to deploy the LMS application to an EC2 instance.

## ⚠️ First-Time Setup

**For the first deployment, you must manually set up the application on EC2.**

See `FIRST_TIME_SETUP.md` in the root directory for complete first-time setup instructions, or run the automated script:

```bash
ssh ubuntu@65.2.122.123
curl -o first-time-setup.sh https://raw.githubusercontent.com/infofitsoftwaresolution/Ivorian/main/deploy/first-time-setup.sh
chmod +x first-time-setup.sh
./first-time-setup.sh
```

After the first-time setup, the CI/CD pipeline will handle all future deployments automatically.

---

## Automated Deployment (After First-Time Setup)

## Prerequisites

- EC2 instance running Ubuntu (IP: 65.2.122.123)
- SSH access to the EC2 instance
- GitHub repository with Actions enabled

## Initial Server Setup

### 1. Connect to EC2 Instance

```bash
ssh ubuntu@65.2.122.123
```

### 2. Run Setup Script

```bash
# On the EC2 instance
curl -o setup-ec2.sh https://raw.githubusercontent.com/infofitsoftwaresolution/Ivorian/main/deploy/setup-ec2.sh
chmod +x setup-ec2.sh
./setup-ec2.sh
```

Or manually run the setup commands from `setup-ec2.sh`.

### 3. Configure Environment Variables

```bash
# On the EC2 instance
cd /home/ubuntu/lms-app
cp .env.example .env
nano .env  # Edit with your actual values
```

**Important**: Update the following in `.env`:
- `SECRET_KEY`: Generate a strong random key
- `DATABASE_URL`: Already configured for AWS RDS (password # is encoded as %23)
- `BACKEND_CORS_ORIGINS`: Add your domain/IP
- `NEXT_PUBLIC_API_URL`: Set to your server URL

**Note**: The database is using AWS RDS. Ensure:
- RDS security group allows inbound connections from EC2 on port 5432
- EC2 security group allows outbound connections to RDS
- Database credentials are correct (password contains # which is URL-encoded as %23)

### 4. Set Up SSH Key for GitHub Actions

```bash
# On your local machine, generate SSH key pair
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/ec2_deploy_key

# Copy public key to EC2
ssh-copy-id -i ~/.ssh/ec2_deploy_key.pub ubuntu@65.2.122.123

# Add private key to GitHub Secrets
# Go to: Repository → Settings → Secrets and variables → Actions
# Add secret: EC2_SSH_PRIVATE_KEY
# Value: Contents of ~/.ssh/ec2_deploy_key (private key)
```

## GitHub Secrets Configuration

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add the following secrets:

1. **EC2_SSH_PRIVATE_KEY**: Your SSH private key for EC2 access
2. **NEXT_PUBLIC_API_URL** (optional): Your API URL (defaults to http://65.2.122.123:8000)

## Deployment Process

### Automatic Deployment

The CI/CD pipeline automatically deploys when you push to the `main` branch:

1. **Test**: Runs backend and frontend tests
2. **Build**: Builds Docker images
3. **Deploy**: Deploys to EC2 via SSH
4. **Health Check**: Verifies services are running

### Manual Deployment

If you need to deploy manually:

```bash
# On the EC2 instance
cd /home/ubuntu/lms-app
./deploy/deploy.sh
```

## Accessing the Application

After deployment:

- **Frontend**: http://65.2.122.123:3000 or http://65.2.122.123 (via Nginx)
- **Backend API**: http://65.2.122.123:8000 or http://65.2.122.123/api (via Nginx)
- **Health Check**: http://65.2.122.123:8000/health

## Monitoring

### View Logs

```bash
# All services
docker-compose -f /home/ubuntu/lms-app/docker-compose.prod.yml logs -f

# Specific service
docker-compose -f /home/ubuntu/lms-app/docker-compose.prod.yml logs -f backend
docker-compose -f /home/ubuntu/lms-app/docker-compose.prod.yml logs -f frontend
```

### Check Service Status

```bash
docker-compose -f /home/ubuntu/lms-app/docker-compose.prod.yml ps
```

### Restart Services

```bash
docker-compose -f /home/ubuntu/lms-app/docker-compose.prod.yml restart
```

## Troubleshooting

### Services Not Starting

1. Check logs: `docker-compose logs`
2. Verify environment variables: `cat .env`
3. Check port availability: `sudo netstat -tulpn | grep LISTEN`

### Database Connection Issues

1. Verify RDS database is accessible: `./deploy/verify-db-connection.sh`
2. Check RDS security group allows connections from EC2 (port 5432)
3. Verify DATABASE_URL in .env file (password # should be %23)
4. Test connection: `docker-compose exec backend python -c "from app.core.database import init_db; import asyncio; asyncio.run(init_db())"`

### Frontend Build Issues

1. Check Node.js version: `node --version` (should be 20+)
2. Clear build cache: `docker-compose build --no-cache frontend`
3. Check frontend logs: `docker-compose logs frontend`

### Permission Issues

```bash
# Fix permissions
sudo chown -R ubuntu:ubuntu /home/ubuntu/lms-app
chmod +x /home/ubuntu/lms-app/deploy/*.sh
```

## SSL/HTTPS Setup (Optional)

To enable HTTPS:

1. Install Certbot on EC2:
```bash
sudo apt-get install certbot python3-certbot-nginx
```

2. Get SSL certificate:
```bash
sudo certbot certonly --standalone -d yourdomain.com
```

3. Update nginx.conf to use SSL certificates
4. Uncomment HTTPS server block in nginx.conf
5. Restart nginx: `docker-compose restart nginx`

## Security Best Practices

1. **Firewall**: UFW is configured to allow only necessary ports
2. **Fail2ban**: Installed to prevent brute force attacks
3. **Auto-updates**: Unattended upgrades enabled
4. **Secrets**: Never commit .env file to repository
5. **SSH**: Use key-based authentication only

## Backup

### Database Backup

```bash
# Create backup
docker-compose exec db pg_dump -U lms_user lms_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker-compose exec -T db psql -U lms_user lms_db < backup_file.sql
```

## Scaling

To scale services:

```bash
# Scale backend
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Scale frontend
docker-compose -f docker-compose.prod.yml up -d --scale frontend=2
```

## Support

For issues or questions:
1. Check GitHub Actions logs
2. Review service logs on EC2
3. Check this documentation
4. Create an issue in the repository

