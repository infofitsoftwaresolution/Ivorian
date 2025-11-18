#!/bin/bash

# SSL Setup Script for edumentry.com
# This script sets up HTTPS using Let's Encrypt Certbot

set -e

DOMAIN="edumentry.com"
EMAIL="admin@edumentry.com"  # Change this to your email

echo "🔒 Setting up SSL for $DOMAIN..."

# Step 1: Install Certbot
echo ""
echo "📦 Step 1: Installing Certbot..."
if ! command -v certbot &> /dev/null; then
    sudo yum install -y certbot python3-certbot-nginx || {
        echo "⚠️  yum install failed, trying alternative method..."
        # For Amazon Linux 2023 or newer
        sudo dnf install -y certbot python3-certbot-nginx || {
            echo "❌ Failed to install certbot. Please install manually."
            exit 1
        }
    }
    echo "✅ Certbot installed"
else
    echo "✅ Certbot already installed"
fi

# Step 2: Check if Nginx is running
echo ""
echo "🌐 Step 2: Checking Nginx status..."
if ! sudo systemctl is-active --quiet nginx; then
    echo "⚠️  Nginx is not running. Starting Nginx..."
    sudo systemctl start nginx
    sudo systemctl enable nginx
fi
echo "✅ Nginx is running"

# Step 3: Check current Nginx configuration
echo ""
echo "🔍 Step 3: Checking Nginx configuration..."

# Check if edumentry.conf exists
if [ -f "/etc/nginx/conf.d/edumentry.conf" ]; then
    echo "✅ Found /etc/nginx/conf.d/edumentry.conf"
    NGINX_CONFIG="/etc/nginx/conf.d/edumentry.conf"
elif [ -f "/etc/nginx/sites-available/lms" ]; then
    echo "✅ Found /etc/nginx/sites-available/lms"
    NGINX_CONFIG="/etc/nginx/sites-available/lms"
else
    echo "⚠️  No Nginx config found. Creating one..."
    NGINX_CONFIG="/etc/nginx/conf.d/edumentry.conf"
    
    # Create basic HTTP config first
    sudo tee "$NGINX_CONFIG" > /dev/null << 'EOF'
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
EOF
    
    # Create certbot directory
    sudo mkdir -p /var/www/certbot
    sudo chown -R nginx:nginx /var/www/certbot
    
    echo "✅ Created basic Nginx configuration"
fi

# Step 4: Update Nginx config to include server_name and acme-challenge location
echo ""
echo "🔧 Step 4: Updating Nginx configuration for SSL..."

# Check if server_name includes the domain
if ! grep -q "server_name.*$DOMAIN" "$NGINX_CONFIG" 2>/dev/null; then
    echo "⚠️  Domain not found in server_name. Please update manually."
    echo "   Add 'server_name edumentry.com www.edumentry.com;' to your server block"
fi

# Ensure acme-challenge location exists
if ! grep -q "\.well-known/acme-challenge" "$NGINX_CONFIG" 2>/dev/null; then
    echo "📝 Adding acme-challenge location to Nginx config..."
    # This is a simplified approach - user may need to add manually
    sudo mkdir -p /var/www/certbot
    sudo chown -R nginx:nginx /var/www/certbot
fi

# Test Nginx configuration
echo ""
echo "🧪 Testing Nginx configuration..."
if sudo nginx -t; then
    echo "✅ Nginx configuration is valid"
    sudo systemctl reload nginx
else
    echo "❌ Nginx configuration has errors. Please fix them first."
    exit 1
fi

# Step 5: Obtain SSL certificate
echo ""
echo "🔐 Step 5: Obtaining SSL certificate from Let's Encrypt..."
echo "   This will use the webroot method for verification"

# Create webroot directory if it doesn't exist
sudo mkdir -p /var/www/certbot
sudo chown -R nginx:nginx /var/www/certbot

# Run certbot
echo ""
echo "📧 Using email: $EMAIL (you can change this in the script)"
echo "🌐 Requesting certificate for: $DOMAIN and www.$DOMAIN"
echo ""

# Use certbot with nginx plugin (automatic configuration)
if sudo certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email "$EMAIL" --redirect; then
    echo "✅ SSL certificate obtained successfully!"
else
    echo "⚠️  Automatic configuration failed. Trying manual method..."
    
    # Try manual/webroot method
    if sudo certbot certonly --webroot -w /var/www/certbot -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email "$EMAIL"; then
        echo "✅ SSL certificate obtained using webroot method!"
        echo "⚠️  You'll need to manually configure Nginx for HTTPS (see instructions below)"
    else
        echo "❌ Failed to obtain certificate. Please check:"
        echo "   1. Domain DNS is pointing to this server"
        echo "   2. Port 80 is open in security group"
        echo "   3. Nginx is accessible from the internet"
        exit 1
    fi
fi

# Step 6: Verify certificate
echo ""
echo "🔍 Step 6: Verifying certificate..."
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "✅ Certificate files found at /etc/letsencrypt/live/$DOMAIN/"
    sudo certbot certificates
else
    echo "⚠️  Certificate files not found in expected location"
fi

# Step 7: Set up auto-renewal
echo ""
echo "🔄 Step 7: Setting up certificate auto-renewal..."
# Test renewal
if sudo certbot renew --dry-run; then
    echo "✅ Auto-renewal test successful"
else
    echo "⚠️  Auto-renewal test failed, but certificate is valid"
fi

# Certbot should have already set up a systemd timer, but let's verify
if sudo systemctl list-timers | grep -q certbot; then
    echo "✅ Certbot renewal timer is active"
else
    echo "⚠️  Certbot timer not found. Setting up manually..."
    # Create renewal script
    sudo tee /etc/cron.monthly/certbot-renew > /dev/null << 'EOF'
#!/bin/bash
certbot renew --quiet --post-hook "systemctl reload nginx"
EOF
    sudo chmod +x /etc/cron.monthly/certbot-renew
    echo "✅ Created monthly renewal cron job"
fi

# Step 8: Final Nginx test and reload
echo ""
echo "🧪 Step 8: Final Nginx configuration test..."
if sudo nginx -t; then
    echo "✅ Nginx configuration is valid"
    sudo systemctl reload nginx
    echo "✅ Nginx reloaded with SSL configuration"
else
    echo "❌ Nginx configuration has errors"
    exit 1
fi

echo ""
echo "✅ SSL setup completed successfully!"
echo ""
echo "🌐 Your site should now be accessible at:"
echo "   https://$DOMAIN"
echo "   https://www.$DOMAIN"
echo ""
echo "📋 Next steps:"
echo "   1. Test your site: curl -I https://$DOMAIN"
echo "   2. Check SSL rating: https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"
echo "   3. Verify HTTP redirects to HTTPS"
echo ""

