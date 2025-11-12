/**
 * Centralized API Client for LMS Backend
 * Industry-standard implementation with proper error handling and authentication
 */

// Environment-based configuration
const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 10000,
  retries: 3,
  retryDelay: 1000,
};

// API Response Types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: number;
}

// Authentication Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  acceptTerms: boolean;
}

export interface AuthResponse {
  message: string;
  data: {
    user: {
      id: number;
      email: string;
      first_name: string;
      last_name: string;
      role: string;
      organization_id?: number;
    };
    tokens: {
      access_token: string;
      refresh_token: string;
      token_type: string;
      expires_in: number;
    };
  };
}

export interface CurrentUserResponse {
  message: string;
  data: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    organization_id?: number;
    is_active: boolean;
    created_at: string;
  };
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

// Token Management
class TokenManager {
  private static ACCESS_TOKEN_KEY = 'lms_access_token';
  private static REFRESH_TOKEN_KEY = 'lms_refresh_token';

  static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static setTokens(accessToken: string, refreshToken: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  static clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
}

// API Client Class
class ApiClient {
  private baseURL: string;
  private timeout: number;
  private retries: number;
  private retryDelay: number;

  constructor(config = API_CONFIG) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout;
    this.retries = config.retries;
    this.retryDelay = config.retryDelay;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const accessToken = TokenManager.getAccessToken();

    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle 401 Unauthorized - try to refresh token
      if (response.status === 401 && retryCount === 0) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          return this.request<T>(endpoint, options, retryCount + 1);
        }
      }

      // Handle other errors
      if (!response.ok) {
        let errorData: any = {};
        try {
          const text = await response.text();
          if (text) {
            errorData = JSON.parse(text);
          }
        } catch {
          // If response is not JSON, use empty object
        }
        
        // Extract detailed error message
        let errorMessage = `HTTP ${response.status}`;
        if (errorData.detail) {
          // Handle both string and array detail formats
          if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail.map((err: any) => {
              if (typeof err === 'string') return err;
              if (err.msg) return err.msg;
              if (err.loc && err.msg) return `${err.loc.join('.')}: ${err.msg}`;
              return JSON.stringify(err);
            }).join(', ');
          } else if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          } else {
            errorMessage = JSON.stringify(errorData.detail);
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = typeof errorData.error === 'string' 
            ? errorData.error 
            : errorData.error.message || JSON.stringify(errorData.error);
        }
        
        throw new ApiError({
          message: errorMessage,
          status: response.status,
          code: errorData.code || `HTTP_${response.status}`,
          details: errorData,
        });
      }

      const data = await response.json();
      return {
        data,
        status: response.status,
      };
    } catch (error) {
      // Handle network errors and retries
      if (error instanceof ApiError) {
        throw error;
      }

      if (retryCount < this.retries && this.shouldRetry(error)) {
        await this.delay(this.retryDelay * Math.pow(2, retryCount));
        return this.request<T>(endpoint, options, retryCount + 1);
      }

      throw new ApiError({
        message: error instanceof Error ? error.message : 'Network error',
        status: 0,
        code: 'NETWORK_ERROR',
      });
    }
  }

  private shouldRetry(error: any): boolean {
    return (
      error.name === 'AbortError' ||
      error.message?.includes('network') ||
      error.message?.includes('fetch')
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = TokenManager.getRefreshToken();
      if (!refreshToken) return false;

      const response = await fetch(`${this.baseURL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        TokenManager.setTokens(data.access_token, data.refresh_token);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    TokenManager.clearTokens();
    return false;
  }

  // Authentication Methods
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    // Transform to form data format expected by OAuth2PasswordRequestForm
    const formData = new URLSearchParams();
    formData.append('username', credentials.email); // OAuth2 expects 'username' field
    formData.append('password', credentials.password);
    
    return this.request<AuthResponse>('/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    // Transform camelCase to snake_case for backend compatibility
    // Only send fields that the backend expects
    const transformedData = {
      first_name: userData.firstName,
      last_name: userData.lastName,
      email: userData.email,
      password: userData.password,
      role: "student", // Default role for new registrations
    };
    
    return this.request<AuthResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(transformedData),
    });
  }

  async logout(): Promise<ApiResponse> {
    const response = await this.request('/api/v1/auth/logout', {
      method: 'POST',
    });
    TokenManager.clearTokens();
    return response;
  }

  async forgotPassword(data: ForgotPasswordRequest): Promise<ApiResponse> {
    return this.request('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resetPassword(data: ResetPasswordRequest): Promise<ApiResponse> {
    return this.request('/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCurrentUser(): Promise<ApiResponse<CurrentUserResponse>> {
    return this.request<CurrentUserResponse>('/api/v1/auth/me');
  }

  async changePassword(data: { current_password: string; new_password: string }): Promise<ApiResponse> {
    return this.request('/api/v1/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // User Management Methods
  async getUserProfile(): Promise<ApiResponse> {
    return this.request('/api/v1/users/me');
  }

  async updateUserProfile(data: any): Promise<ApiResponse> {
    return this.request('/api/v1/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getUsers(params?: any): Promise<ApiResponse> {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request(`/api/v1/users${queryString}`);
  }

  async getUser(id: string): Promise<ApiResponse> {
    return this.request(`/api/v1/users/${id}`);
  }

  async createUser(data: any): Promise<ApiResponse> {
    return this.request('/api/v1/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: string, data: any): Promise<ApiResponse> {
    return this.request(`/api/v1/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string): Promise<ApiResponse> {
    return this.request(`/api/v1/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Organization Methods
  async registerOrganization(data: any): Promise<ApiResponse> {
    return this.request('/api/v1/auth/register/organization', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getOrganizations(params?: any): Promise<ApiResponse> {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request(`/api/v1/organizations${queryString}`);
  }

  async getOrganization(id: string): Promise<ApiResponse> {
    return this.request(`/api/v1/organizations/${id}`);
  }

  async updateOrganization(id: string, data: any): Promise<ApiResponse> {
    return this.request(`/api/v1/organizations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteOrganization(id: string): Promise<ApiResponse> {
    return this.request(`/api/v1/organizations/${id}`, {
      method: 'DELETE',
    });
  }

  // Tutor Management Methods
  async createTutor(data: any): Promise<ApiResponse> {
    return this.request('/api/v1/users/tutors', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTutors(params?: any): Promise<ApiResponse> {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request(`/api/v1/users/tutors${queryString}`);
  }

  // Course Methods
  async getCourses(params?: any): Promise<ApiResponse> {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request(`/api/v1/courses${queryString}`);
  }

  async getCourse(id: number): Promise<ApiResponse> {
    return this.request(`/api/v1/courses/${id}`);
  }

  async createCourse(courseData: any): Promise<ApiResponse> {
    console.log('API Client: Creating course with data:', courseData);
    const response = await this.request('/api/v1/courses', {
      method: 'POST',
      body: JSON.stringify(courseData),
    });
    console.log('API Client: Course creation response:', response);
    return response;
  }

  async updateCourse(id: number, courseData: any): Promise<ApiResponse> {
    return this.request(`/api/v1/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(courseData),
    });
  }

  async deleteCourse(id: number): Promise<ApiResponse> {
    return this.request(`/api/v1/courses/${id}`, {
      method: 'DELETE',
    });
  }

  // Topic Methods
  async createTopic(courseId: number, topicData: any): Promise<ApiResponse> {
    return this.request(`/api/v1/courses/${courseId}/topics`, {
      method: 'POST',
      body: JSON.stringify(topicData),
    });
  }

  async getCourseTopics(courseId: number): Promise<ApiResponse> {
    return this.request(`/api/v1/courses/${courseId}/topics`);
  }

  async updateTopic(topicId: number, topicData: any): Promise<ApiResponse> {
    return this.request(`/api/v1/courses/topics/${topicId}`, {
      method: 'PUT',
      body: JSON.stringify(topicData),
    });
  }

  async deleteTopic(topicId: number): Promise<ApiResponse> {
    return this.request(`/api/v1/courses/topics/${topicId}`, {
      method: 'DELETE',
    });
  }

  // Lesson Methods
  async createLesson(topicId: number, lessonData: any): Promise<ApiResponse> {
    return this.request(`/api/v1/courses/topics/${topicId}/lessons`, {
      method: 'POST',
      body: JSON.stringify(lessonData),
    });
  }

  async getTopicLessons(topicId: number): Promise<ApiResponse> {
    return this.request(`/api/v1/courses/topics/${topicId}/lessons`);
  }

  async updateLesson(lessonId: number, lessonData: any): Promise<ApiResponse> {
    return this.request(`/api/v1/lessons/${lessonId}`, {
      method: 'PUT',
      body: JSON.stringify(lessonData),
    });
  }

  async deleteLesson(lessonId: number): Promise<ApiResponse> {
    return this.request(`/api/v1/lessons/${lessonId}`, {
      method: 'DELETE',
    });
  }

  // Enrollment Methods
  async enrollInCourse(courseId: number): Promise<ApiResponse> {
    return this.request(`/api/v1/courses/${courseId}/enroll`, {
      method: 'POST',
    });
  }

  async getMyEnrollments(): Promise<ApiResponse> {
    console.log('🌐 API Client: Getting my enrollments');
    return this.request('/api/v1/users/me/enrollments');
  }

  async getCourseEnrollments(courseId: number): Promise<ApiResponse> {
    return this.request(`/api/v1/courses/${courseId}/enrollments`);
  }

  async updateEnrollment(enrollmentId: number, enrollmentData: any): Promise<ApiResponse> {
    return this.request(`/api/v1/courses/enrollments/${enrollmentId}`, {
      method: 'PUT',
      body: JSON.stringify(enrollmentData),
    });
  }

  async cancelEnrollment(enrollmentId: number): Promise<ApiResponse> {
    return this.request(`/api/v1/courses/enrollments/${enrollmentId}`, {
      method: 'DELETE',
    });
  }

  async enrollStudentInCourse(studentId: number, courseId: number): Promise<ApiResponse> {
    const url = `/api/v1/courses/${courseId}/enroll?student_id=${studentId}`;
    console.log(`🌐 API Client: Enrolling student ${studentId} in course ${courseId}`);
    console.log(`🔗 Request URL: ${url}`);
    return this.request(url, {
      method: 'POST',
    });
  }

  async publishCourse(courseId: number): Promise<ApiResponse> {
    return this.request(`/api/v1/courses/${courseId}/publish`, {
      method: 'POST',
    });
  }

  async archiveCourse(courseId: number): Promise<ApiResponse> {
    return this.request(`/api/v1/courses/${courseId}/archive`, {
      method: 'POST',
    });
  }

  // Assessment Methods
  async getAssessments(params?: any): Promise<ApiResponse> {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request(`/api/v1/assessments${queryString}`);
  }

  async getAssessment(id: number): Promise<ApiResponse> {
    return this.request(`/api/v1/assessments/${id}`);
  }

  async createAssessment(data: any): Promise<ApiResponse> {
    return this.request('/api/v1/assessments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAssessment(id: number, data: any): Promise<ApiResponse> {
    return this.request(`/api/v1/assessments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAssessment(id: number): Promise<ApiResponse> {
    return this.request(`/api/v1/assessments/${id}`, {
      method: 'DELETE',
    });
  }

  // Analytics Methods
  async getUserAnalytics(): Promise<ApiResponse> {
    return this.request('/api/v1/analytics/user/progress');
  }

  async getPlatformStats(): Promise<ApiResponse> {
    return this.request('/api/v1/analytics/platform/stats');
  }

  // User Management Methods
  async deleteUser(userId: number): Promise<ApiResponse> {
    return this.request(`/api/v1/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async updateUser(userId: number, data: any): Promise<ApiResponse> {
    return this.request(`/api/v1/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getUserProfile(): Promise<ApiResponse> {
    return this.request('/api/v1/users/me');
  }

  async updateUserProfile(data: any): Promise<ApiResponse> {
    return this.request('/api/v1/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async uploadAvatar(file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'avatars');

    const accessToken = TokenManager.getAccessToken();
    const url = `${this.baseURL}/api/v1/upload/file`;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve({
              data: { url: data.url },
              status: xhr.status,
            });
          } catch (error) {
            reject(new ApiError({
              message: 'Failed to parse response',
              status: xhr.status,
              code: 'PARSE_ERROR',
            }));
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            reject(new ApiError({
              message: errorData.detail || `HTTP ${xhr.status}`,
              status: xhr.status,
              code: `HTTP_${xhr.status}`,
              details: errorData,
            }));
          } catch {
            reject(new ApiError({
              message: `HTTP ${xhr.status}`,
              status: xhr.status,
              code: `HTTP_${xhr.status}`,
            }));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new ApiError({
          message: 'Network error',
          status: 0,
          code: 'NETWORK_ERROR',
        }));
      });

      xhr.open('POST', url);
      if (accessToken) {
        xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
      }
      xhr.send(formData);
    });
  }

  // File Upload Methods
  async uploadVideo(file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<{ url: string; filename: string; size: number; content_type: string }>> {
    const formData = new FormData();
    formData.append('file', file);

    const accessToken = TokenManager.getAccessToken();
    const url = `${this.baseURL}/api/v1/upload/video`;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve({
              data,
              status: xhr.status,
            });
          } catch (error) {
            reject(new ApiError({
              message: 'Failed to parse response',
              status: xhr.status,
              code: 'PARSE_ERROR',
            }));
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            reject(new ApiError({
              message: errorData.detail || `HTTP ${xhr.status}`,
              status: xhr.status,
              code: `HTTP_${xhr.status}`,
              details: errorData,
            }));
          } catch {
            reject(new ApiError({
              message: `HTTP ${xhr.status}`,
              status: xhr.status,
              code: `HTTP_${xhr.status}`,
            }));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new ApiError({
          message: 'Network error',
          status: 0,
          code: 'NETWORK_ERROR',
        }));
      });

      xhr.addEventListener('abort', () => {
        reject(new ApiError({
          message: 'Upload cancelled',
          status: 0,
          code: 'UPLOAD_CANCELLED',
        }));
      });

      xhr.open('POST', url);
      if (accessToken) {
        xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
      }
      xhr.send(formData);
    });
  }

  async uploadFile(file: File, folder: string = 'files', onProgress?: (progress: number) => void): Promise<ApiResponse<{ url: string; filename: string; size: number; content_type: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const accessToken = TokenManager.getAccessToken();
    const url = `${this.baseURL}/api/v1/upload/file`;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve({
              data,
              status: xhr.status,
            });
          } catch (error) {
            reject(new ApiError({
              message: 'Failed to parse response',
              status: xhr.status,
              code: 'PARSE_ERROR',
            }));
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            reject(new ApiError({
              message: errorData.detail || `HTTP ${xhr.status}`,
              status: xhr.status,
              code: `HTTP_${xhr.status}`,
              details: errorData,
            }));
          } catch {
            reject(new ApiError({
              message: `HTTP ${xhr.status}`,
              status: xhr.status,
              code: `HTTP_${xhr.status}`,
            }));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new ApiError({
          message: 'Network error',
          status: 0,
          code: 'NETWORK_ERROR',
        }));
      });

      xhr.addEventListener('abort', () => {
        reject(new ApiError({
          message: 'Upload cancelled',
          status: 0,
          code: 'UPLOAD_CANCELLED',
        }));
      });

      xhr.open('POST', url);
      if (accessToken) {
        xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
      }
      xhr.send(formData);
    });
  }

  async deleteFile(url: string): Promise<ApiResponse> {
    const encodedUrl = encodeURIComponent(url);
    return this.request(`/api/v1/upload/file?url=${encodedUrl}`, {
      method: 'DELETE',
    });
  }

  // Utility Methods
  isAuthenticated(): boolean {
    const token = TokenManager.getAccessToken();
    const isExpired = token ? TokenManager.isTokenExpired(token) : true;
    return token ? !isExpired : false;
  }

  getAuthHeaders(): HeadersInit {
    const token = TokenManager.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}

// Custom Error Class
class ApiError extends Error {
  public status: number;
  public code?: string;
  public details?: any;

  constructor({ message, status, code, details }: {
    message: string;
    status: number;
    code?: string;
    details?: any;
  }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export utilities
export { TokenManager, ApiError };
