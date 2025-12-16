import api from './api';
import { LoginCredentials, RegisterData, AuthResponse, ApiResponse, User } from '../types';

export const authService = {
  // Login user
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    
    if (response.data.success && response.data.data) {
      const { user, token } = response.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Login failed');
  },

  // Register user
  register: async (userData: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', userData);
    
    if (response.data.success && response.data.data) {
      const { user, token } = response.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Registration failed');
  },

  // Get current user profile
  getProfile: async (): Promise<{ user: User; employee?: any }> => {
    const response = await api.get<ApiResponse<{ user: User; employee?: any }>>('/auth/profile');
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to get profile');
  },

  // Update user profile
  updateProfile: async (userData: Partial<User>): Promise<User> => {
    const response = await api.put<ApiResponse<{ user: User }>>('/auth/profile', userData);
    
    if (response.data.success && response.data.data) {
      const updatedUser = response.data.data.user;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    }
    
    throw new Error(response.data.message || 'Failed to update profile');
  },

  // Change password
  changePassword: async (passwords: { currentPassword: string; newPassword: string }): Promise<void> => {
    const response = await api.put<ApiResponse<void>>('/auth/change-password', passwords);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to change password');
    }
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Get stored user
  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Get stored token
  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },
};