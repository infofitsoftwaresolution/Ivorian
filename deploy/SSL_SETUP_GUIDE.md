# SSL/HTTPS Setup Guide for edumentry.com

This guide will help you set up HTTPS for your domain using Let's Encrypt SSL certificates.

## Prerequisites

1. ✅ Domain `edumentry.com` is already configured
2. ✅ DNS A record points to your EC2 instance IP
3. ✅ Nginx is installed and running
4. ✅ Port 80 (HTTP) is open in your EC2 security group
5. ✅ Port 443 (HTTPS) is open in your EC2 security group

## Quick Setup (Automated Script)

Run the automated setup script:

```bash
cd /home/ec2-user/lms-app  # or /home/ubuntu/lms-app
chmod +x deploy/setup-ssl.sh
sudo ./deploy/setup-ssl.sh
```

**Note:** Before running, edit the script and change the email address:
```bash
nano deploy/setup-ssl.sh
# Change: EMAIL="admin@edumentry.com" to your email
```

## Manual Setup (Step by Step)

If you prefer to set up manually or the script fails, follow these steps:

### Step 1: Install Certbot

```bash
sudo yum install -y certbot python3-certbot-nginx
```

Or for Amazon Linux 2023:
```bash
sudo dnf install -y certbot python3-certbot-nginx
```

### Step 2: Verify DNS Configuration

Make sure your domain points to your EC2 instance:

```bash
dig edumentry.com +short
# Should return your EC2 instance IP (e.g., 15.206.84.110)
```

### Step 3: Configure Nginx for Let's Encrypt

Create or update your Nginx configuration file:

```bash
sudo nano /etc/nginx/conf.d/edumentry.conf
```

Ensure it includes:

```nginx
upstream backend {
    server localhost:8000;
}

upstream frontend {
    server localhost:3000;
}

server {
    listen 80;
    server_name edumentry.com www.edumentry.com;

    client_max_body_size 100M;

    # For Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Backend API
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Create the certbot directory:

```bash
sudo mkdir -p /var/www/certbot
sudo chown -R nginx:nginx /var/www/certbot
```

Test and reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Step 4: Obtain SSL Certificate

**Option A: Automatic (Recommended)**

Certbot will automatically configure Nginx:

```bash
sudo certbot --nginx -d edumentry.com -d www.edumentry.com
```

Follow the prompts:
- Enter your email address
- Agree to terms of service
- Choose whether to redirect HTTP to HTTPS (recommended: Yes)

**Option B: Manual (Webroot Method)**

If automatic method fails:

```bash
sudo certbot certonly --webroot -w /var/www/certbot -d edumentry.com -d www.edumentry.com
```

Then manually configure Nginx for HTTPS (see Step 5).

### Step 5: Configure Nginx for HTTPS (If Manual Method)

If you used the manual method, add this HTTPS server block to your Nginx config:

```bash
sudo nano /etc/nginx/conf.d/edumentry.conf
```

Add after the HTTP server block:

```nginx
server {
    listen 443 ssl http2;
    server_name edumentry.com www.edumentry.com;

    ssl_certificate /etc/letsencrypt/live/edumentry.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/edumentry.com/privkey.pem;
    
    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    client_max_body_size 100M;

    # Backend API
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Update the HTTP server block to redirect to HTTPS:

```nginx
server {
    listen 80;
    server_name edumentry.com www.edumentry.com;

    # For Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect all HTTP to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}
```

Test and reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Step 6: Set Up Auto-Renewal

Let's Encrypt certificates expire every 90 days. Set up auto-renewal:

**Test renewal:**

```bash
sudo certbot renew --dry-run
```

**Verify systemd timer (should be automatic):**

```bash
sudo systemctl list-timers | grep certbot
```

If not found, create a cron job:

```bash
sudo crontab -e
```

Add this line:

```
0 0 * * * certbot renew --quiet --post-hook "systemctl reload nginx"
```

### Step 7: Verify SSL Setup

**Test HTTPS access:**

```bash
curl -I https://edumentry.com
```

**Check certificate details:**

```bash
sudo certbot certificates
```

**Test SSL rating:**

Visit: https://www.ssllabs.com/ssltest/analyze.html?d=edumentry.com

## Troubleshooting

### Certificate Obtainment Fails

1. **Check DNS:**
   ```bash
   dig edumentry.com +short
   ```

2. **Check port 80 is open:**
   ```bash
   sudo netstat -tlnp | grep :80
   ```

3. **Check Nginx is accessible:**
   ```bash
   curl -I http://edumentry.com
   ```

4. **Check firewall:**
   ```bash
   sudo firewall-cmd --list-all  # CentOS/RHEL
   sudo ufw status  # Ubuntu
   ```

### Nginx Configuration Errors

```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

### Certificate Renewal Fails

```bash
sudo certbot renew --dry-run --verbose
```

### Check Certificate Expiry

```bash
sudo certbot certificates
```

Or:

```bash
sudo openssl x509 -in /etc/letsencrypt/live/edumentry.com/cert.pem -noout -dates
```

## Security Group Rules

Ensure your EC2 security group allows:

- **Inbound Port 80 (HTTP)** - from anywhere (0.0.0.0/0)
- **Inbound Port 443 (HTTPS)** - from anywhere (0.0.0.0/0)

## After SSL Setup

1. ✅ Update frontend `.env.local` to use HTTPS:
   ```
   NEXT_PUBLIC_API_URL=https://edumentry.com/api
   ```

2. ✅ Verify backend CORS includes HTTPS URLs (already configured in deployment script)

3. ✅ Test the application:
   - Visit https://edumentry.com
   - Verify API calls work
   - Check browser console for mixed content warnings

## Support

If you encounter issues:

1. Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`
2. Check Certbot logs: `sudo tail -f /var/log/letsencrypt/letsencrypt.log`
3. Verify DNS propagation: https://www.whatsmydns.net/#A/edumentry.com

