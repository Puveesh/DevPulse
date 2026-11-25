# Google OAuth 2.0 Integration & Setup Guide (Web Application)

This guide provides step-by-step instructions for configuring Google Cloud credentials and running Google OAuth 2.0 with the DevPulse standard web application.

---

## 1. Overview of the Authentication Architecture

DevPulse uses a **dual-method, centralized authentication model**:
- **Email & Password:** Standard BCrypt password verification with JWT issuance.
- **Google OAuth 2.0:** External identity provider for single sign-on (SSO), registration, and account linking.

### Key Security Principles:
- **Centralized Spring Boot Token Issuance:** Google authentication tokens are processed, validated, and mapped exclusively by your local Spring Boot backend. No third-party BaaS (Firebase, Supabase, Auth0) is used.
- **Stable Identity Mapping:** Accounts are linked using Google's immutable subject identifier (`sub`), never mutable email strings alone.
- **No Silent Account Merging:** An existing email/password account is never automatically merged with an incoming Google login. Users must explicitly link Google from the DevPulse Settings page.
- **Web Authorization Code Flow with Centralized JWT Issuance:**
  1. Frontend calls `/api/v1/auth/google/start` (with action: `LOGIN`, `REGISTER`, or `LINK`).
  2. Spring Boot creates `OAuthSession` with PKCE challenge for Google and returns Google's OAuth consent URL.
  3. User completes Google authentication.
  4. Google redirects back to Spring Boot `/api/v1/auth/google/callback`.
  5. Spring Boot verifies authorization code with Google, checks account linkage rules, creates/links user, generates JWT session, sets HTTP-only `devpulse_token` cookie, and issues an HTTP 302 redirect directly to the frontend dashboard (`/dashboard?token=...`) or settings (`/settings?linked=google`).
  6. The user lands directly on the DevPulse dashboard, fully authenticated.

---

## 2. Google Cloud Console Setup

### Step 1: Create or Select a Google Cloud Project
1. Navigate to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown at the top of the page and select **New Project**.
3. Name your project (e.g., `DevPulse-App`) and click **Create**.

### Step 2: Configure the OAuth Consent Screen
1. In the left navigation, go to **APIs & Services** > **OAuth consent screen**.
2. Select **External** user type (or **Internal** if using a Google Workspace organization) and click **Create**.
3. Fill in the required application details:
   - **App name:** `DevPulse`
   - **User support email:** Your email address
   - **Developer contact information:** Your email address
4. Click **Save and Continue**.
5. Under **Scopes**, click **Add or Remove Scopes** and select:
   - `.../auth/userinfo.email` (See your primary Google Account email address)
   - `.../auth/userinfo.profile` (See your personal info, including any personal info you've made publicly available)
   - `openid` (Associate you with your personal info on Google)
6. Click **Update** and then **Save and Continue**.
7. Under **Test Users** (if project status is "Testing"):
   - Click **Add Users** and add the Gmail addresses you intend to use for local development and testing.
8. Click **Save and Continue** to finish the consent screen configuration.

### Step 3: Create OAuth 2.0 Client Credentials
1. In the left navigation, go to **APIs & Services** > **Credentials**.
2. Click **+ Create Credentials** at the top and select **OAuth client ID**.
3. For **Application type**, select **Web application**.
4. In the configuration:
   - **Name:** `DevPulse Web OAuth Client`
   - **Authorized JavaScript origins:**
     - `http://localhost:5173` (Vite Web dev server)
     - `http://localhost:8081` (Spring Boot API server)
   - **Authorized redirect URIs:**
     - `http://localhost:8081/api/v1/auth/google/callback`
5. Click **Create**.
6. A dialog will appear displaying your:
   - **Client ID** (e.g., `1234567890-abcdef.apps.googleusercontent.com`)
   - **Client Secret** (e.g., your Google Cloud Client Secret)
7. Copy both values securely.

---

## 3. Environment Variables Configuration

Configure the Google OAuth credentials in your backend environment (`backend/.env` or root `.env`):

```bash
# Google OAuth 2.0 Credentials
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8081/api/v1/auth/google/callback

# Web Application Callback URI
WEB_CALLBACK_URI=http://localhost:5173/dashboard
```

> **Security Note:** Never commit `GOOGLE_CLIENT_SECRET` to version control. The client secret is only known to the Spring Boot backend and is never exposed in frontend source code.

---

## 4. Web Application Authentication Flow

```
User clicks "Continue with Google"
  └─> POST /api/v1/auth/google/start
        └─> Spring Boot creates OAuthSession, returns Google auth URL
              └─> Browser redirects to accounts.google.com
                    └─> User completes Google authentication
                          └─> Google redirects to GET /api/v1/auth/google/callback?code=...&state=...
                                └─> Spring Boot verifies code, authenticates/creates user
                                      └─> Sets HTTP-only auth cookie and issues 302 redirect
                                            └─> Directly opens http://localhost:5173/dashboard
```

---

## 5. Testing the Implementation

### 1. Traditional Email/Password Auth
1. Start MySQL (`localhost:3306/devpulse`).
2. Start the backend: `npm run dev:backend`.
3. Start the frontend: `npm run dev`.
4. Register a new user with email and password.
5. Log out and sign back in.

### 2. Google Sign-In & Sign-Up
1. On the Login screen, click **Continue with Google**.
2. If the Google account is not yet registered or linked, DevPulse displays an informative prompt explaining that no account is linked, and invites you to Sign Up or log in and link from Settings.
3. On the Register screen, click **Sign up with Google**. Your account is created with your verified Google profile and logs you directly into the dashboard.

### 3. Account Linking in Settings
1. Log in with an email/password account.
2. Navigate to **Settings** > **Connected Accounts**.
3. Under Google Account, click **Connect Google Account**.
4. Complete Google authentication in the browser.
5. On return, the status updates to **Connected** showing your linked Google email.
6. Log out. You can now sign in using **either** Continue with Google or your original email/password.

### 4. Password Management
1. In **Settings** > **Change Password**:
   - For password-enabled accounts: Enter Current Password, New Password, and Confirm New Password.
   - For Google-only accounts: Enter New Password and Confirm New Password to enable email/password sign-in alongside Google.
2. In **Connected Accounts**:
   - Attempting to disconnect Google when no password has been configured is prevented to avoid account lockout.
