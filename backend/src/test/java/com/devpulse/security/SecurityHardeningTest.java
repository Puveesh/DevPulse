package com.devpulse.security;

import com.devpulse.config.JwtProperties;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import static org.junit.jupiter.api.Assertions.*;

class SecurityHardeningTest {

    @Test
    @DisplayName("Production mode refuses to start when JWT secret is null or empty")
    void shouldRefuseStartupWhenJwtSecretIsMissingInProduction() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");

        JwtProperties props = new JwtProperties();
        props.setSecret(null);

        JwtTokenProvider provider = new JwtTokenProvider(props, env);

        IllegalStateException ex = assertThrows(IllegalStateException.class, provider::init);
        assertTrue(ex.getMessage().contains("Production mode requires a valid JWT secret"));
    }

    @Test
    @DisplayName("Production mode refuses to start when insecure default placeholder is used")
    void shouldRefuseStartupWhenPlaceholderSecretUsedInProduction() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");

        JwtProperties props = new JwtProperties();
        props.setSecret(JwtTokenProvider.INSECURE_DEFAULT_SECRET);

        JwtTokenProvider provider = new JwtTokenProvider(props, env);

        IllegalStateException ex = assertThrows(IllegalStateException.class, provider::init);
        assertTrue(ex.getMessage().contains("insecure default placeholder"));
    }

    @Test
    @DisplayName("Production mode refuses to start when secret is shorter than 256 bits")
    void shouldRefuseStartupWhenSecretIsTooShortInProduction() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");

        JwtProperties props = new JwtProperties();
        // 16 bytes = 128 bits
        props.setSecret("short-16byte-key");

        JwtTokenProvider provider = new JwtTokenProvider(props, env);

        IllegalStateException ex = assertThrows(IllegalStateException.class, provider::init);
        assertTrue(ex.getMessage().contains("must be at least 256 bits"));
    }

    @Test
    @DisplayName("Production mode initializes cleanly with valid 256-bit Base64 secret")
    void shouldInitializeCleanlyWithValidSecretInProduction() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");

        JwtProperties props = new JwtProperties();
        props.setSecret("MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE="); // exactly 32 bytes

        JwtTokenProvider provider = new JwtTokenProvider(props, env);
        assertDoesNotThrow(provider::init);
    }

    @Test
    @DisplayName("Non-production environment allows development secret")
    void shouldAllowDevelopmentSecretInDevMode() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("dev");

        JwtProperties props = new JwtProperties();
        props.setSecret("MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE=");

        JwtTokenProvider provider = new JwtTokenProvider(props, env);
        assertDoesNotThrow(provider::init);
    }
}
