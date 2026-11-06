import { describe, it, expect } from 'vitest';
import { extractErrorMessage } from '../lib/api';
import { AxiosError, AxiosHeaders } from 'axios';

describe('API Error Handling and Extraction', () => {
  it('extracts field validation errors when present', () => {
    const axiosError = new AxiosError('Bad Request');
    axiosError.response = {
      data: {
        success: false,
        status: 400,
        error: 'Bad Request',
        message: 'Validation failed',
        path: '/api/v1/auth/register',
        validationErrors: [
          { field: 'email', message: 'Invalid email format' },
          { field: 'password', message: 'Password must be between 8 and 100 characters' },
        ],
        timestamp: new Date().toISOString(),
      },
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: { headers: new AxiosHeaders() },
    };

    const message = extractErrorMessage(axiosError);
    expect(message).toContain('email: Invalid email format');
    expect(message).toContain('password: Password must be between 8 and 100 characters');
  });

  it('extracts root message if validationErrors is empty', () => {
    const axiosError = new AxiosError('Unauthorized');
    axiosError.response = {
      data: {
        success: false,
        status: 401,
        error: 'Unauthorized',
        message: 'Invalid email or password',
        path: '/api/v1/auth/login',
        timestamp: new Date().toISOString(),
      },
      status: 401,
      statusText: 'Unauthorized',
      headers: {},
      config: { headers: new AxiosHeaders() },
    };

    const message = extractErrorMessage(axiosError);
    expect(message).toBe('Invalid email or password');
  });

  it('falls back to standard Error message when response is empty', () => {
    const standardError = new Error('Network timeout');
    const message = extractErrorMessage(standardError);
    expect(message).toBe('Network timeout');
  });
});

