import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import Cookies from 'js-cookie';
import { logEnvVariables } from '../lib/debug';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Log environment variables in development
if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
  logEnvVariables();
  console.log('API Service using URL:', API_URL);
}

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = Cookies.get('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle authentication errors (401)
    if (error.response?.status === 401) {
      Cookies.remove('access_token');
      // Redirect to login page if not already there
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient.get<T, AxiosResponse<T>>(url, config).then((response) => response.data);
  },
  
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient.post<T, AxiosResponse<T>>(url, data, config).then((response) => response.data);
  },
  
  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient.patch<T, AxiosResponse<T>>(url, data, config).then((response) => response.data);
  },
  
  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient.delete<T, AxiosResponse<T>>(url, config).then((response) => response.data);
  }
};

export default apiService; 