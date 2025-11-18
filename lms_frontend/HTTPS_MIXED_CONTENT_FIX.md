# HTTPS Mixed Content Fix

## Problem
The frontend is served over HTTPS (`https://edumentry.com/`) but is trying to make requests to an HTTP backend (`http://15.206.84.110:8000`). Browsers block mixed content (HTTPS page requesting HTTP resources) for security reasons.

## Solution

### Option 1: Set up HTTPS for Backend (Recommended)

1. **Get SSL Certificate** for your backend domain/IP
   - Use Let's Encrypt (free)
   - Or use AWS Certificate Manager if using AWS

2. **Configure Nginx as Reverse Proxy** (if not already done):
   ```nginx
   server {
       listen 443 ssl;
       server_name 15.206.84.110;
       
       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;
       
       location / {
           proxy_pass http://localhost:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

3. **Update Frontend Environment Variable**:
   ```bash
   NEXT_PUBLIC_API_URL=https://15.206.84.110:8000
   # or if using a domain:
   NEXT_PUBLIC_API_URL=https://api.edumentry.com
   ```

### Option 2: Use Same Domain (Alternative)

If backend and frontend are on the same domain, use relative URLs:

1. **Update API Client** to use relative URLs:
   ```typescript
   baseURL: process.env.NEXT_PUBLIC_API_URL || '/api'
   ```

2. **Configure Nginx** to proxy API requests:
   ```nginx
   server {
       listen 443 ssl;
       server_name edumentry.com;
       
       # Frontend
       location / {
           proxy_pass http://localhost:3000;
       }
       
       # Backend API
       location /api {
           proxy_pass http://localhost:8000;
       }
   }
   ```

### Option 3: Temporary Fix (Development Only)

For immediate fix while setting up HTTPS, the code now auto-converts HTTP to HTTPS when the page is loaded over HTTPS. However, this requires the backend to actually support HTTPS.

## Current Implementation

The API client now automatically detects if the page is loaded over HTTPS and converts HTTP backend URLs to HTTPS. This works if:
- Backend supports HTTPS on the same port
- Or backend is behind an HTTPS reverse proxy

## Verification

After deployment, check:
1. Browser console for mixed content errors
2. Network tab to see if requests are going to HTTPS
3. Backend logs to confirm requests are received

## Important Notes

- **Never disable browser security** - Mixed content blocking is a security feature
- **Always use HTTPS in production** - Required for security and user trust
- **Test thoroughly** - Ensure all API endpoints work with HTTPS

