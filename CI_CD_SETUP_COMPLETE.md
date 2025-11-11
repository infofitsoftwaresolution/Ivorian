# Complete CI/CD Setup Guide

## 🎯 Overview

This guide will help you set up **full automated CI/CD** so that every push to the `main` branch automatically deploys to your EC2 server.

## ✅ Prerequisites

- EC2 instance is already set up and running
- Application is already deployed manually (first-time setup completed)
- You have SSH access to EC2
- You have admin access to the GitHub repository

## 🚀 Step-by-Step Setup

### Step 1: Generate SSH Key for GitHub Actions

**On your local machine**, run:

```bash
# Generate SSH key pair (no passphrase for automation)
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/ec2_deploy_key -N ""

# This creates:
# - ~/.ssh/ec2_deploy_key (private key - keep secret!)
# - ~/.ssh/ec2_deploy_key.pub (public key - safe to share)
```

### Step 2: Add Public Key to EC2

**Copy the public key to your EC2 server:**

```bash
# Method 1: Using ssh-copy-id (recommended)
ssh-copy-id -i ~/.ssh/ec2_deploy_key.pub ec2-user@65.2.122.123

# Method 2: Manual copy
cat ~/.ssh/ec2_deploy_key.pub
# Then SSH to EC2 and add it to ~/.ssh/authorized_keys
```

**On EC2 server**, verify the key was added:

```bash
ssh ec2-user@65.2.122.123
cat ~/.ssh/authorized_keys | grep github-actions
```

### Step 3: Test SSH Connection

**On your local machine**, test the connection:

```bash
ssh -i ~/.ssh/ec2_deploy_key ec2-user@65.2.122.123 "echo 'SSH connection successful!'"
```

If this works, proceed to the next step.

### Step 4: Add Private Key to GitHub Secrets

1. **Go to your GitHub repository:**
   - Navigate to: `https://github.com/infofitsoftwaresolution/Ivorian`

2. **Go to Settings:**
   - Click on **Settings** tab
   - Click on **Secrets and variables** → **Actions**

3. **Add new secret:**
   - Click **New repository secret**
   - Name: `EC2_SSH_PRIVATE_KEY`
   - Value: Copy the **entire contents** of your private key:
     ```bash
     # On your local machine
     cat ~/.ssh/ec2_deploy_key
     ```
   - Copy **everything** including:
     - `-----BEGIN OPENSSH PRIVATE KEY-----`
     - All the key content
     - `-----END OPENSSH PRIVATE KEY-----`
   - Click **Add secret**

### Step 5: Verify GitHub Actions is Enabled

1. Go to: `https://github.com/infofitsoftwaresolution/Ivorian/settings/actions`
2. Make sure **"Allow all actions and reusable workflows"** is selected
3. Save if needed

### Step 6: Test the CI/CD Pipeline

**Make a small change and push to trigger deployment:**

```bash
# On your local machine
git pull origin main
echo "# CI/CD Test" >> README.md
git add README.md
git commit -m "Test CI/CD deployment"
git push origin main
```

### Step 7: Monitor Deployment

1. **Go to GitHub Actions:**
   - Navigate to: `https://github.com/infofitsoftwaresolution/Ivorian/actions`

2. **Watch the workflow:**
   - You should see a new workflow run
   - It will run tests first
   - Then deploy to EC2
   - Check the logs for any errors

3. **Verify deployment:**
   - After deployment completes, check your website:
   - Frontend: `http://65.2.122.123:3000`
   - Backend: `http://65.2.122.123:8000/health`

## 🔄 How It Works

When you push to `main` branch:

1. **Tests Run:**
   - Backend tests (linting, type checking)
   - Frontend tests (linting, type checking, build)

2. **Deployment:**
   - SSH to EC2 server
   - Pull latest code from GitHub
   - Install/update dependencies
   - Run database migrations
   - Build frontend
   - Restart services
   - Health checks

3. **Verification:**
   - Checks if backend is healthy
   - Checks if frontend is accessible
   - Reports success/failure

## 📋 What Gets Deployed

- ✅ Backend code updates
- ✅ Frontend code updates
- ✅ Database migrations (automatically)
- ✅ Dependencies (automatically updated)
- ✅ Services restarted (automatically)

## 🛠️ Troubleshooting

### SSH Connection Fails

```bash
# Test SSH connection manually
ssh -i ~/.ssh/ec2_deploy_key ec2-user@65.2.122.123

# Check if key is in authorized_keys on EC2
ssh ec2-user@65.2.122.123
cat ~/.ssh/authorized_keys
```

### Deployment Fails

1. **Check GitHub Actions logs:**
   - Go to Actions tab
   - Click on the failed workflow
   - Check the error messages

2. **Check EC2 logs:**
   ```bash
   ssh ec2-user@65.2.122.123
   sudo journalctl -u lms-backend -n 50
   sudo journalctl -u lms-frontend -n 50
   ```

3. **Check service status:**
   ```bash
   sudo systemctl status lms-backend
   sudo systemctl status lms-frontend
   ```

### Services Not Restarting

```bash
# Manually restart services
sudo systemctl restart lms-backend
sudo systemctl restart lms-frontend

# Check if they're running
sudo systemctl status lms-backend lms-frontend
```

## 🔒 Security Notes

- ⚠️ **Never commit** the private key (`ec2_deploy_key`) to the repository
- ✅ The private key is stored securely in GitHub Secrets
- ✅ Only GitHub Actions can access it
- ✅ The public key is safe to share (it's already on EC2)

## 📝 Manual Deployment (If Needed)

If you need to deploy manually without CI/CD:

```bash
ssh ec2-user@65.2.122.123
cd /home/ec2-user/lms-app
./deploy/deploy-no-docker.sh
```

## ✅ Success Checklist

- [ ] SSH key generated
- [ ] Public key added to EC2
- [ ] Private key added to GitHub Secrets
- [ ] Tested SSH connection
- [ ] Pushed a test commit
- [ ] GitHub Actions workflow ran successfully
- [ ] Website updated with new changes

## 🎉 You're Done!

Now every time you push to `main`, your website will automatically update!

**Monitor deployments:** `https://github.com/infofitsoftwaresolution/Ivorian/actions`

