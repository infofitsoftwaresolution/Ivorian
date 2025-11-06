/**
 * Authentication Hooks
 * Provides clean interface for authentication operations
 */

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, TokenManager, type LoginRequest, type RegisterRequest, type ForgotPasswordRequest, type ResetPasswordRequest, type AuthResponse, type CurrentUserResponse } from '@/lib/api/client';

// User type that matches both login and getCurrentUser responses
type User = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  organization_id?: number;
  is_active?: boolean;
  created_at?: string;
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Hook return type
interface UseAuthReturn extends AuthState {
  login: (credentials: LoginRequest) => Promise<{ success: boolean; error?: string }>;
  register: (userData: RegisterRequest) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  forgotPassword: (data: ForgotPasswordRequest) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (data: ResetPasswordRequest) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (apiClient.isAuthenticated()) {
          const response = await apiClient.getCurrentUser();
          
          // Backend returns {message, data: {user_data}} structure
          setState({
            user: response.data.data,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        TokenManager.clearTokens();
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      console.log('useAuth: Starting login process...');
      setState(prev => ({ ...prev, isLoading: true }));
      
      const response = await apiClient.login(credentials);
      console.log('useAuth: Login API response:', response);
      
      // Store tokens - login returns {message, data: {user, tokens}} structure
      TokenManager.setTokens(
        response.data.data.tokens.access_token,
        response.data.data.tokens.refresh_token
      );

      // Update state
      setState({
        user: response.data.data.user,
        isAuthenticated: true,
        isLoading: false,
      });

      console.log('useAuth: Login successful, state updated');
      return { success: true };
    } catch (error: any) {
      console.error('useAuth: Login error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      return {
        success: false,
        error: error.message || 'Login failed',
      };
    }
  }, []);

  // Register function
  const register = useCallback(async (userData: RegisterRequest) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const response = await apiClient.register(userData);
      
      // Store tokens - register returns {message, data: {user, tokens}} structure
      TokenManager.setTokens(
        response.data.data.tokens.access_token,
        response.data.data.tokens.refresh_token
      );

      // Update state
      setState({
        user: response.data.data.user,
        isAuthenticated: true,
        isLoading: false,
      });

      return { success: true };
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false }));
      return {
        success: false,
        error: error.message || 'Registration failed',
      };
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear state regardless of API call success
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      
      // Redirect to login
      router.push('/login');
    }
  }, [router]);

  // Forgot password function
  const forgotPassword = useCallback(async (data: ForgotPasswordRequest) => {
    try {
      await apiClient.forgotPassword(data);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to send reset email',
      };
    }
  }, []);

  // Reset password function
  const resetPassword = useCallback(async (data: ResetPasswordRequest) => {
    try {
      await apiClient.resetPassword(data);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to reset password',
      };
    }
  }, []);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    try {
      if (apiClient.isAuthenticated()) {
        const response = await apiClient.getCurrentUser();
        setState(prev => ({
          ...prev,
          user: response.data.data,
        }));
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      // If refresh fails, user might be logged out
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  return {
    ...state,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    refreshUser,
  };
}

// Hook for checking if user is authenticated
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}

// Hook for getting current user
export function useCurrentUser() {
  const { user } = useAuth();
  return user;
}
