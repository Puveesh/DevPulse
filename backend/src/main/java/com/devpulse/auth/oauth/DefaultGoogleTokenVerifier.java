package com.devpulse.auth.oauth;

import com.devpulse.common.BadRequestException;
import com.devpulse.common.UnauthorizedException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

@Component
public class DefaultGoogleTokenVerifier implements GoogleTokenVerifier {

    private static final Logger log = LoggerFactory.getLogger(DefaultGoogleTokenVerifier.class);
    private static final String GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
    private static final String GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo";

    private final GoogleOAuthProperties googleOAuthProperties;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public DefaultGoogleTokenVerifier(GoogleOAuthProperties googleOAuthProperties, ObjectMapper objectMapper) {
        this.googleOAuthProperties = googleOAuthProperties;
        this.objectMapper = objectMapper;
        this.restClient = RestClient.builder().build();
    }

    @Override
    public GoogleUserInfo exchangeAndVerify(String authCode, String redirectUri) {
        return exchangeAndVerify(authCode, redirectUri, null);
    }

    @Override
    public GoogleUserInfo exchangeAndVerify(String authCode, String redirectUri, String codeVerifier) {
        if (!googleOAuthProperties.isConfigured()) {
            throw new BadRequestException("Google OAuth is not configured on the backend. Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.");
        }

        try {
            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("code", authCode);
            body.add("client_id", googleOAuthProperties.getClientId());
            body.add("client_secret", googleOAuthProperties.getClientSecret());
            body.add("redirect_uri", redirectUri);
            body.add("grant_type", "authorization_code");
            if (codeVerifier != null && !codeVerifier.isBlank()) {
                body.add("code_verifier", codeVerifier);
            }

            String tokenResponseJson = restClient.post()
                    .uri(GOOGLE_TOKEN_URL)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(String.class);

            JsonNode tokenNode = objectMapper.readTree(tokenResponseJson);
            String idToken = tokenNode.has("id_token") ? tokenNode.get("id_token").asText() : null;

            if (idToken == null || idToken.isBlank()) {
                throw new UnauthorizedException("Google OAuth exchange failed: id_token missing from response");
            }

            String tokenInfoJson = restClient.get()
                    .uri(GOOGLE_TOKENINFO_URL + "?id_token=" + idToken)
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .body(String.class);

            JsonNode infoNode = objectMapper.readTree(tokenInfoJson);

            String iss = infoNode.has("iss") ? infoNode.get("iss").asText() : "";
            if (!"accounts.google.com".equals(iss) && !"https://accounts.google.com".equals(iss)) {
                throw new UnauthorizedException("Google id_token validation failed: untrusted issuer: " + iss);
            }

            String aud = infoNode.has("aud") ? infoNode.get("aud").asText() : "";
            if (!googleOAuthProperties.getClientId().equals(aud)) {
                throw new UnauthorizedException("Google id_token validation failed: client_id mismatch");
            }

            boolean emailVerified = infoNode.has("email_verified") &&
                    ("true".equalsIgnoreCase(infoNode.get("email_verified").asText()) || infoNode.get("email_verified").asBoolean());

            if (!emailVerified) {
                throw new UnauthorizedException("Google authentication rejected: email address is not verified by Google.");
            }

            String sub = infoNode.has("sub") ? infoNode.get("sub").asText() : "";
            if (sub.isBlank()) {
                throw new UnauthorizedException("Google authentication rejected: subject identifier (sub) missing");
            }

            String email = infoNode.has("email") ? infoNode.get("email").asText().trim().toLowerCase() : "";
            String name = infoNode.has("name") ? infoNode.get("name").asText() : (infoNode.has("email") ? infoNode.get("email").asText() : "DevPulse User");
            String picture = infoNode.has("picture") ? infoNode.get("picture").asText() : null;

            return new GoogleUserInfo(sub, email, emailVerified, name, picture);

        } catch (Exception ex) {
            log.error("Error exchanging Google authorization code: {}", ex.getMessage());
            if (ex instanceof UnauthorizedException || ex instanceof BadRequestException) {
                throw (RuntimeException) ex;
            }
            throw new UnauthorizedException("Google authentication failed: " + ex.getMessage());
        }
    }
}
