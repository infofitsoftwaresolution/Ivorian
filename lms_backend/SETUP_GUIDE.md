# InfoFit Labs LMS Setup Guide

## Quick Setup

### 1. Run the Complete Setup Script

This script will automatically:
- Seed the RBAC system with roles and permissions
- Create the InfoFit Labs organization
- Create an admin user with super_admin role

```bash
cd lms_backend
python setup_admin.py
```

### 2. Admin Login Credentials

After running the setup script, you can login with:

- **Email:** `admin@infofitlabs.com`
- **Password:** `Admin@123!`

⚠️ **Important:** Change the password after first login!

## Manual Setup (Alternative)

If you prefer to run the steps manually:

### Step 1: Seed RBAC
```bash
python seed_rbac.py
```

### Step 2: Create Admin User
```bash
python create_admin_user.py
```

## Testing the Setup

### 1. Test Registration
- Go to `http://localhost:3000/register`
- Register a new user
- Should redirect to dashboard after successful registration

### 2. Test Admin Login
- Go to `http://localhost:3000/login`
- Login with admin credentials
- Should have full access to all features

### 3. Test API Endpoints
```bash
# Test health check
curl http://localhost:8000/health

# Test registration endpoint
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Test",
    "last_name": "User",
    "email": "test@example.com",
    "password": "testpass123",
    "role": "student"
  }'
```

## Development Workflow

1. **Start Backend:**
   ```bash
   cd lms_backend
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

2. **Start Frontend:**
   ```bash
   cd lms_frontend
   npm run dev
   ```

3. **Access the Application:**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:8000`
   - API Docs: `http://localhost:8000/docs`

## Available Roles

- **super_admin:** Full platform access (InfoFit Labs admin)
- **organization_admin:** Organization management
- **tutor:** Course and assessment management
- **student:** Course enrollment and assessment taking

## Next Steps

1. ✅ **Authentication System** - Complete
2. ✅ **User Registration** - Complete
3. ✅ **RBAC System** - Complete
4. 🔄 **Course Management** - In Progress
5. 📋 **Assessment System** - Planned
6. 🤖 **AI Integration** - Planned
7. 📊 **Analytics** - Planned

## Troubleshooting

### Common Issues

1. **Database Connection Error:**
   - Check if PostgreSQL is running
   - Verify database URL in `.env` file

2. **CORS Error:**
   - Backend CORS is configured for `http://localhost:3000`
   - Check browser console for CORS errors

3. **Registration Fails:**
   - Check backend logs for validation errors
   - Verify all required fields are provided

4. **Admin User Already Exists:**
   - The script will skip creation if admin already exists
   - Use existing credentials to login

### Logs

- Backend logs: `lms_backend/logs/lms_api.log`
- Frontend logs: Browser console

## Support

For issues or questions:
1. Check the logs for error messages
2. Verify all environment variables are set
3. Ensure database is properly initialized
