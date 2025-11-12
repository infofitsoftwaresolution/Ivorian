#!/bin/bash

# Script to verify RDS database connection from EC2

set -e

echo "🔍 Verifying RDS database connection..."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Extract connection details from DATABASE_URL
# Format: postgresql+asyncpg://user:password@host:port/database

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set in .env file"
    exit 1
fi

# Test connection using psql (if available) or Python
if command -v psql &> /dev/null; then
    echo "Testing with psql..."
    # Extract connection parts (simplified - assumes standard format)
    # For production, you might want to use a more robust parser
    psql "$DATABASE_URL" -c "SELECT version();" && echo "✅ Database connection successful!"
else
    echo "Testing with Python..."
    python3 << EOF
import asyncio
import asyncpg
import os
import sys

async def test_connection():
    try:
        # Parse DATABASE_URL
        db_url = os.getenv('DATABASE_URL', '')
        if not db_url:
            print("❌ DATABASE_URL not set")
            sys.exit(1)
        
        # Remove asyncpg driver prefix for connection
        conn_url = db_url.replace('postgresql+asyncpg://', 'postgresql://')
        
        conn = await asyncpg.connect(conn_url)
        version = await conn.fetchval('SELECT version();')
        print(f"✅ Database connection successful!")
        print(f"📊 PostgreSQL version: {version[:50]}...")
        await conn.close()
        sys.exit(0)
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        sys.exit(1)

asyncio.run(test_connection())
EOF
fi

echo ""
echo "💡 If connection fails, check:"
echo "   1. RDS security group allows connections from EC2 (port 5432)"
echo "   2. DATABASE_URL is correct in .env file"
echo "   3. Password is URL-encoded (# should be %23)"
echo "   4. Network connectivity from EC2 to RDS"

