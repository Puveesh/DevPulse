package com.devpulse.auth;

import com.devpulse.auth.dto.LoginRequest;
import com.devpulse.auth.oauth.GoogleOAuthService;
import com.devpulse.auth.oauth.GoogleTokenVerifier;
import com.devpulse.auth.oauth.GoogleUserInfo;
import com.devpulse.auth.oauth.OAuthSession;
import com.devpulse.auth.oauth.OAuthSessionRepository;
import com.devpulse.auth.oauth.OAuthTicket;
import com.devpulse.auth.oauth.OAuthTicketRepository;
import com.devpulse.auth.oauth.UserAuthIdentity;
import com.devpulse.auth.oauth.UserAuthIdentityRepository;
import com.devpulse.auth.oauth.dto.ChangePasswordRequest;
import com.devpulse.auth.oauth.dto.GoogleAuthStartRequest;
import com.devpulse.auth.oauth.dto.GoogleExchangeRequest;
import com.devpulse.auth.oauth.dto.SetPasswordRequest;
import com.devpulse.security.JwtTokenProvider;
import com.devpulse.user.User;
import com.devpulse.user.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class GoogleOAuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserAuthIdentityRepository identityRepository;

    @Autowired
    private OAuthSessionRepository sessionRepository;

    @Autowired
    private OAuthTicketRepository ticketRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockitoBean
    private GoogleTokenVerifier googleTokenVerifier;

    @BeforeEach
    void setUp() {
        ticketRepository.deleteAll();
        sessionRepository.deleteAll();
        identityRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void testGoogleAuthStartSuccess() throws Exception {
        GoogleAuthStartRequest request = new GoogleAuthStartRequest("LOGIN", "WEB", "challenge123");

        mockMvc.perform(post("/api/v1/auth/google/start")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.authorizationUrl", notNullValue()))
                .andExpect(jsonPath("$.data.state", notNullValue()))
                .andExpect(jsonPath("$.data.sessionId", notNullValue()));
    }

    @Test
    void testGoogleLoginWhenNotLinkedFailsCleanlyWithoutSilentMerging() throws Exception {
        // Prepare pending session
        OAuthSession session = new OAuthSession("test-state", "WEB", "LOGIN", null, null, Instant.now().plus(10, ChronoUnit.MINUTES));
        session = sessionRepository.save(session);

        when(googleTokenVerifier.exchangeAndVerify(anyString(), anyString()))
                .thenReturn(new GoogleUserInfo("google-sub-999", "unlinked@gmail.com", true, "Unlinked User", null));

        mockMvc.perform(get("/api/v1/auth/google/callback")
                        .param("code", "auth-code-123")
                        .param("state", session.getId() + ":test-state"))
                .andExpect(status().isOk())
                .andExpect(result -> {
                    String html = result.getResponse().getContentAsString();
                    assertTrue(html.contains("ACCOUNT_NOT_LINKED"));
                    assertTrue(html.contains("No DevPulse account is linked"));
                });

        // Verify no user was created
        assertFalse(userRepository.existsByEmail("unlinked@gmail.com"));
    }

    @Test
    void testGoogleLoginWhenLinkedSucceedsAndIssuesTicket() throws Exception {
        // Create user and link Google identity
        User user = new User("developer@gmail.com", passwordEncoder.encode("Password123!"), "Google Developer");
        user = userRepository.save(user);

        UserAuthIdentity identity = new UserAuthIdentity(user, "google", "google-sub-100", "developer@gmail.com", true);
        identityRepository.save(identity);

        OAuthSession session = new OAuthSession("valid-state", "WEB", "LOGIN", null, null, Instant.now().plus(10, ChronoUnit.MINUTES));
        session = sessionRepository.save(session);

        when(googleTokenVerifier.exchangeAndVerify(anyString(), anyString()))
                .thenReturn(new GoogleUserInfo("google-sub-100", "developer@gmail.com", true, "Google Developer", null));

        mockMvc.perform(get("/api/v1/auth/google/callback")
                        .param("code", "auth-code-123")
                        .param("state", session.getId() + ":valid-state"))
                .andExpect(status().isOk())
                .andExpect(result -> {
                    String html = result.getResponse().getContentAsString();
                    assertTrue(html.contains("Authentication Successful"));
                    assertTrue(html.contains("dpt_"));
                });
    }

    @Test
    void testGoogleSignupCreatesUserAndIdentity() throws Exception {
        OAuthSession session = new OAuthSession("signup-state", "WEB", "REGISTER", null, null, Instant.now().plus(10, ChronoUnit.MINUTES));
        session = sessionRepository.save(session);

        when(googleTokenVerifier.exchangeAndVerify(anyString(), anyString()))
                .thenReturn(new GoogleUserInfo("google-sub-200", "newuser@gmail.com", true, "New Google Dev", "https://avatar.url/img.png"));

        mockMvc.perform(get("/api/v1/auth/google/callback")
                        .param("code", "auth-code-123")
                        .param("state", session.getId() + ":signup-state"))
                .andExpect(status().isOk())
                .andExpect(result -> {
                    String html = result.getResponse().getContentAsString();
                    assertTrue(html.contains("Authentication Successful"));
                    assertTrue(html.contains("dpt_"));
                });

        // Verify user and identity were created
        User createdUser = userRepository.findByEmail("newuser@gmail.com").orElse(null);
        assertTrue(createdUser != null);
        assertFalse(createdUser.hasPassword()); // Google-only account initially has no password

        assertTrue(identityRepository.existsByProviderAndProviderSubject("google", "google-sub-200"));
    }

    @Test
    void testGoogleSignupWhenEmailAlreadyExistsRejectsWithoutDuplicate() throws Exception {
        // User already registered via password
        User existingUser = new User("existing@devpulse.io", passwordEncoder.encode("Secret123!"), "Existing User");
        userRepository.save(existingUser);

        OAuthSession session = new OAuthSession("signup-state", "WEB", "REGISTER", null, null, Instant.now().plus(10, ChronoUnit.MINUTES));
        session = sessionRepository.save(session);

        when(googleTokenVerifier.exchangeAndVerify(anyString(), anyString()))
                .thenReturn(new GoogleUserInfo("google-sub-300", "existing@devpulse.io", true, "Existing User", null));

        mockMvc.perform(get("/api/v1/auth/google/callback")
                        .param("code", "auth-code-123")
                        .param("state", session.getId() + ":signup-state"))
                .andExpect(status().isOk())
                .andExpect(result -> {
                    String html = result.getResponse().getContentAsString();
                    assertTrue(html.contains("EMAIL_ALREADY_REGISTERED"));
                });

        // Verify Google identity was NOT silently linked
        assertFalse(identityRepository.existsByProviderAndProviderSubject("google", "google-sub-300"));
    }

    @Test
    void testTicketExchangeSuccessAndSingleUseConstraint() throws Exception {
        User user = new User("ticketuser@gmail.com", null, "Ticket User");
        user = userRepository.save(user);

        String rawTicket = "dpt_secret_ticket_123456789";
        String ticketHash = GoogleOAuthService.sha256Hex(rawTicket);

        OAuthTicket ticket = new OAuthTicket(ticketHash, user.getId(), "LOGIN", null, Instant.now().plus(2, ChronoUnit.MINUTES));
        ticketRepository.save(ticket);

        GoogleExchangeRequest request = new GoogleExchangeRequest(rawTicket, null, "any-state");

        // 1. First exchange should succeed and return JWT
        mockMvc.perform(post("/api/v1/auth/google/exchange")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                .andExpect(jsonPath("$.data.user.email", is("ticketuser@gmail.com")));

        // 2. Second exchange with same ticket must be rejected (single-use)
        mockMvc.perform(post("/api/v1/auth/google/exchange")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testGoogleOnlyUserCannotLoginWithPasswordUntilPasswordIsSet() throws Exception {
        User user = new User("googleonly@devpulse.io", null, "Google Only User");
        userRepository.save(user);

        LoginRequest loginRequest = new LoginRequest("googleonly@devpulse.io", "RandomPassword123!");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("This account was created via Google and has no password")));
    }

    @Test
    void testSetPasswordForGoogleOnlyUserAndSubsequentPasswordLogin() throws Exception {
        User user = new User("googleuser@devpulse.io", null, "Google User");
        user = userRepository.save(user);

        String jwt = jwtTokenProvider.generateTokenFromUserId(user.getId(), user.getEmail());

        SetPasswordRequest setRequest = new SetPasswordRequest("NewSecurePass123!", "NewSecurePass123!");

        // Set password via authenticated endpoint
        mockMvc.perform(post("/api/v1/account/set-password")
                        .header("Authorization", "Bearer " + jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(setRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        // Verify user can now log in via standard email/password endpoint
        LoginRequest loginRequest = new LoginRequest("googleuser@devpulse.io", "NewSecurePass123!");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    void testChangePasswordValidationAndSuccess() throws Exception {
        User user = new User("pwdchange@devpulse.io", passwordEncoder.encode("OldPassword123!"), "Password Change User");
        user = userRepository.save(user);

        String jwt = jwtTokenProvider.generateTokenFromUserId(user.getId(), user.getEmail());

        // 1. Wrong current password fails
        ChangePasswordRequest wrongOld = new ChangePasswordRequest("WrongOldPass!", "BrandNewPassword123!", "BrandNewPassword123!");
        mockMvc.perform(put("/api/v1/account/change-password")
                        .header("Authorization", "Bearer " + jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrongOld)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Current password is incorrect")));

        // 2. Same as current password fails
        ChangePasswordRequest samePass = new ChangePasswordRequest("OldPassword123!", "OldPassword123!", "OldPassword123!");
        mockMvc.perform(put("/api/v1/account/change-password")
                        .header("Authorization", "Bearer " + jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(samePass)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("cannot be the same")));

        // 3. Valid change password succeeds
        ChangePasswordRequest validReq = new ChangePasswordRequest("OldPassword123!", "BrandNewPassword123!", "BrandNewPassword123!");
        mockMvc.perform(put("/api/v1/account/change-password")
                        .header("Authorization", "Bearer " + jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validReq)))
                .andExpect(status().isOk());

        // Verify old password no longer works
        LoginRequest oldLogin = new LoginRequest("pwdchange@devpulse.io", "OldPassword123!");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(oldLogin)))
                .andExpect(status().isUnauthorized());

        // Verify new password works
        LoginRequest newLogin = new LoginRequest("pwdchange@devpulse.io", "BrandNewPassword123!");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newLogin)))
                .andExpect(status().isOk());
    }

    @Test
    void testGoogleDisconnectPreventedWhenNoPasswordConfigured() throws Exception {
        User googleOnlyUser = new User("no_pwd@gmail.com", null, "No Password User");
        googleOnlyUser = userRepository.save(googleOnlyUser);

        UserAuthIdentity identity = new UserAuthIdentity(googleOnlyUser, "google", "sub-no-pwd", "no_pwd@gmail.com", true);
        identityRepository.save(identity);

        String jwt = jwtTokenProvider.generateTokenFromUserId(googleOnlyUser.getId(), googleOnlyUser.getEmail());

        // Disconnecting must be rejected because user would be locked out
        mockMvc.perform(delete("/api/v1/account/google/link")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("does not have a password configured")));
    }

    @Test
    void testGoogleAuthStartGeneratesPkceAndOpaqueStateWithoutExposingVerifier() throws Exception {
        GoogleAuthStartRequest request = new GoogleAuthStartRequest("LOGIN", "WEB", "clientChallenge123");

        mockMvc.perform(post("/api/v1/auth/google/start")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.authorizationUrl", containsString("code_challenge=")))
                .andExpect(jsonPath("$.data.authorizationUrl", containsString("code_challenge_method=S256")))
                .andExpect(result -> {
                    String json = result.getResponse().getContentAsString();
                    String sessionIdStr = objectMapper.readTree(json).path("data").path("sessionId").asText();
                    String authUrl = objectMapper.readTree(json).path("data").path("authorizationUrl").asText();
                    UUID sessionId = UUID.fromString(sessionIdStr);
                    OAuthSession session = sessionRepository.findById(sessionId).orElseThrow();

                    // Verify server-side verifier is stored and non-null
                    assertNotNull(session.getGoogleCodeVerifier());
                    String verifier = session.getGoogleCodeVerifier();

                    // Verify state sent to Google and returned in JSON contains NO verifier
                    assertFalse(authUrl.contains(verifier));
                    assertFalse(json.contains(verifier));
                });
    }

    @Test
    void testGoogleCallbackRetrievesVerifierFromServerSessionAndSuppliesToTokenVerifier() throws Exception {
        User user = new User("pkce_server@gmail.com", passwordEncoder.encode("Password123!"), "Server PKCE User");
        user = userRepository.save(user);

        UserAuthIdentity identity = new UserAuthIdentity(user, "google", "sub-pkce-server", "pkce_server@gmail.com", true);
        identityRepository.save(identity);

        String verifier = "server-stored-pkce-verifier-string-43-chars";
        OAuthSession session = new OAuthSession("opaqueState123", "WEB", "LOGIN", null, verifier, null, Instant.now().plus(10, ChronoUnit.MINUTES));
        session = sessionRepository.save(session);

        when(googleTokenVerifier.exchangeAndVerify(eq("auth-code-server"), anyString(), eq(verifier)))
                .thenReturn(new GoogleUserInfo("sub-pkce-server", "pkce_server@gmail.com", true, "Server PKCE User", null));

        // State param only contains sessionId:stateToken (NO verifier)
        mockMvc.perform(get("/api/v1/auth/google/callback")
                        .param("code", "auth-code-server")
                        .param("state", session.getId() + ":opaqueState123"))
                .andExpect(status().isOk())
                .andExpect(result -> {
                    String html = result.getResponse().getContentAsString();
                    assertTrue(html.contains("Authentication Successful"));
                    assertTrue(html.contains("dpt_"));
                });

        // Verify verifier was used and invalidated from session
        OAuthSession updated = sessionRepository.findById(session.getId()).orElseThrow();
        assertEquals("COMPLETED", updated.getStatus());
        assertNull(updated.getGoogleCodeVerifier());
    }

    @Test
    void testGoogleCallbackRejectsInvalidState() throws Exception {
        OAuthSession session = new OAuthSession("expectedStateToken", "WEB", "LOGIN", null, "verifier", null, Instant.now().plus(10, ChronoUnit.MINUTES));
        session = sessionRepository.save(session);

        mockMvc.perform(get("/api/v1/auth/google/callback")
                        .param("code", "auth-code-123")
                        .param("state", session.getId() + ":wrongStateToken"))
                .andExpect(status().isOk())
                .andExpect(result -> {
                    String html = result.getResponse().getContentAsString();
                    assertTrue(html.contains("OAuth security state mismatch"));
                });
    }

    @Test
    void testGoogleCallbackRejectsExpiredSession() throws Exception {
        OAuthSession session = new OAuthSession("expiredState", "WEB", "LOGIN", null, "verifier", null, Instant.now().minus(1, ChronoUnit.MINUTES));
        session = sessionRepository.save(session);

        mockMvc.perform(get("/api/v1/auth/google/callback")
                        .param("code", "auth-code-123")
                        .param("state", session.getId() + ":expiredState"))
                .andExpect(status().isOk())
                .andExpect(result -> {
                    String html = result.getResponse().getContentAsString();
                    assertTrue(html.contains("authentication session has timed out"));
                });
    }

    @Test
    void testGoogleCallbackRejectsReplayedSession() throws Exception {
        OAuthSession session = new OAuthSession("usedState", "WEB", "LOGIN", null, null, null, Instant.now().plus(10, ChronoUnit.MINUTES));
        session.setStatus("COMPLETED");
        session = sessionRepository.save(session);

        mockMvc.perform(get("/api/v1/auth/google/callback")
                        .param("code", "auth-code-123")
                        .param("state", session.getId() + ":usedState"))
                .andExpect(status().isOk())
                .andExpect(result -> {
                    String html = result.getResponse().getContentAsString();
                    assertTrue(html.contains("already been processed"));
                });
    }

    @Test
    void testPkceGenerationAndVerificationMatch() {
        String verifier = "E9Melhoa2OwvFrGMTJguCH5rtG6j30-PkUMdU37LNGA";
        String challenge = GoogleOAuthService.generatePkceChallenge(verifier);
        assertTrue(GoogleOAuthService.verifyPkce(verifier, challenge));
        assertFalse(GoogleOAuthService.verifyPkce("tampered-verifier", challenge));
    }

    @Test
    void testAuthHealthEndpointPermittedWithoutAuthentication() throws Exception {
        mockMvc.perform(get("/api/v1/auth/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("UP")))
                .andExpect(jsonPath("$.data.service", is("devpulse-backend")))
                .andExpect(jsonPath("$.data.timestamp", notNullValue()));
    }
}
