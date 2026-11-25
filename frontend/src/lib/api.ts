import axios, { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../types';

/**
 * Normalizes backend API base URL ensuring /api/v1 suffix is present.
 */
export const normalizeApiUrl = (rawUrl?: string): string => {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) {
    return '/api/v1';
  }

  const clean = trimmed.replace(/\/+$/, '');
  if (clean.endsWith('/api/v1')) return clean;
  if (clean.endsWith('/api')) return `${clean}/v1`;
  return `${clean}/api/v1`;
};

// Centralized API base URL configuration from environment or standard web fallback
export const API_BASE_URL = normalizeApiUrl(
  import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL
);

export const getApiBaseUrl = (): string => API_BASE_URL;

// Token storage in memory/session for non-cookie fallback
let memoryToken: string | null = typeof window !== 'undefined' ? sessionStorage.getItem('devpulse_token') : null;

export const setAuthToken = (token: string | null) => {
  memoryToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      sessionStorage.setItem('devpulse_token', token);
    } else {
      sessionStorage.removeItem('devpulse_token');
    }
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
    if (error.response?.status === 502) {
      return 'Server is unreachable (502 Bad Gateway). The backend service is not running or unreachable.';
    }
    if (error.response?.status === 503) {
      return 'Service temporarily unavailable (503). The server is undergoing maintenance or starting up.';
    }
    if (error.response?.status === 504) {
      return 'Gateway timeout (504). The backend server took too long to respond.';
    }
    if (error.code === 'ECONNABORTED') {
      return 'Connection timed out. Please check your network and server address.';
    }
    if (error.code === 'ERR_NETWORK' || !error.response) {
      return 'Cannot reach the server. Please verify your network connection.';
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
