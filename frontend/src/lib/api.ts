import axios, { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../types';

/**
 * Normalizes backend API base URL ensuring /api/v1 suffix is present.
 */
export const normalizeApiUrl = (rawUrl?: string): string => {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) {
    // In packaged Electron (app: or file:) fallback to localhost default if no env variable is supplied
    if (typeof window !== 'undefined' && (window.location.protocol === 'app:' || window.location.protocol === 'file:')) {
      return 'http://localhost:8081/api/v1';
    }
    // Web development default using Vite reverse proxy
    return '/api/v1';
  }

  const clean = trimmed.replace(/\/+$/, '');
  if (clean.endsWith('/api/v1')) return clean;
  if (clean.endsWith('/api')) return `${clean}/v1`;
  return `${clean}/api/v1`;
};

export const API_BASE_URL = normalizeApiUrl(
  import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL
);

// Token storage in memory/session for non-cookie fallback
let memoryToken: string | null = sessionStorage.getItem('devpulse_token');

export const setAuthToken = (token: string | null) => {
  memoryToken = token;
  if (token) {
    sessionStorage.setItem('devpulse_token', token);
  } else {
    sessionStorage.removeItem('devpulse_token');
  }
};

export const getAuthToken = () => memoryToken;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  if (memoryToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${memoryToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    // If 401 Unauthorized occurs on protected routes, session may be expired
    if (error.response?.status === 401) {
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        // Can notify auth context or dispatch event
      }
    }
    return Promise.reject(error);
  }
);

export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    if (data?.validationErrors && data.validationErrors.length > 0) {
      return data.validationErrors.map((v) => `${v.field}: ${v.message}`).join(', ');
    }
    if (data?.message) {
      return data.message;
    }
    if (error.message) {
      return error.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

export default apiClient;
