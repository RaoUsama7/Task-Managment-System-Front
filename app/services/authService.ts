import Cookies from 'js-cookie';
import apiService from './apiService';

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

const TOKEN_COOKIE_NAME = 'access_token';

export const authService = {
  register: async (credentials: AuthCredentials): Promise<void> => {
    await apiService.post('/auth/register', credentials);
  },
  
  login: async (credentials: AuthCredentials): Promise<User> => {
    const response = await apiService.post<AuthResponse>('/auth/login', credentials);
    Cookies.set(TOKEN_COOKIE_NAME, response.access_token);
    return response.user;
  },
  
  logout: (): void => {
    Cookies.remove(TOKEN_COOKIE_NAME);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },

  updateProfile: async (userData: Partial<AuthCredentials>): Promise<User> => {
    return apiService.patch<User>('/users/profile', userData);
  },
  
  getUsers: async (): Promise<User[]> => {
    const response = await apiService.get<UserListResponse>('/users');
    return response.users;
  },
  
  getUserProfile: async (): Promise<User> => {
    return apiService.get<User>('/auth/profile');
  },
  
  getToken: (): string | undefined => {
    return Cookies.get(TOKEN_COOKIE_NAME);
  },
  
  isAuthenticated: (): boolean => {
    return !!Cookies.get(TOKEN_COOKIE_NAME);
  }
};

export default authService; 