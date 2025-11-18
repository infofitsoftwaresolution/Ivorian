# CORS Error Fix for Production

## Problem

The frontend at `http://edumentry.com` cannot access the backend API at `http://15.206.84.110:8000` due to CORS (Cross-Origin Resource Sharing) policy blocking.

## Error Message

```
Access to fetch at 'http://15.206.84.110:8000/api/v1/courses/...' from origin 'http://edumentry.com'
has been blocked by CORS policy: Response to preflight request doesn't pass access control check:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Solution

### Step 1: Verify Backend Environment Variable

SSH into your production server and check if the `BACKEND_CORS_ORIGINS` environment variable is set:

```bash
# Check current environment variable
echo $BACKEND_CORS_ORIGINS

# Or check in your .env file
cat /path/to/your/backend/.env | grep BACKEND_CORS_ORIGINS
```

### Step 2: Set/Update Environment Variable

Add or update the `BACKEND_CORS_ORIGINS` environment variable in your production `.env` file:

```bash
# Option 1: Comma-separated format (recommended)
BACKEND_CORS_ORIGINS=http://edumentry.com,https://edumentry.com,http://www.edumentry.com,https://www.edumentry.com,http://localhost:3000

# Option 2: JSON array format
BACKEND_CORS_ORIGINS=["http://edumentry.com","https://edumentry.com","http://www.edumentry.com","https://www.edumentry.com","http://localhost:3000"]
```

**Important:** Make sure to include:

- `http://edumentry.com` (HTTP version)
- `https://edumentry.com` (HTTPS version, if you have SSL)
- `http://www.edumentry.com` (with www)
- `https://www.edumentry.com` (with www and HTTPS)

### Step 3: Restart Backend Server

After updating the environment variable, restart your backend server:

```bash
# If using systemd service
sudo systemctl restart lms-backend

# If using Docker
docker-compose restart backend

# If using PM2
pm2 restart lms-backend

# If running directly with uvicorn
# Stop the current process and restart
```

### Step 4: Verify CORS is Working

Test the CORS configuration:

```bash
# Test from command line
curl -H "Origin: http://edumentry.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://15.206.84.110:8000/api/v1/courses/ \
     -v

# You should see headers like:
# Access-Control-Allow-Origin: http://edumentry.com
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
# Access-Control-Allow-Credentials: true
```

Or visit the test endpoint in your browser:

```
http://15.206.84.110:8000/test-cors
```

### Step 5: Check Backend Logs

Check if the backend is reading the CORS origins correctly:

```bash
# Check backend logs
tail -f /var/log/lms-backend.log

# Or if using Docker
docker logs -f lms-backend

# Look for startup logs showing CORS origins
```

## Quick Fix Script

If you have SSH access, run this script:

```bash
#!/bin/bash
# Quick CORS fix script

BACKEND_DIR="/path/to/your/backend"  # Update this path
ENV_FILE="$BACKEND_DIR/.env"

# Backup current .env
cp "$ENV_FILE" "$ENV_FILE.backup"

# Add or update BACKEND_CORS_ORIGINS
if grep -q "BACKEND_CORS_ORIGINS" "$ENV_FILE"; then
    # Update existing
    sed -i 's|BACKEND_CORS_ORIGINS=.*|BACKEND_CORS_ORIGINS=http://edumentry.com,https://edumentry.com,http://www.edumentry.com,https://www.edumentry.com,http://localhost:3000|' "$ENV_FILE"
else
    # Add new
    echo "BACKEND_CORS_ORIGINS=http://edumentry.com,https://edumentry.com,http://www.edumentry.com,https://www.edumentry.com,http://localhost:3000" >> "$ENV_FILE"
fi

echo "✅ Updated BACKEND_CORS_ORIGINS in $ENV_FILE"
echo "⚠️  Please restart your backend server now!"
```

## Alternative: Use Wildcard (NOT RECOMMENDED for Production)

If you need a quick temporary fix, you can allow all origins (NOT SECURE for production):

```bash
BACKEND_CORS_ORIGINS=["*"]
```

**Warning:** This allows any website to access your API. Only use this for testing!

## Verify Frontend API URL

Also make sure your frontend is pointing to the correct backend URL. Check your frontend `.env` or configuration:

```bash
# Should be:
NEXT_PUBLIC_API_URL=http://15.206.84.110:8000
# or
NEXT_PUBLIC_API_URL=http://15.206.84.110:8000/api/v1
```

## Still Having Issues?

1. **Check if backend is running:**

   ```bash
   curl http://15.206.84.110:8000/health
   # or
   curl http://15.206.84.110:8000/docs
   ```

2. **Check firewall/security groups:**

   - Ensure port 8000 is open in your AWS security group
   - Check if any firewall is blocking requests

3. **Check backend logs for errors:**

   ```bash
   # Look for CORS-related errors
   grep -i cors /var/log/lms-backend.log
   ```

4. **Test with curl:**
   ```bash
   # Test actual API call
   curl -H "Origin: http://edumentry.com" \
        http://15.206.84.110:8000/api/v1/courses/ \
        -v
   ```

## Contact

If the issue persists, check:

- Backend server logs
- Network connectivity between frontend and backend
- Any reverse proxy (nginx) configuration that might be interfering
