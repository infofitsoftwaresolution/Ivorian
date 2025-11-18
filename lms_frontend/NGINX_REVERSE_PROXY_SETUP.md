# Nginx Reverse Proxy Setup for Edumentry

This guide explains how to set up Nginx as a reverse proxy to route API requests from the frontend to the backend, avoiding mixed content errors.

## Problem

When your frontend is served over HTTPS (`https://edumentry.com`) and tries to connect to an HTTP backend (`http://15.206.84.110:8000`), browsers block these requests due to mixed content security policies.

## Solution: Nginx Reverse Proxy

Configure Nginx to:
1. Serve the frontend on HTTPS
2. Route `/api` requests to the backend (which can run on HTTP internally)
3. Handle SSL termination

## Step-by-Step Setup

### 1. Install Nginx (if not already installed)

```bash
sudo apt update
sudo apt install nginx
```

### 2. Obtain SSL Certificate

Use Let's Encrypt (Certbot) to get a free SSL certificate:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d edumentry.com -d www.edumentry.com
```

This will automatically configure SSL for your domain.

### 3. Configure Nginx

Create or edit the Nginx configuration file:

```bash
sudo nano /etc/nginx/sites-available/edumentry
```

Add the following configuration:

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name edumentry.com www.edumentry.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name edumentry.com www.edumentry.com;

    # SSL certificates (Certbot will update these)
    ssl_certificate /etc/letsencrypt/live/edumentry.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/edumentry.com/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend (Next.js) - serve static files and handle client-side routing
    location / {
        # If using Next.js standalone build, point to .next/standalone
        # If using PM2/systemd, point to your Next.js server
        proxy_pass http://localhost:3000;  # Or wherever your Next.js app runs
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API - route /api to FastAPI backend
    location /api {
        proxy_pass http://15.206.84.110:8000;  # Your backend server
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        
        # CORS headers (if not handled by FastAPI)
        add_header 'Access-Control-Allow-Origin' 'https://edumentry.com' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS, PATCH' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
        add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range' always;
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' 'https://edumentry.com';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS, PATCH';
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }
    }

    # Static files (if serving directly from Nginx)
    location /_next/static {
        alias /path/to/your/frontend/.next/static;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # Logging
    access_log /var/log/nginx/edumentry-access.log;
    error_log /var/log/nginx/edumentry-error.log;
}
```

### 4. Enable the Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/edumentry /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 5. Update Frontend Environment Variable

In your frontend production environment, update `NEXT_PUBLIC_API_URL`:

```bash
# Option 1: Use relative URL (recommended - works with Nginx routing)
NEXT_PUBLIC_API_URL=/api

# Option 2: Use full HTTPS URL
NEXT_PUBLIC_API_URL=https://edumentry.com/api
```

**Note:** The API client code will automatically detect same-domain routing and use relative URLs.

### 6. Update Backend CORS Configuration

Ensure your backend (`lms_backend/app/core/config.py`) includes the production domain:

```python
BACKEND_CORS_ORIGINS = [
    "https://edumentry.com",
    "https://www.edumentry.com",
    # ... other origins
]
```

### 7. Verify Setup

1. **Test frontend:**
   ```bash
   curl -I https://edumentry.com
   ```

2. **Test API routing:**
   ```bash
   curl -I https://edumentry.com/api/v1/health
   ```

3. **Check browser console:**
   - Open `https://edumentry.com` in your browser
   - Open Developer Tools (F12)
   - Check Network tab - all API calls should be to `https://edumentry.com/api/...`
   - No mixed content errors should appear

## Alternative: Backend on Same Server

If your backend runs on the same server as Nginx, you can use `localhost`:

```nginx
location /api {
    proxy_pass http://localhost:8000;  # Backend on same server
    # ... rest of configuration
}
```

## Troubleshooting

### 502 Bad Gateway
- Check if backend is running: `curl http://localhost:8000/api/v1/health`
- Check Nginx error logs: `sudo tail -f /var/log/nginx/edumentry-error.log`

### 404 Not Found
- Verify the `proxy_pass` URL is correct
- Check if backend is listening on the correct port
- Ensure backend route prefix matches (`/api`)

### CORS Errors
- Verify CORS origins in backend configuration
- Check Nginx CORS headers are set correctly
- Ensure preflight (OPTIONS) requests are handled

### SSL Certificate Issues
- Renew certificate: `sudo certbot renew`
- Check certificate expiration: `sudo certbot certificates`

## Security Notes

1. **Firewall:** Only allow ports 80, 443, and 22 (SSH) from the internet
2. **Backend Access:** Backend should only be accessible via Nginx (not directly from internet)
3. **Rate Limiting:** Consider adding rate limiting in Nginx for API endpoints
4. **SSL/TLS:** Always use TLS 1.2 or higher

## Maintenance

- **Auto-renew SSL:** Certbot should auto-renew, but verify with `sudo certbot renew --dry-run`
- **Monitor logs:** Regularly check Nginx and backend logs
- **Update Nginx:** Keep Nginx updated for security patches

## References

- [Nginx Reverse Proxy Documentation](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Certbot Documentation](https://certbot.eff.org/)

