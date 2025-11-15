# CI/CD Pipeline Setup Guide

## Overview
This guide will help you set up a complete CI/CD pipeline for the LMS project using GitHub Actions.

## Repository Structure Clarification

This project uses a **monorepo** structure, meaning:
- **One GitHub repository**: `infofitlabs`
- **Contains both applications**: Frontend and backend in separate folders
- **Simplified management**: One repository to manage everything

### Repository Layout:
```
infofitlabs/ (GitHub Repository)
├── lms_backend/          # Python FastAPI backend
├── lms_frontend/         # Next.js frontend  
├── docs/                 # Documentation
├── .github/             # GitHub Actions workflows
└── README.md            # Main project README
```

### Why Monorepo?
- ✅ Easier to manage for small to medium teams
- ✅ Atomic changes across frontend and backend
- ✅ Simplified CI/CD pipeline
- ✅ Better coordination between frontend and backend
- ✅ Easier for beginners to understand

## Prerequisites
- GitHub repository with proper permissions
- Docker Hub account (for container registry)
- AWS account (for deployment)
- Codecov account (for test coverage)

## Step 1: GitHub Repository Setup

### 1.1 Create GitHub Repository
```bash
# Create a new repository on GitHub
# Repository name: infofitlabs
# Description: Modern AI-Integrated Learning Management System
# Visibility: Private (recommended for production)
# Structure: Monorepo (single repository containing both frontend and backend)
```

### 1.2 Set up Branch Protection Rules
1. Go to your repository → Settings → Branches
2. Add rule for `main` branch:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Include administrators
   - ✅ Restrict pushes that create files
   - ✅ Restrict deletions

3. Add rule for `develop` branch:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
   - ✅ Include administrators

## Step 2: GitHub Secrets Configuration

### 2.1 Required Secrets
Go to your repository → Settings → Secrets and variables → Actions

Add the following secrets:

#### Docker Hub Credentials
```
DOCKER_USERNAME=your_dockerhub_username
DOCKER_PASSWORD=your_dockerhub_access_token
```

#### AWS Credentials (for deployment)
```
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
```

#### Database Credentials
```
DATABASE_URL=postgresql://username:password@host:port/database
REDIS_URL=redis://host:port
```

#### API Keys
```
SECRET_KEY=your_jwt_secret_key
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

#### Email Configuration
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
EMAILS_FROM_EMAIL=noreply@infofitlabs.com
EMAILS_FROM_NAME=InfoFit LMS
```

#### Payment Integration
```
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

## Step 3: Environment Setup

### 3.1 Create Environments
Go to your repository → Settings → Environments

#### Staging Environment
- Name: `staging`
- Protection rules:
  - ✅ Required reviewers: Add team members
  - ✅ Wait timer: 0 minutes
  - ✅ Deployment branches: `main`

#### Production Environment
- Name: `production`
- Protection rules:
  - ✅ Required reviewers: Add senior team members
  - ✅ Wait timer: 5 minutes
  - ✅ Deployment branches: `main`

## Step 4: Docker Hub Setup

### 4.1 Create Docker Hub Account
1. Go to [Docker Hub](https://hub.docker.com)
2. Create an account if you don't have one
3. Create a new organization: `infofitlabs`

### 4.2 Create Access Token
1. Go to Account Settings → Security
2. Create a new access token
3. Save the token securely

### 4.3 Create Docker Hub Repositories
Create the following Docker Hub repositories for container images:
- `infofitlabs/lms-backend` (for backend Docker images)
- `infofitlabs/lms-frontend` (for frontend Docker images)

**Note**: These are Docker Hub repositories, not GitHub repositories. Your GitHub repository structure is:
```
infofitlabs/ (GitHub repository)
├── lms_backend/ (folder in the repository)
├── lms_frontend/ (folder in the repository)
└── docs/ (folder in the repository)
```

## Step 5: AWS Setup (Optional for Production)

### 5.1 Create IAM User
1. Go to AWS IAM Console
2. Create a new user: `infofitlabs-ci`
3. Attach policies:
   - `AmazonEC2ContainerRegistryFullAccess`
   - `AmazonS3FullAccess`
   - `CloudFrontFullAccess`

### 5.2 Create ECR Repositories
```bash
aws ecr create-repository --repository-name lms-backend
aws ecr create-repository --repository-name lms-frontend
```

## Step 6: Codecov Setup

### 6.1 Create Codecov Account
1. Go to [Codecov](https://codecov.io)
2. Sign up with your GitHub account
3. Add your repository

### 6.2 Add Codecov Token
Add to GitHub secrets:
```
CODECOV_TOKEN=your_codecov_token
```

## Step 7: Testing the Pipeline

### 7.1 Push Code to Trigger Pipeline
```bash
# Create a new branch
git checkout -b feature/ci-cd-setup

# Add all files
git add .

# Commit changes
git commit -m "Add CI/CD pipeline configuration"

# Push to GitHub
git push origin feature/ci-cd-setup

# Create pull request
# Go to GitHub and create PR from feature/ci-cd-setup to develop
```

### 7.2 Monitor Pipeline Execution
1. Go to your repository → Actions tab
2. Monitor the workflow execution
3. Check for any failures and fix them

## Step 8: Deployment Configuration

### 8.1 Staging Deployment
The pipeline will automatically deploy to staging when:
- Code is merged to `main` branch
- All tests pass
- Security checks pass

### 8.2 Production Deployment
Production deployment requires:
- Manual approval (configured in environment protection rules)
- All staging tests pass
- Security audit approval

## Step 9: Monitoring and Alerts

### 9.1 Set up Notifications
1. Go to repository Settings → Notifications
2. Configure email notifications for:
   - Pull request reviews
   - Workflow runs
   - Security alerts

### 9.2 Set up Status Checks
Configure required status checks for protected branches:
- `Backend CI/CD Pipeline`
- `Frontend CI/CD Pipeline`
- `Codecov`

## Step 10: Troubleshooting

### Common Issues

#### 1. Docker Build Failures
- Check Dockerfile syntax
- Verify all dependencies are in requirements.txt
- Ensure Docker Hub credentials are correct

#### 2. Test Failures
- Run tests locally first
- Check test environment variables
- Verify database connection

#### 3. Deployment Failures
- Check AWS credentials
- Verify environment variables
- Check resource limits

### Debug Commands
```bash
# Run tests locally
cd lms_backend && python -m pytest tests/ -v
cd lms_frontend && npm run test

# Run linting locally
cd lms_backend && flake8 app/ && black --check app/
cd lms_frontend && npm run lint

# Build Docker images locally
docker build -t lms-backend ./lms_backend
docker build -t lms-frontend ./lms_frontend
```

## Step 11: Best Practices

### 11.1 Code Quality
- Always run tests before pushing
- Use pre-commit hooks
- Follow coding standards
- Write meaningful commit messages

### 11.2 Security
- Never commit secrets to repository
- Use environment variables
- Regular security audits
- Keep dependencies updated

### 11.3 Performance
- Monitor build times
- Optimize Docker images
- Use caching effectively
- Monitor resource usage

## Step 12: Next Steps

### 12.1 Advanced Features
- Set up automated dependency updates
- Configure performance monitoring
- Set up error tracking (Sentry)
- Implement blue-green deployments

### 12.2 Documentation
- Update README with deployment instructions
- Create runbook for common issues
- Document environment setup
- Create troubleshooting guide

## Support

If you encounter any issues:
1. Check the GitHub Actions logs
2. Review this setup guide
3. Check the troubleshooting section
4. Create an issue in the repository

---

**Note**: This setup guide assumes you have the necessary permissions and accounts. Adjust the configuration based on your specific requirements and infrastructure.
