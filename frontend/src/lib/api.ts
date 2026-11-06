import axios, { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../types';

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

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
