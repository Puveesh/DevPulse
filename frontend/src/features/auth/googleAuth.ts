import apiClient, { extractErrorMessage } from '../../lib/api';
import { generateRandomString, generateCodeChallenge } from './pkce';
import type { ApiResponse } from '../../types';

export interface StartGoogleOAuthOptions {
  action: 'LOGIN' | 'REGISTER' | 'LINK';
  onStart?: () => void;
  onError?: (errorMessage: string) => void;
}

export function isOAuthInProgress(): boolean {
  return typeof window !== 'undefined' && sessionStorage.getItem('devpulse_oauth_in_progress') === 'true';
}

export function cancelGoogleOAuth(reason?: string): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('devpulse_oauth_in_progress');
    sessionStorage.removeItem('devpulse_oauth_verifier');
    sessionStorage.removeItem('devpulse_oauth_state');
    sessionStorage.removeItem('devpulse_oauth_action');

    window.dispatchEvent(
      new CustomEvent('devpulse:oauth-result', {
        detail: {
          success: false,
          error: reason || 'Google sign-in was canceled. Please try again.',
        },
      })
    );
  }
}

export function clearOAuthProgress(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('devpulse_oauth_in_progress');
    sessionStorage.removeItem('devpulse_oauth_verifier');
    sessionStorage.removeItem('devpulse_oauth_state');
    sessionStorage.removeItem('devpulse_oauth_action');
  }
}

export async function initiateGoogleOAuth({ action, onStart, onError }: StartGoogleOAuthOptions): Promise<void> {
  try {
    if (onStart) onStart();

    const codeVerifier = generateRandomString(64);
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('devpulse_oauth_in_progress', 'true');
      sessionStorage.setItem('devpulse_oauth_verifier', codeVerifier);
      sessionStorage.setItem('devpulse_oauth_action', action);
    }

    const endpoint = action === 'LINK' ? '/account/google/link/start' : '/auth/google/start';

    const res = await apiClient.post<ApiResponse<{ authorizationUrl: string; state: string; sessionId: string }>>(
      endpoint,
      {
        action,
        clientType: 'WEB',
        codeChallenge,
      }
    );

    if (!res.data?.success || !res.data.data?.authorizationUrl) {
      throw new Error(res.data?.message || 'Failed to initialize Google OAuth session.');
    }

    const { authorizationUrl, state } = res.data.data;
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('devpulse_oauth_state', state);
      // Standard web browser redirection to Google OAuth consent
      window.location.href = authorizationUrl;
    }
  } catch (err) {
    const message = extractErrorMessage(err);
    cancelGoogleOAuth(message);
    if (onError) {
      onError(message);
    } else {
      console.error('Google OAuth initialization failed:', message);
    }
    throw new Error(message);
  }
}
