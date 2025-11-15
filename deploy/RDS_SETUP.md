# AWS RDS Database Configuration

## Database Connection Details

- **Host**: `infofitlabs.c7yic444gxi0.ap-south-1.rds.amazonaws.com`
- **Port**: `5432`
- **Database**: `infofitlabs`
- **Username**: `postgres`
- **Password**: `infofitlabs#123` (URL-encoded as `infofitlabs%23123` in connection string)

## Connection String

```
postgresql+asyncpg://postgres:infofitlabs%23123@infofitlabs.c7yic444gxi0.ap-south-1.rds.amazonaws.com:5432/infofitlabs
```

**Note**: The `#` character in the password must be URL-encoded as `%23` in the connection string.

## Security Group Configuration

### Required Inbound Rules

The RDS security group must allow inbound connections from your EC2 instance:

1. **Type**: PostgreSQL
2. **Protocol**: TCP
3. **Port**: 5432
4. **Source**: 
   - Option 1: EC2 Security Group ID (recommended)
   - Option 2: EC2 Private IP (65.2.122.123/32)
   - Option 3: EC2 VPC CIDR block (if in same VPC)

### Steps to Configure:

1. Go to AWS Console → RDS → Databases
2. Select your database: `infofitlabs`
3. Click on the VPC security group
4. Edit inbound rules
5. Add rule:
   - Type: PostgreSQL
   - Port: 5432
   - Source: Your EC2 security group or IP

## EC2 Security Group Configuration

Ensure your EC2 security group allows outbound connections:

1. **Type**: All traffic
2. **Protocol**: All
3. **Port**: All
4. **Destination**: 0.0.0.0/0 (or specific RDS security group)

## Testing Connection

### From EC2 Instance:

```bash
# Install PostgreSQL client (if not already installed)
sudo apt-get install postgresql-client

# Test connection
psql -h infofitlabs.c7yic444gxi0.ap-south-1.rds.amazonaws.com \
     -U postgres \
     -d infofitlabs \
     -p 5432

# Or use the verification script
cd /home/ubuntu/lms-app
chmod +x deploy/verify-db-connection.sh
./deploy/verify-db-connection.sh
```

### From Docker Container:

```bash
# Test from backend container
docker-compose -f docker-compose.prod.yml exec backend python -c "
import asyncio
from app.core.database import init_db
asyncio.run(init_db())
print('✅ Database connection successful!')
"
```

## Troubleshooting

### Connection Refused

**Symptoms**: `connection refused` or `timeout`

**Solutions**:
1. Check RDS security group allows EC2 IP/security group
2. Verify RDS is publicly accessible (if connecting from outside VPC)
3. Check EC2 security group allows outbound connections
4. Verify RDS endpoint is correct

### Authentication Failed

**Symptoms**: `password authentication failed`

**Solutions**:
1. Verify password is correct
2. Check password encoding in DATABASE_URL (# should be %23)
3. Verify username is correct (postgres)
4. Check database name is correct (infofitlabs)

### Network Issues

**Symptoms**: `could not connect to server`

**Solutions**:
1. Verify RDS and EC2 are in same VPC or have proper peering
2. Check route tables and network ACLs
3. Verify DNS resolution works
4. Test with `telnet` or `nc`:
   ```bash
   telnet infofitlabs.c7yic444gxi0.ap-south-1.rds.amazonaws.com 5432
   ```

## Database Migrations

Run migrations after deployment:

```bash
cd /home/ubuntu/lms-app
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

## Backup and Recovery

### Manual Backup

```bash
# From EC2 or local machine with psql
pg_dump -h infofitlabs.c7yic444gxi0.ap-south-1.rds.amazonaws.com \
        -U postgres \
        -d infofitlabs \
        -F c \
        -f backup_$(date +%Y%m%d_%H%M%S).dump
```

### Restore Backup

```bash
pg_restore -h infofitlabs.c7yic444gxi0.ap-south-1.rds.amazonaws.com \
           -U postgres \
           -d infofitlabs \
           backup_file.dump
```

## Monitoring

- **AWS Console**: RDS → Databases → Monitoring
- **CloudWatch**: RDS metrics and logs
- **Application Logs**: Check backend logs for database connection issues

## Best Practices

1. ✅ Use security groups instead of IP addresses
2. ✅ Enable automated backups
3. ✅ Monitor database performance
4. ✅ Use connection pooling
5. ✅ Keep database credentials secure (use AWS Secrets Manager)
6. ✅ Enable SSL/TLS for database connections (if required)

## SSL Connection (Optional)

To enable SSL for database connections, update DATABASE_URL:

```
postgresql+asyncpg://postgres:infofitlabs%23123@infofitlabs.c7yic444gxi0.ap-south-1.rds.amazonaws.com:5432/infofitlabs?ssl=require
```

Then update the database connection code to use SSL.

