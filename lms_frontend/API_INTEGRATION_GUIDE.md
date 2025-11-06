# API Integration Guide
## Frontend-Backend Integration Architecture

### Overview
This guide explains the industry-standard API integration architecture implemented for the LMS frontend. The system provides a centralized, robust, and scalable approach to backend communication.

---

## 🏗️ **Architecture Components**

### 1. **Centralized API Client** (`/src/lib/api/client.ts`)
- **Single source of truth** for all backend API calls
- **Environment-based configuration** for different deployment stages
- **Automatic token management** and refresh
- **Error handling** and retry logic
- **TypeScript support** with full type safety

### 2. **Authentication Hooks** (`/src/hooks/useAuth.ts`)
- **React hooks** for authentication state management
- **Automatic token storage** and retrieval
- **User session management**
- **Error handling** and user feedback

### 3. **Protected Route Component** (`/src/components/auth/ProtectedRoute.tsx`)
- **Route protection** for authenticated pages
- **Automatic redirects** to login
- **Loading states** during authentication checks

---

## 🔧 **Configuration**

### Environment Variables
Create a `.env.local` file in the frontend root:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# Development Settings
NEXT_PUBLIC_APP_NAME=InfoFit Labs LMS
NEXT_PUBLIC_APP_VERSION=1.0.0

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_DEBUG_MODE=true
```

### Production Configuration
For production, update `NEXT_PUBLIC_API_URL` to your production backend URL:
```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

---

## 📡 **API Client Usage**

### Basic Usage
```typescript
import { apiClient } from '@/lib/api/client';

// Authentication
const loginResult = await apiClient.login({
  email: 'user@example.com',
  password: 'password123'
});

// Get user data
const userData = await apiClient.getCurrentUser();

// Logout
await apiClient.logout();
```

### Error Handling
```typescript
try {
  const result = await apiClient.login(credentials);
  // Handle success
} catch (error) {
  if (error instanceof ApiError) {
    console.error('API Error:', error.message, error.status);
  } else {
    console.error('Network Error:', error.message);
  }
}
```

---

## 🎣 **Authentication Hooks Usage**

### useAuth Hook
```typescript
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    login, 
    logout 
  } = useAuth();

  const handleLogin = async () => {
    const result = await login({
      email: 'user@example.com',
      password: 'password123'
    });

    if (result.success) {
      // Redirect or show success message
    } else {
      // Show error message
      console.error(result.error);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please log in</div>;

  return (
    <div>
      <p>Welcome, {user?.firstName}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Protected Routes
```typescript
import ProtectedRoute from '@/components/auth/ProtectedRoute';

function DashboardPage() {
  return (
    <ProtectedRoute>
      <div>Dashboard content (only visible to authenticated users)</div>
    </ProtectedRoute>
  );
}
```

---

## 🔄 **Token Management**

### Automatic Token Refresh
The API client automatically handles token refresh when:
- A request returns `401 Unauthorized`
- The access token is expired
- The refresh token is still valid

### Manual Token Management
```typescript
import { TokenManager } from '@/lib/api/client';

// Check if user is authenticated
const isAuth = apiClient.isAuthenticated();

// Get current tokens
const accessToken = TokenManager.getAccessToken();
const refreshToken = TokenManager.getRefreshToken();

// Clear tokens (logout)
TokenManager.clearTokens();
```

---

## 🚀 **Adding New API Endpoints**

### 1. Add Method to API Client
```typescript
// In /src/lib/api/client.ts
class ApiClient {
  // ... existing methods

  async createCourse(data: CreateCourseRequest): Promise<ApiResponse<Course>> {
    return this.request<Course>('/api/v1/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCourses(params?: CourseFilters): Promise<ApiResponse<Course[]>> {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request<Course[]>(`/api/v1/courses${queryString}`);
  }
}
```

### 2. Create Custom Hook (Optional)
```typescript
// In /src/hooks/useCourses.ts
import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';

export function useCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.getCourses();
      setCourses(response.data);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { courses, loading, fetchCourses };
}
```

### 3. Use in Components
```typescript
function CoursesPage() {
  const { courses, loading, fetchCourses } = useCourses();

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  if (loading) return <div>Loading courses...</div>;

  return (
    <div>
      {courses.map(course => (
        <div key={course.id}>{course.title}</div>
      ))}
    </div>
  );
}
```

---

## 🛡️ **Security Features**

### 1. **Automatic Token Refresh**
- Seamless token renewal without user intervention
- Graceful handling of expired tokens

### 2. **Request Retry Logic**
- Automatic retry for network failures
- Exponential backoff for retry attempts

### 3. **Error Handling**
- Comprehensive error classification
- User-friendly error messages
- Network error detection

### 4. **CORS Support**
- Proper CORS headers for cross-origin requests
- Secure cookie handling

---

## 🔍 **Debugging & Monitoring**

### Debug Mode
Enable debug mode in development:
```bash
NEXT_PUBLIC_ENABLE_DEBUG_MODE=true
```

### Network Tab Monitoring
- All API requests are logged in browser dev tools
- Request/response headers are visible
- Error responses are clearly marked

### Error Tracking
```typescript
// Custom error handling
apiClient.login(credentials).catch(error => {
  console.error('Login failed:', {
    message: error.message,
    status: error.status,
    code: error.code,
    details: error.details
  });
});
```

---

## 📦 **Deployment Considerations**

### 1. **Environment Configuration**
- Use different API URLs for staging/production
- Configure feature flags appropriately
- Set up monitoring and analytics

### 2. **HTTPS Requirements**
- All production API calls use HTTPS
- Secure cookie settings for authentication
- HSTS headers for security

### 3. **Performance Optimization**
- API response caching where appropriate
- Request deduplication
- Optimistic updates for better UX

---

## 🎯 **Best Practices**

### 1. **Always Use TypeScript**
- Define proper types for all API requests/responses
- Use interfaces for better type safety

### 2. **Handle Loading States**
- Show loading indicators during API calls
- Disable forms during submission

### 3. **Error Boundaries**
- Implement React error boundaries
- Graceful error handling in components

### 4. **Testing**
- Mock API client for unit tests
- Test error scenarios
- Validate authentication flows

---

## 📚 **Additional Resources**

- [FastAPI Backend Documentation](../lms_backend/README.md)
- [Authentication Flow Diagrams](./docs/auth-flow.md)
- [API Endpoint Reference](./docs/api-reference.md)
- [Error Handling Guide](./docs/error-handling.md)

---

*This architecture provides a robust, scalable, and maintainable foundation for frontend-backend integration. The centralized approach ensures consistency and makes it easy to add new features while maintaining security and performance.*
