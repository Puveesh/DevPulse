package com.devpulse.auth.oauth;

import com.devpulse.auth.dto.AuthResponse;
import com.devpulse.auth.dto.UserResponse;
import com.devpulse.auth.oauth.dto.ChangePasswordRequest;
import com.devpulse.auth.oauth.dto.GoogleAuthStartRequest;
import com.devpulse.auth.oauth.dto.GoogleAuthStartResponse;
import com.devpulse.auth.oauth.dto.GoogleExchangeRequest;
import com.devpulse.auth.oauth.dto.GoogleLinkStatusResponse;
import com.devpulse.auth.oauth.dto.SetPasswordRequest;
import com.devpulse.common.BadRequestException;
import com.devpulse.common.ConflictException;
import com.devpulse.common.ResourceNotFoundException;
import com.devpulse.common.UnauthorizedException;
import com.devpulse.config.JwtProperties;
import com.devpulse.security.CookieUtils;
import com.devpulse.security.JwtTokenProvider;
import com.devpulse.user.User;
import com.devpulse.user.UserRepository;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

@Service
public class GoogleOAuthService {

    private static final Logger log = LoggerFactory.getLogger(GoogleOAuthService.class);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final GoogleOAuthProperties properties;
    private final GoogleTokenVerifier tokenVerifier;
    private final UserRepository userRepository;
    private final UserAuthIdentityRepository identityRepository;
    private final OAuthSessionRepository sessionRepository;
    private final OAuthTicketRepository ticketRepository;
    private final JwtTokenProvider tokenProvider;
    private final JwtProperties jwtProperties;
    private final CookieUtils cookieUtils;
    private final PasswordEncoder passwordEncoder;

    public GoogleOAuthService(GoogleOAuthProperties properties,
                              GoogleTokenVerifier tokenVerifier,
                              UserRepository userRepository,
                              UserAuthIdentityRepository identityRepository,
                              OAuthSessionRepository sessionRepository,
                              OAuthTicketRepository ticketRepository,
                              JwtTokenProvider tokenProvider,
                              JwtProperties jwtProperties,
                              CookieUtils cookieUtils,
                              PasswordEncoder passwordEncoder) {
        this.properties = properties;
        this.tokenVerifier = tokenVerifier;
        this.userRepository = userRepository;
        this.identityRepository = identityRepository;
        this.sessionRepository = sessionRepository;
        this.ticketRepository = ticketRepository;
        this.tokenProvider = tokenProvider;
        this.jwtProperties = jwtProperties;
        this.cookieUtils = cookieUtils;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public GoogleAuthStartResponse startAuth(GoogleAuthStartRequest request, UUID authenticatedUserId) {
        String action = request.action() != null ? request.action().trim().toUpperCase() : "LOGIN";
        if (!action.equals("LOGIN") && !action.equals("REGISTER") && !action.equals("LINK")) {
            throw new BadRequestException("Invalid action: " + action + ". Supported actions: LOGIN, REGISTER, LINK.");
        }

        if (action.equals("LINK") && authenticatedUserId == null) {
            throw new UnauthorizedException("User must be authenticated to link a Google account.");
        }

        String clientType = "WEB";

        // Generate high-entropy state
        byte[] randomBytes = new byte[24];
        SECURE_RANDOM.nextBytes(randomBytes);
        String stateToken = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

        // Generate RFC 7636 compliant PKCE code_verifier and code_challenge for Google
        byte[] verifierBytes = new byte[32];
        SECURE_RANDOM.nextBytes(verifierBytes);
        String googleCodeVerifier = Base64.getUrlEncoder().withoutPadding().encodeToString(verifierBytes);
        String googleCodeChallenge = generatePkceChallenge(googleCodeVerifier);

        // Store session with pure opaque state and server-side googleCodeVerifier
        OAuthSession session = new OAuthSession(
                stateToken,
                clientType,
                action,
                request.codeChallenge(),
                googleCodeVerifier,
                authenticatedUserId,
                Instant.now().plus(10, ChronoUnit.MINUTES)
        );
        OAuthSession savedSession = sessionRepository.save(session);

        // Send ONLY opaque session ID and stateToken to Google
        String compositeState = savedSession.getId() + ":" + stateToken;

        String authUrl;
        if (!properties.isConfigured()) {
            // Safe fallback URL if Google credentials are not yet configured in environment
            authUrl = UriComponentsBuilder.fromHttpUrl(properties.getRedirectUri())
                    .queryParam("error", "not_configured")
                    .queryParam("error_description", "Google OAuth credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET) are not configured in backend environment.")
                    .queryParam("state", compositeState)
                    .build()
                    .toUriString();
        } else {
            UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl("https://accounts.google.com/o/oauth2/v2/auth")
                    .queryParam("client_id", properties.getClientId())
                    .queryParam("redirect_uri", properties.getRedirectUri())
                    .queryParam("response_type", "code")
                    .queryParam("scope", "openid email profile")
                    .queryParam("state", compositeState)
                    .queryParam("access_type", "online")
                    .queryParam("prompt", "select_account")
                    .queryParam("code_challenge", googleCodeChallenge)
                    .queryParam("code_challenge_method", "S256");

            authUrl = builder.build().toUriString();
        }

        return new GoogleAuthStartResponse(authUrl, stateToken, savedSession.getId().toString());
    }

    @Transactional
    public String handleCallback(String code, String stateParam, String error, String errorDescription) {
        log.info("Processing Google OAuth callback: stateParam={}, error={}", stateParam, error);

        if (stateParam == null || !stateParam.contains(":")) {
            return buildErrorHtmlOrRedirect(null, "INVALID_STATE", "Invalid or missing OAuth state parameter.", "WEB");
        }

        String[] parts = stateParam.split(":", 2);
        UUID sessionId;
        try {
            sessionId = UUID.fromString(parts[0]);
        } catch (IllegalArgumentException e) {
            return buildErrorHtmlOrRedirect(null, "INVALID_STATE", "Malformed OAuth session identifier.", "WEB");
        }
        String stateToken = parts[1];

        Optional<OAuthSession> sessionOpt = sessionRepository.findById(sessionId);
        if (sessionOpt.isEmpty()) {
            return buildErrorHtmlOrRedirect(null, "SESSION_NOT_FOUND", "OAuth session not found or expired.", "WEB");
        }

        OAuthSession session = sessionOpt.get();
        String clientType = session.getClientType();

        if (session.isExpired()) {
            session.setStatus("EXPIRED");
            session.setGoogleCodeVerifier(null);
            sessionRepository.save(session);
            return buildErrorHtmlOrRedirect(stateToken, "SESSION_EXPIRED", "The authentication session has timed out. Please try again.", clientType);
        }

        if (!"PENDING".equals(session.getStatus())) {
            return buildErrorHtmlOrRedirect(stateToken, "SESSION_ALREADY_USED", "This authentication request has already been processed.", clientType);
        }

        // Validate opaque state token matches stored session state exactly
        if (!session.getState().equals(stateToken)) {
            return buildErrorHtmlOrRedirect(stateToken, "STATE_MISMATCH", "OAuth security state mismatch.", clientType);
        }

        // Handle Google error responses (e.g. user cancelled)
        if (error != null && !error.isBlank()) {
            session.setStatus("FAILED");
            session.setGoogleCodeVerifier(null);
            sessionRepository.save(session);
            String desc = (errorDescription != null && !errorDescription.isBlank()) ? errorDescription : "Google authentication was cancelled or denied.";
            return buildErrorHtmlOrRedirect(stateToken, "GOOGLE_AUTH_DENIED", desc, clientType);
        }

        if (code == null || code.isBlank()) {
            session.setStatus("FAILED");
            session.setGoogleCodeVerifier(null);
            sessionRepository.save(session);
            return buildErrorHtmlOrRedirect(stateToken, "MISSING_CODE", "Missing authorization code from Google.", clientType);
        }

        // Retrieve server-side Google PKCE verifier securely bound to this validated session
        String googleCodeVerifier = session.getGoogleCodeVerifier();

        // Exchange code with Google
        GoogleUserInfo googleUser;
        try {
            googleUser = tokenVerifier.exchangeAndVerify(code, properties.getRedirectUri(), googleCodeVerifier);
            if (googleUser == null) {
                googleUser = tokenVerifier.exchangeAndVerify(code, properties.getRedirectUri());
            }
        } catch (Exception ex) {
            log.error("Google token exchange/verification failed: {}", ex.getMessage());
            session.setStatus("FAILED");
            session.setGoogleCodeVerifier(null);
            sessionRepository.save(session);
            return buildErrorHtmlOrRedirect(stateToken, "VERIFICATION_FAILED", ex.getMessage(), clientType);
        }

        // Apply strict login, register, and link rules
        User targetUser;
        String action = session.getAction();

        try {
            if ("LOGIN".equals(action)) {
                // Rule 4.1: Find by Google subject ID in linked identities
                Optional<UserAuthIdentity> identityOpt = identityRepository.findByProviderAndProviderSubject("google", googleUser.sub());
                if (identityOpt.isEmpty()) {
                    // Do NOT silently link by email match!
                    session.setStatus("FAILED");
                    session.setGoogleCodeVerifier(null);
                    sessionRepository.save(session);
                    return buildErrorHtmlOrRedirect(stateToken, "ACCOUNT_NOT_LINKED",
                            "No DevPulse account is linked to this Google account (" + googleUser.email() + "). Please sign up with Google or log in using email/password and connect Google from Settings.", clientType);
                }
                targetUser = identityOpt.get().getUser();

            } else if ("REGISTER".equals(action)) {
                // Rule 4.2: Signup with Google
                Optional<UserAuthIdentity> identityOpt = identityRepository.findByProviderAndProviderSubject("google", googleUser.sub());
                if (identityOpt.isPresent()) {
                    session.setStatus("FAILED");
                    session.setGoogleCodeVerifier(null);
                    sessionRepository.save(session);
                    return buildErrorHtmlOrRedirect(stateToken, "ACCOUNT_ALREADY_EXISTS",
                            "An account is already linked to this Google account. Please use Continue with Google on the Sign In screen.", clientType);
                }

                if (userRepository.existsByEmail(googleUser.email())) {
                    session.setStatus("FAILED");
                    session.setGoogleCodeVerifier(null);
                    sessionRepository.save(session);
                    return buildErrorHtmlOrRedirect(stateToken, "EMAIL_ALREADY_REGISTERED",
                            "An account already exists with email " + googleUser.email() + ". Please sign in with your password and connect Google in Settings.", clientType);
                }

                // Create new DevPulse user using existing User model
                User newUser = new User(googleUser.email(), null, googleUser.name());
                if (googleUser.picture() != null && !googleUser.picture().isBlank()) {
                    newUser.setProfileImage(googleUser.picture());
                }
                targetUser = userRepository.save(newUser);

                // Create linked identity record
                UserAuthIdentity identity = new UserAuthIdentity(
                        targetUser,
                        "google",
                        googleUser.sub(),
                        googleUser.email(),
                        googleUser.emailVerified()
                );
                identityRepository.save(identity);

            } else if ("LINK".equals(action)) {
                // Rule 6: Account linking from Settings
                UUID currentUserId = session.getUserId();
                if (currentUserId == null) {
                    session.setStatus("FAILED");
                    session.setGoogleCodeVerifier(null);
                    sessionRepository.save(session);
                    return buildErrorHtmlOrRedirect(stateToken, "UNAUTHORIZED", "Authentication required to link account.", clientType);
                }

                targetUser = userRepository.findById(currentUserId)
                        .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + currentUserId));

                // Check if this Google subject is linked to another DevPulse user
                Optional<UserAuthIdentity> existingIdentity = identityRepository.findByProviderAndProviderSubject("google", googleUser.sub());
                if (existingIdentity.isPresent() && !existingIdentity.get().getUser().getId().equals(currentUserId)) {
                    session.setStatus("FAILED");
                    session.setGoogleCodeVerifier(null);
                    sessionRepository.save(session);
                    return buildErrorHtmlOrRedirect(stateToken, "GOOGLE_ALREADY_LINKED",
                            "This Google account is already linked to another DevPulse user account.", clientType);
                }

                // If not already linked to current user, save identity
                if (existingIdentity.isEmpty()) {
                    UserAuthIdentity newIdentity = new UserAuthIdentity(
                            targetUser,
                            "google",
                            googleUser.sub(),
                            googleUser.email(),
                            googleUser.emailVerified()
                    );
                    identityRepository.save(newIdentity);
                }
            } else {
                session.setStatus("FAILED");
                session.setGoogleCodeVerifier(null);
                sessionRepository.save(session);
                return buildErrorHtmlOrRedirect(stateToken, "INVALID_ACTION", "Unknown action: " + action, clientType);
            }

        } catch (Exception ex) {
            log.error("Error executing OAuth action {}: {}", action, ex.getMessage());
            session.setStatus("FAILED");
            session.setGoogleCodeVerifier(null);
            sessionRepository.save(session);
            return buildErrorHtmlOrRedirect(stateToken, "OPERATION_FAILED", ex.getMessage(), clientType);
        }

        // Generate single-use, short-lived ticket
        byte[] ticketBytes = new byte[32];
        SECURE_RANDOM.nextBytes(ticketBytes);
        String rawTicket = "dpt_" + Base64.getUrlEncoder().withoutPadding().encodeToString(ticketBytes);
        String ticketHash = sha256Hex(rawTicket);

        OAuthTicket ticket = new OAuthTicket(
                ticketHash,
                targetUser.getId(),
                action,
                session.getCodeChallenge(),
                Instant.now().plus(2, ChronoUnit.MINUTES)
        );
        ticketRepository.save(ticket);

        session.setStatus("COMPLETED");
        session.setGoogleCodeVerifier(null);
        sessionRepository.save(session);

        return buildSuccessHtmlOrRedirect(rawTicket, stateToken, action, clientType);
    }

    @Transactional
    public AuthResponse exchangeTicket(GoogleExchangeRequest request, HttpServletResponse response) {
        String ticketHash = sha256Hex(request.ticket());

        OAuthTicket ticket = ticketRepository.findByTicketHash(ticketHash)
                .orElseThrow(() -> new UnauthorizedException("Invalid or unrecognized authentication ticket."));

        if (ticket.isConsumed()) {
            throw new UnauthorizedException("Authentication ticket has already been used. Please authenticate again.");
        }

        if (ticket.isExpired()) {
            throw new UnauthorizedException("Authentication ticket has expired. Please authenticate again.");
        }

        // Immediately consume ticket to prevent replay attacks
        ticket.setConsumed(true);
        ticketRepository.save(ticket);

        // Validate PKCE code_challenge if present
        if (ticket.getCodeChallenge() != null && !ticket.getCodeChallenge().isBlank()) {
            if (request.codeVerifier() == null || !verifyPkce(request.codeVerifier(), ticket.getCodeChallenge())) {
                throw new UnauthorizedException("PKCE verification failed: invalid code_verifier.");
            }
        }

        User user = userRepository.findById(ticket.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + ticket.getUserId()));

        String token = tokenProvider.generateTokenFromUserId(user.getId(), user.getEmail());
        if (response != null) {
            cookieUtils.addAuthCookie(response, token);
        }

        Optional<UserAuthIdentity> identity = identityRepository.findByUserIdAndProvider(user.getId(), "google");
        UserResponse userResponse = UserResponse.fromUser(
                user,
                identity.isPresent(),
                identity.map(UserAuthIdentity::getProviderEmail).orElse(null)
        );

        return AuthResponse.of(token, jwtProperties.getExpirationMs(), userResponse);
    }

    @Transactional(readOnly = true)
    public GoogleLinkStatusResponse getLinkStatus(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Optional<UserAuthIdentity> identity = identityRepository.findByUserIdAndProvider(userId, "google");
        return new GoogleLinkStatusResponse(
                identity.isPresent(),
                identity.map(UserAuthIdentity::getProviderEmail).orElse(null),
                user.hasPassword()
        );
    }

    @Transactional
    public void unlinkGoogle(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        // Rule 6: Before disconnecting Google, ensure the account still has another valid login method
        if (!user.hasPassword()) {
            throw new BadRequestException("Cannot disconnect Google account: Your account does not have a password configured. Please set a password in Settings first.");
        }

        identityRepository.deleteByUserIdAndProvider(userId, "google");
        log.info("Disconnected Google account for user: {}", userId);
    }

    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (!user.hasPassword()) {
            throw new BadRequestException("This account was created exclusively via Google and has no existing password. Please use 'Set Password' instead.");
        }

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect.");
        }

        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new BadRequestException("New password and confirm password do not match.");
        }

        if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
            throw new BadRequestException("New password cannot be the same as your current password.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        log.info("Password successfully changed for user: {}", userId);
    }

    @Transactional
    public void setPassword(UUID userId, SetPasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (user.hasPassword()) {
            throw new BadRequestException("A password is already configured for this account. Please use 'Change Password' instead.");
        }

        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new BadRequestException("Password and confirm password do not match.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        log.info("Password successfully set for Google-only user: {}", userId);
    }

    public static String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 algorithm unavailable", e);
        }
    }

    public static String generatePkceChallenge(String codeVerifier) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(codeVerifier.getBytes(StandardCharsets.US_ASCII));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 algorithm unavailable for PKCE", e);
        }
    }

    public static boolean verifyPkce(String codeVerifier, String codeChallenge) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(codeVerifier.getBytes(StandardCharsets.US_ASCII));
            String computedChallenge = Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
            return computedChallenge.equals(codeChallenge);
        } catch (Exception e) {
            return false;
        }
    }

    private String buildSuccessHtmlOrRedirect(String ticket, String state, String action, String clientType) {
        String targetUrl = properties.getWebCallbackUri() + "?ticket=" + urlEncode(ticket) + "&state=" + urlEncode(state) + "&action=" + urlEncode(action);

        return "<!DOCTYPE html>\n" +
                "<html lang=\"en\">\n" +
                "<head>\n" +
                "  <meta charset=\"UTF-8\">\n" +
                "  <meta http-equiv=\"refresh\" content=\"0;url=" + targetUrl + "\">\n" +
                "  <title>DevPulse - Authentication Successful</title>\n" +
                "  <style>\n" +
                "    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #090a0f; color: #e4e4e7; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }\n" +
                "    .card { background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 32px; max-width: 440px; text-align: center; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }\n" +
                "    .icon { width: 48px; height: 48px; background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; color: #3b82f6; font-size: 24px; }\n" +
                "    h1 { font-size: 20px; font-weight: 600; margin: 0 0 8px 0; color: #ffffff; }\n" +
                "    p { font-size: 14px; color: #a1a1aa; line-height: 1.5; margin: 0 0 20px 0; }\n" +
                "    .btn { display: inline-block; background: #2563eb; color: #ffffff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 14px; transition: background 0.2s; }\n" +
                "    .btn:hover { background: #1d4ed8; }\n" +
                "  </style>\n" +
                "  <script>\n" +
                "    window.onload = function() { window.location.href = '" + targetUrl + "'; };\n" +
                "  </script>\n" +
                "</head>\n" +
                "<body>\n" +
                "  <div class=\"card\">\n" +
                "    <div class=\"icon\">&#10003;</div>\n" +
                "    <h1>Authentication Successful</h1>\n" +
                "    <p>Returning you to DevPulse. If your browser does not redirect automatically, click the button below.</p>\n" +
                "    <a href=\"" + targetUrl + "\" class=\"btn\">Open DevPulse</a>\n" +
                "  </div>\n" +
                "</body>\n" +
                "</html>";
    }

    private String buildErrorHtmlOrRedirect(String state, String error, String message, String clientType) {
        String targetUrl = properties.getWebCallbackUri() + "?error=" + urlEncode(error) + "&message=" + urlEncode(message) + (state != null ? "&state=" + urlEncode(state) : "");

        return "<!DOCTYPE html>\n" +
                "<html lang=\"en\">\n" +
                "<head>\n" +
                "  <meta charset=\"UTF-8\">\n" +
                "  <meta http-equiv=\"refresh\" content=\"1;url=" + targetUrl + "\">\n" +
                "  <title>DevPulse - Authentication Notice</title>\n" +
                "  <style>\n" +
                "    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #090a0f; color: #e4e4e7; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }\n" +
                "    .card { background: #18181b; border: 1px solid #3f3f46; border-radius: 12px; padding: 32px; max-width: 440px; text-align: center; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }\n" +
                "    .icon { width: 48px; height: 48px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; color: #ef4444; font-size: 24px; }\n" +
                "    h1 { font-size: 20px; font-weight: 600; margin: 0 0 8px 0; color: #ffffff; }\n" +
                "    p { font-size: 14px; color: #a1a1aa; line-height: 1.5; margin: 0 0 20px 0; }\n" +
                "    .btn { display: inline-block; background: #3f3f46; color: #ffffff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 14px; }\n" +
                "  </style>\n" +
                "  <script>\n" +
                "    window.onload = function() { window.location.href = '" + targetUrl + "'; };\n" +
                "  </script>\n" +
                "</head>\n" +
                "<body>\n" +
                "  <div class=\"card\">\n" +
                "    <div class=\"icon\">&#9888;</div>\n" +
                "    <h1>Authentication Notice</h1>\n" +
                "    <p>" + message + "</p>\n" +
                "    <a href=\"" + targetUrl + "\" class=\"btn\">Return to DevPulse</a>\n" +
                "  </div>\n" +
                "</body>\n" +
                "</html>";
    }

    private static String urlEncode(String value) {
        if (value == null) return "";
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
