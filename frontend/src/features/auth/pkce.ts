/**
 * PKCE (Proof Key for Code Exchange) Utilities for OAuth 2.0
 */

export function generateRandomString(length: number = 43): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const values = new Uint8Array(length);
  crypto.getRandomValues(values);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset[values[i] % charset.length];
  }
  return result;
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
  // Convert standard base64 to base64url (no padding, replace + with -, / with _)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
