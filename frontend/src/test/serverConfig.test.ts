import { describe, it, expect, beforeEach } from 'vitest';
import {
  normalizeApiUrl,
  API_BASE_URL,
  getApiBaseUrl,
  setAuthToken,
  getAuthToken,
  extractErrorMessage,
} from '../lib/api';
import { AxiosError, AxiosHeaders } from 'axios';

describe('Standard Web API Configuration & Utilities', () => {
  describe('normalizeApiUrl', () => {
    it('appends /api/v1 to root URL', () => {
      expect(normalizeApiUrl('https://my-server.com')).toBe('https://my-server.com/api/v1');
      expect(normalizeApiUrl('https://my-server.com/')).toBe('https://my-server.com/api/v1');
    });

    it('preserves existing /api/v1 suffix', () => {
      expect(normalizeApiUrl('https://my-server.com/api/v1')).toBe('https://my-server.com/api/v1');
      expect(normalizeApiUrl('https://my-server.com/api/v1/')).toBe('https://my-server.com/api/v1');
    });

    it('appends /v1 when /api suffix is present', () => {
      expect(normalizeApiUrl('https://my-server.com/api')).toBe('https://my-server.com/api/v1');
    });

    it('defaults to /api/v1 for empty string or undefined', () => {
      expect(normalizeApiUrl('')).toBe('/api/v1');
      expect(normalizeApiUrl(undefined)).toBe('/api/v1');
    });
  });

  describe('API_BASE_URL and token helpers', () => {
    beforeEach(() => {
      sessionStorage.clear();
      setAuthToken(null);
    });

    it('exposes a valid normalized base URL', () => {
      expect(typeof API_BASE_URL).toBe('string');
      expect(API_BASE_URL.endsWith('/api/v1')).toBe(true);
      expect(getApiBaseUrl()).toBe(API_BASE_URL);
    });

    it('stores and retrieves JWT authentication token in session storage', () => {
      setAuthToken('jwt_token_sample');
      expect(getAuthToken()).toBe('jwt_token_sample');
      expect(sessionStorage.getItem('devpulse_token')).toBe('jwt_token_sample');

      setAuthToken(null);
      expect(getAuthToken()).toBeNull();
      expect(sessionStorage.getItem('devpulse_token')).toBeNull();
    });
  });

  describe('extractErrorMessage for gateway and connection issues', () => {
    it('provides clear guidance on 502 Bad Gateway', () => {
      const axiosError = new AxiosError('Request failed with status code 502');
      axiosError.response = {
        data: null,
        status: 502,
        statusText: 'Bad Gateway',
        headers: {},
        config: { headers: new AxiosHeaders() },
      };

      const msg = extractErrorMessage(axiosError);
      expect(msg).toContain('502 Bad Gateway');
      expect(msg).toContain('backend service is not running or unreachable');
    });

    it('provides clear guidance on 503 Service Unavailable', () => {
      const axiosError = new AxiosError('Request failed with status code 503');
      axiosError.response = {
        data: null,
        status: 503,
        statusText: 'Service Unavailable',
        headers: {},
        config: { headers: new AxiosHeaders() },
      };

      const msg = extractErrorMessage(axiosError);
      expect(msg).toContain('503');
      expect(msg).toContain('maintenance or starting up');
    });

    it('provides clear guidance on 504 Gateway Timeout', () => {
      const axiosError = new AxiosError('Request failed with status code 504');
      axiosError.response = {
        data: null,
        status: 504,
        statusText: 'Gateway Timeout',
        headers: {},
        config: { headers: new AxiosHeaders() },
      };

      const msg = extractErrorMessage(axiosError);
      expect(msg).toContain('504');
      expect(msg).toContain('took too long to respond');
    });

    it('provides clear guidance on network disconnect / ERR_NETWORK', () => {
      const axiosError = new AxiosError('Network Error');
      axiosError.code = 'ERR_NETWORK';

      const msg = extractErrorMessage(axiosError);
      expect(msg).toContain('Cannot reach the server');
      expect(msg).toContain('verify your network connection');
    });

    it('provides clear guidance on timeout ECONNABORTED', () => {
      const axiosError = new AxiosError('timeout of 8000ms exceeded');
      axiosError.code = 'ECONNABORTED';

      const msg = extractErrorMessage(axiosError);
      expect(msg).toContain('Connection timed out');
    });
  });
});
