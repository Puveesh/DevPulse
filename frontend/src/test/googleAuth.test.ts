import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateRandomString, generateCodeChallenge } from '../features/auth/pkce';
import { initiateGoogleOAuth, exchangeOAuthTicket, cancelGoogleOAuth, isOAuthInProgress } from '../features/auth/googleAuth';
import { getInitials } from '../lib/utils';
import apiClient from '../lib/api';

vi.mock('../lib/api', () => {
  return {
    default: {
      post: vi.fn(),
      get: vi.fn(),
      delete: vi.fn(),
    },
    extractErrorMessage: (err: unknown) => (err instanceof Error ? err.message : 'Unknown error'),
    setAuthToken: vi.fn(),
    getAuthToken: vi.fn(),
  };
});

describe('Google OAuth PKCE Utilities', () => {
  it('generates random strings of requested length matching OAuth safe character set', () => {
    const s1 = generateRandomString(43);
    const s2 = generateRandomString(64);

    expect(s1).toHaveLength(43);
    expect(s2).toHaveLength(64);
    expect(s1).not.toBe(s2);

    // Characters must be unreserved [A-Za-z0-9-._~]
    expect(/^[A-Za-z0-9\-._~]+$/.test(s1)).toBe(true);
  });

  it('generates a valid base64url SHA-256 code challenge without padding', async () => {
    const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
    const challenge = await generateCodeChallenge(verifier);

    expect(typeof challenge).toBe('string');
    expect(challenge.length).toBeGreaterThan(20);
    // Base64url must not contain +, /, or =
    expect(challenge.includes('+')).toBe(false);
    expect(challenge.includes('/')).toBe(false);
    expect(challenge.includes('=')).toBe(false);
  });
});

describe('initiateGoogleOAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('calls start endpoint with PKCE challenge and redirects browser to Google in web app', async () => {
    const mockPost = vi.mocked(apiClient.post);
    mockPost.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth?test=1',
          state: 'state_123',
          sessionId: 'session_abc',
        },
      },
    } as any);

    // Mock window.location
    const originalLocation = window.location;
    // @ts-expect-error Mocking window.location for test
    delete window.location;
    window.location = { ...originalLocation, href: '' } as any;

    await initiateGoogleOAuth({ action: 'LOGIN' });

    expect(mockPost).toHaveBeenCalledWith('/auth/google/start', expect.objectContaining({
      action: 'LOGIN',
      clientType: 'WEB',
      codeChallenge: expect.any(String),
    }));

    expect(window.location.href).toBe('https://accounts.google.com/o/oauth2/v2/auth?test=1');
    expect(sessionStorage.getItem('devpulse_oauth_state')).toBe('state_123');
    expect(sessionStorage.getItem('devpulse_oauth_verifier')).toBeTruthy();
    expect(isOAuthInProgress()).toBe(true);

    window.location = originalLocation;
  });

  it('uses /account/google/link/start when action is LINK', async () => {
    const mockPost = vi.mocked(apiClient.post);
    mockPost.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth?link=1',
          state: 'link_state',
          sessionId: 'session_link',
        },
      },
    } as any);

    const originalLocation = window.location;
    // @ts-expect-error Mocking window.location for test
    delete window.location;
    window.location = { ...originalLocation, href: '' } as any;

    await initiateGoogleOAuth({ action: 'LINK' });

    expect(mockPost).toHaveBeenCalledWith('/account/google/link/start', expect.objectContaining({
      action: 'LINK',
      clientType: 'WEB',
    }));

    expect(window.location.href).toBe('https://accounts.google.com/o/oauth2/v2/auth?link=1');

    window.location = originalLocation;
  });
});

describe('cancelGoogleOAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('cancelGoogleOAuth cleans up session storage and dispatches devpulse:oauth-result with failure', () => {
    sessionStorage.setItem('devpulse_oauth_in_progress', 'true');
    sessionStorage.setItem('devpulse_oauth_verifier', 'ver');
    sessionStorage.setItem('devpulse_oauth_state', 'st');

    const listener = vi.fn();
    window.addEventListener('devpulse:oauth-result', listener);

    cancelGoogleOAuth('Custom cancellation message');

    expect(sessionStorage.getItem('devpulse_oauth_in_progress')).toBeNull();
    expect(sessionStorage.getItem('devpulse_oauth_verifier')).toBeNull();
    expect(sessionStorage.getItem('devpulse_oauth_state')).toBeNull();
    expect(listener).toHaveBeenCalled();
    const event = listener.mock.calls[0][0] as CustomEvent;
    expect(event.detail.success).toBe(false);
    expect(event.detail.error).toBe('Custom cancellation message');

    window.removeEventListener('devpulse:oauth-result', listener);
  });
});

describe('exchangeOAuthTicket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('sends ticket, codeVerifier, and state to backend exchange endpoint', async () => {
    sessionStorage.setItem('devpulse_oauth_verifier', 'test_verifier');
    sessionStorage.setItem('devpulse_oauth_state', 'expected_state');

    const mockPost = vi.mocked(apiClient.post);
    mockPost.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          accessToken: 'jwt_token_xyz',
          tokenType: 'Bearer',
          expiresInMs: 86400000,
          user: { id: 'u1', email: 'test@devpulse.io' },
        },
      },
    } as any);

    const result = await exchangeOAuthTicket('dpt_ticket_123', 'expected_state');

    expect(mockPost).toHaveBeenCalledWith('/auth/google/exchange', {
      ticket: 'dpt_ticket_123',
      codeVerifier: 'test_verifier',
      state: 'expected_state',
    });

    expect(result.accessToken).toBe('jwt_token_xyz');
    // Session storage should be cleaned up
    expect(sessionStorage.getItem('devpulse_oauth_verifier')).toBeNull();
  });

  it('throws an error if state does not match stored state', async () => {
    sessionStorage.setItem('devpulse_oauth_verifier', 'test_verifier');
    sessionStorage.setItem('devpulse_oauth_state', 'original_state');

    await expect(exchangeOAuthTicket('dpt_ticket_123', 'tampered_state')).rejects.toThrow(
      'OAuth security state verification mismatch'
    );
  });
});

describe('Avatar Initials Generation (getInitials)', () => {
  it('extracts "TU" for camelCase "testUser" without profile photo', () => {
    expect(getInitials('testUser')).toBe('TU');
  });

  it('extracts "TU" for PascalCase "TestUser"', () => {
    expect(getInitials('TestUser')).toBe('TU');
  });

  it('extracts initials for delimited names (test_user, test-user, test.user)', () => {
    expect(getInitials('test_user')).toBe('TU');
    expect(getInitials('test-user')).toBe('TU');
    expect(getInitials('test.user')).toBe('TU');
  });

  it('extracts first and last initials for space-separated names', () => {
    expect(getInitials('Jane Doe')).toBe('JD');
    expect(getInitials('John Robert Smith')).toBe('JR');
  });

  it('handles single capitalized names and fallbacks', () => {
    expect(getInitials('Alice')).toBe('A');
    expect(getInitials('A')).toBe('A');
    expect(getInitials('')).toBe('U');
    expect(getInitials(null)).toBe('U');
    expect(getInitials(undefined)).toBe('U');
  });
});
