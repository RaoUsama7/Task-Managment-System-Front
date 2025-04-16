'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import authService, { AuthCredentials, User } from '../services/authService';
import websocketService from '../services/websocketService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  login: (credentials: AuthCredentials) => Promise<void>;
  register: (credentials: AuthCredentials) => Promise<void>;
  logout: () => void;
  updateProfile: (userData: Partial<AuthCredentials>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Add new endpoint to fetch current user profile
const fetchCurrentUser = async (): Promise<User> => {
  return authService.getUserProfile();
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = Boolean(user);
  const isAdmin = user?.role === 'admin';

  // Update localStorage when user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('userInfo', JSON.stringify({
        id: user.id,
        email: user.email,
        role: user.role
      }));
    } else {
      localStorage.removeItem('userInfo');
    }
  }, [user]);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        if (authService.isAuthenticated()) {
          const token = authService.getToken();
          if (token) {
            // Connect to WebSocket if authenticated
            websocketService.connect(token);
            
            try {
              // Try to fetch user profile from API
              const userData = await fetchCurrentUser();
              setUser(userData);
            } catch (error) {
              console.warn('Failed to fetch user profile, using fallback:', error);
              
              // Fallback to localStorage if API fails
              const storedUserInfo = localStorage.getItem('userInfo');
              
              if (storedUserInfo) {
                // Parse stored user data
                const parsedUserInfo = JSON.parse(storedUserInfo);
                setUser({
                  id: parsedUserInfo.id || '1',
                  email: parsedUserInfo.email || 'user@example.com',
                  role: (parsedUserInfo.role === 'admin' ? 'admin' : 'user') as 'admin' | 'user',
                });
              } else {
                // No stored user data, set default
                setUser({
                  id: '1',
                  email: 'user@example.com',
                  role: 'user',
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        authService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();

    return () => {
      websocketService.disconnect();
    };
  }, []);

  // Redirect unauthenticated users from protected routes
  useEffect(() => {
    if (!isLoading) {
      const publicPaths = ['/', '/login', '/register'];
      const pathname = window.location.pathname;
      const pathIsProtected = !publicPaths.includes(pathname);
      
      if (!isAuthenticated && pathIsProtected) {
        router.push('/login');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  const login = async (credentials: AuthCredentials) => {
    try {
      // Login and get user data directly from login response
      const userData = await authService.login(credentials);
      setUser(userData);
      
      // Store user info in localStorage
      localStorage.setItem('userInfo', JSON.stringify(userData));
      
      const token = authService.getToken();
      if (token) {
        websocketService.connect(token);
      }
      
      router.push('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (credentials: AuthCredentials) => {
    try {
      await authService.register(credentials);
      router.push('/login');
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = () => {
    websocketService.disconnect();
    localStorage.removeItem('userInfo');
    authService.logout();
    setUser(null);
  };

  const updateProfile = async (userData: Partial<AuthCredentials>) => {
    try {
      const updatedUser = await authService.updateProfile(userData);
      setUser(updatedUser);
      localStorage.setItem('userInfo', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    isAdmin,
    login,
    register,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 