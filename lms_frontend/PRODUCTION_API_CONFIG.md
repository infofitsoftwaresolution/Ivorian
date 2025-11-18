# Production API Configuration Guide

## Problem
The frontend is getting "Failed to fetch" errors because:
1. Frontend is served over HTTPS (`https://edumentry.com/`)
2. Backend is at HTTP (`http://15.206.84.110:8000`)
3. Browsers block mixed content (HTTPS page requesting HTTP resources)

## Solution Options

### Option 1: Set up HTTPS for Backend (Recommended)

#### Step 1: Install Certbot (Let's Encrypt)
```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
```

#### Step 2: Get SSL Certificate
```bash
# If using a domain name
sudo certbot --nginx -d api.edumentry.com

# Or if using IP, you'll need to use a different method
# Consider using a domain name instead
```

#### Step 3: Configure Nginx as Reverse Proxy
```nginx
server {
    listen 443 ssl http2;
    server_name 15.206.84.110;  # or api.edumentry.com
    
    ssl_certificate /etc/letsencrypt/live/your-domain/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name 15.206.84.110;  # or api.edumentry.com
    return 301 https://$server_name$request_uri;
}
```

#### Step 4: Update Frontend Environment Variable
In your production `.env.local` or environment variables:
```bash
NEXT_PUBLIC_API_URL=https://15.206.84.110:8000
# or if using domain:
NEXT_PUBLIC_API_URL=https://api.edumentry.com
```

### Option 2: Use Same Domain with Path-Based Routing

#### Configure Nginx
```nginx
server {
    listen 443 ssl http2;
    server_name edumentry.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;
    }
}
```

#### Update Frontend Environment Variable
```bash
NEXT_PUBLIC_API_URL=https://edumentry.com
# The API client will automatically append /api/v1
```

### Option 3: Temporary Workaround (NOT RECOMMENDED)

If you absolutely cannot set up HTTPS immediately, you can temporarily serve the frontend over HTTP:

1. **Update Nginx** to serve frontend over HTTP:
```nginx
server {
    listen 80;
    server_name edumentry.com;
    
    location / {
        proxy_pass http://localhost:3000;
    }
}
```

2. **Update Frontend Environment Variable**:
```bash
NEXT_PUBLIC_API_URL=http://15.206.84.110:8000
```

**⚠️ WARNING**: This is NOT secure and should only be used temporarily. Always use HTTPS in production.

## Verification Steps

After configuration:

1. **Check Backend HTTPS**:
```bash
curl -k https://15.206.84.110:8000/api/v1/health
# or
curl https://api.edumentry.com/api/v1/health
```

2. **Check CORS**:
```bash
curl -H "Origin: https://edumentry.com" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://15.206.84.110:8000/api/v1/courses/ \
     -v
```

3. **Test from Browser Console**:
```javascript
fetch('https://15.206.84.110:8000/api/v1/courses/')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

## Current Status

The frontend code now:
- ✅ Auto-converts HTTP to HTTPS when frontend is served over HTTPS
- ✅ Provides detailed error messages
- ✅ Logs API requests for debugging

**However**, the backend must actually support HTTPS for this to work. The auto-conversion will fail if the backend doesn't have SSL configured.

## Next Steps

1. **Set up HTTPS for backend** (Option 1 or 2 above)
2. **Update production environment variable** to use HTTPS URL
3. **Restart frontend** to pick up new environment variable
4. **Test API calls** from the browser

## Troubleshooting

If you still get errors after setting up HTTPS:

1. **Check SSL Certificate**:
   ```bash
   openssl s_client -connect 15.206.84.110:8000 -showcerts
   ```

2. **Check Nginx Configuration**:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

3. **Check Backend Logs**:
   ```bash
   # If using systemd
   sudo journalctl -u lms-backend -f
   
   # If using Docker
   docker logs -f lms-backend
   ```

4. **Check Browser Console** for detailed error messages

