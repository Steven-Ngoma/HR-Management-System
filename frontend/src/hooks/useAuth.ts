import { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { authService } from '../services/auth';
import { User } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Get user profile on mount if token exists
  const { data: profileData, isLoading } = useQuery(
    'profile',
    authService.getProfile,
    {
      enabled: !!authService.getToken(),
      retry: false,
      onSuccess: (data) => {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      },
      onError: () => {
        authService.logout();
        setUser(null);
      },
    }
  );

  useEffect(() => {
    const token = authService.getToken();
    const storedUser = authService.getCurrentUser();

    if (token && storedUser) {
      setUser(storedUser);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading]);

  const login = async (email: string, password: string) => {
    try {
      const authData = await authService.login({ email, password });
      setUser(authData.user);
      return authData;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    window.location.href = '/login';
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return {
    user,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isHR: user?.role === 'hr' || user?.role === 'admin',
    isEmployee: user?.role === 'employee',
  };
};