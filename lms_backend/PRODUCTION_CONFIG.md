# Production Configuration Guide

## Environment Variables

Create a `.env` file in the `lms_backend` directory with the following variables:

### Required Variables
```bash
# Application Settings
DEBUG=False
HOST=0.0.0.0
PORT=8000

# Security
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Database
DATABASE_URL=postgresql://username:password@host:port/database
DATABASE_ECHO=False

# CORS Configuration
# For production, set this to your actual domain(s)
BACKEND_CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Optional Variables
```bash
# Redis
REDIS_URL=redis://localhost:6379

# AWS
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket

# AI Services
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key

# Email
SMTP_TLS=True
SMTP_PORT=587
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAILS_FROM_EMAIL=your-email@gmail.com
EMAILS_FROM_NAME=Your App Name

# Payment
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key

# Monitoring
SENTRY_DSN=your-sentry-dsn
```

## CORS Configuration

### Development
```bash
BACKEND_CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:8080
```

### Production
```bash
# Single domain
BACKEND_CORS_ORIGINS=https://yourdomain.com

# Multiple domains (comma-separated)
BACKEND_CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,https://app.yourdomain.com
```

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use strong, unique SECRET_KEY** in production
3. **Set DEBUG=False** in production
4. **Use HTTPS** in production
5. **Configure proper CORS origins** for your domains
6. **Use environment-specific database URLs**
7. **Enable proper logging** and monitoring
8. **Use secure headers** and middleware

## Deployment Checklist

- [ ] Set `DEBUG=False`
- [ ] Configure production database
- [ ] Set proper CORS origins
- [ ] Use strong SECRET_KEY
- [ ] Configure HTTPS
- [ ] Set up monitoring (Sentry)
- [ ] Configure email settings
- [ ] Set up Redis for caching
- [ ] Configure AWS services (if needed)
- [ ] Set up proper logging
- [ ] Test all endpoints
- [ ] Run database migrations
- [ ] Seed initial data (RBAC)

## Docker Deployment

For Docker deployment, pass environment variables:

```bash
docker run -d \
  -e DEBUG=False \
  -e SECRET_KEY=your-secret-key \
  -e DATABASE_URL=your-db-url \
  -e BACKEND_CORS_ORIGINS=https://yourdomain.com \
  -p 8000:8000 \
  your-app-name
```
