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

// Update the WebSocket connection with user profile
const updateWebSocketConnection = (userData: User) => {
  const token = authService.getToken();
  if (!token) return;
  
  console.log(`Establishing WebSocket connection for user ${userData.email}`);
  
  // Connect to the WebSocket server with user details
  websocketService.connect(token, userData.id, userData.role);
  
  // Join role-specific rooms
  if (userData.role === 'admin') {
    console.log('Joining admin-specific WebSocket rooms');
    websocketService.joinAdminRoom();
  }
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

  // Connection and authentication
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        if (authService.isAuthenticated()) {
          const token = authService.getToken();
          if (token) {
            try {
              // Try to fetch user profile from API
              const userData = await fetchCurrentUser();
              setUser(userData);
              
              // Connect to WebSocket with user ID and role
              updateWebSocketConnection(userData);
            } catch (error) {
              console.warn('Failed to fetch user profile, using fallback:', error);
              
              // Fallback to localStorage if API fails
              const storedUserInfo = localStorage.getItem('userInfo');
              
              if (storedUserInfo) {
                // Parse stored user data
                const parsedUserInfo = JSON.parse(storedUserInfo);
                const userId = parsedUserInfo.id || '1';
                const userRole = parsedUserInfo.role || 'user';
                
                setUser({
                  id: userId,
                  email: parsedUserInfo.email || 'user@example.com',
                  role: (userRole === 'admin' ? 'admin' : 'user') as 'admin' | 'user',
                });
                
                // Connect to WebSocket
                websocketService.connect(token, userId, userRole);
              } else {
                // No stored user data, set default
                const defaultUserId = '1';
                setUser({
                  id: defaultUserId,
                  email: 'user@example.com',
                  role: 'user',
                });
                
                // Connect with default user ID
                websocketService.connect(token, defaultUserId, 'user');
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
      // Cleanup - disconnect from WebSocket when component unmounts
      if (user?.id) {
        websocketService.leaveUserRoom(user.id);
      }
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
      
      // Connect to WebSocket and join user room
      updateWebSocketConnection(userData);
      
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
    // Properly clean up WebSocket connections
    websocketService.disconnect();
    
    // Clean up local storage and auth state
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