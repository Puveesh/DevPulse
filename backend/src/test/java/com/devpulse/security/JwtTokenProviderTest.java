package com.devpulse.security;

import com.devpulse.config.JwtProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtTokenProviderTest {

    private JwtTokenProvider tokenProvider;
    private JwtProperties jwtProperties;

    @BeforeEach
    void setUp() {
        jwtProperties = new JwtProperties();
        jwtProperties.setSecret("dGVzdC1zZWNyZXQta2V5LWRldnB1bHNlLWF1dGgtMjU2LWJpdC1zZWN1cmUta2V5LWZvci10ZXN0aW5nLXB1cnBvc2VzLW9ubHk=");
        jwtProperties.setExpirationMs(60000); // 1 minute
        tokenProvider = new JwtTokenProvider(jwtProperties);
        tokenProvider.init();
    }

    @Test
    void testGenerateAndValidateToken() {
        UUID userId = UUID.randomUUID();
        String email = "developer@devpulse.io";

        String token = tokenProvider.generateTokenFromUserId(userId, email);

        assertNotNull(token);
        assertTrue(tokenProvider.validateToken(token));
        assertEquals(userId, tokenProvider.getUserIdFromToken(token));
    }

    @Test
    void testInvalidTokenSignature() {
        UUID userId = UUID.randomUUID();
        String token = tokenProvider.generateTokenFromUserId(userId, "test@devpulse.io");
        String tamperedToken = token + "tampered";

        assertFalse(tokenProvider.validateToken(tamperedToken));
    }

    @Test
    void testExpiredToken() {
        JwtProperties expiredProps = new JwtProperties();
        expiredProps.setSecret("dGVzdC1zZWNyZXQta2V5LWRldnB1bHNlLWF1dGgtMjU2LWJpdC1zZWN1cmUta2V5LWZvci10ZXN0aW5nLXB1cnBvc2VzLW9ubHk=");
        expiredProps.setExpirationMs(-1000); // Expired 1 second ago

        JwtTokenProvider expiredProvider = new JwtTokenProvider(expiredProps);
        expiredProvider.init();

        String expiredToken = expiredProvider.generateTokenFromUserId(UUID.randomUUID(), "expired@devpulse.io");
        assertFalse(tokenProvider.validateToken(expiredToken));
    }
}

