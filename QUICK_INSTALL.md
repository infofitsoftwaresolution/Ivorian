# Quick Install - One Command Deployment

## 🚀 Single Command Installation

Run this **one command** on your EC2 server to install and deploy everything:

```bash
curl -fsSL https://raw.githubusercontent.com/infofitsoftwaresolution/Ivorian/main/deploy/install-and-deploy.sh | bash
```

Or if you prefer to download first, then run:

```bash
# Download the script
curl -o install-and-deploy.sh https://raw.githubusercontent.com/infofitsoftwaresolution/Ivorian/main/deploy/install-and-deploy.sh

# Make it executable
chmod +x install-and-deploy.sh

# Run it
./install-and-deploy.sh
```

## What the Script Does

The script automatically:

1. ✅ Updates system packages
2. ✅ Installs Python 3.11, Node.js 20, Redis, Nginx
3. ✅ Configures firewall
4. ✅ Clones the repository
5. ✅ Sets up Python virtual environment
6. ✅ Installs all dependencies (backend + frontend)
7. ✅ Creates .env file with auto-generated SECRET_KEY
8. ✅ Creates systemd services
9. ✅ Configures Nginx reverse proxy
10. ✅ Builds frontend
11. ✅ Runs database migrations
12. ✅ Starts all services

## Prerequisites

- EC2 instance running Ubuntu
- SSH access to the server
- RDS security group allows connections from EC2 on port 5432

## After Installation

Your application will be available at:

- **Frontend**: http://65.2.122.123
- **Backend API**: http://65.2.122.123:8000
- **Health Check**: http://65.2.122.123:8000/health

## Troubleshooting

If something goes wrong:

```bash
# Check backend logs
sudo journalctl -u lms-backend -n 50

# Check frontend logs
sudo journalctl -u lms-frontend -n 50

# Check service status
sudo systemctl status lms-backend
sudo systemctl status lms-frontend

# Restart services
sudo systemctl restart lms-backend
sudo systemctl restart lms-frontend
```

## Manual Steps (If Needed)

If the script fails, you can run it step by step. See `STEP_BY_STEP_SETUP.md` for detailed instructions.

---

**That's it!** Just run the one command and everything will be set up automatically.

