package com.devpulse.security;

import com.devpulse.config.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Base64;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtTokenProvider {

    private static final Logger log = LoggerFactory.getLogger(JwtTokenProvider.class);
    private static final String ISSUER = "devpulse-auth";
    public static final String INSECURE_DEFAULT_SECRET = "dGVzdC1zZWNyZXQta2V5LWRldnB1bHNlLWF1dGgtMjU2LWJpdC1zZWN1cmUta2V5LWZvci10ZXN0aW5nLXB1cnBvc2VzLW9ubHk=";
    public static final String EXAMPLE_PLACEHOLDER_SECRET = "your-secure-base64-or-256-bit-jwt-secret-key-change-this-in-production";

    private final JwtProperties jwtProperties;
    private final Environment environment;
    private SecretKey key;

    public JwtTokenProvider(JwtProperties jwtProperties) {
        this(jwtProperties, null);
    }

    @Autowired
    public JwtTokenProvider(JwtProperties jwtProperties, Environment environment) {
        this.jwtProperties = jwtProperties;
        this.environment = environment;
    }

    @PostConstruct
    public void init() {
        validateAndInitializeSecret();
    }

    public void validateAndInitializeSecret() {
        String secret = jwtProperties.getSecret();
        boolean isProd = isProductionProfile();

        if (secret == null || secret.isBlank()) {
            if (isProd) {
                throw new IllegalStateException(
                        "CRITICAL SECURITY CONFIGURATION ERROR: Production mode requires a valid JWT secret. " +
                        "No JWT_SECRET was configured. Set a cryptographically secure 256-bit+ secret via the JWT_SECRET environment variable.");
            }
            throw new IllegalStateException(
                    "JWT secret is not configured. Please define JWT_SECRET in your backend/.env file or environment variables.");
        }

        secret = secret.trim();

        if (isProd) {
            if (INSECURE_DEFAULT_SECRET.equals(secret) || EXAMPLE_PLACEHOLDER_SECRET.equals(secret)) {
                throw new IllegalStateException(
                        "CRITICAL SECURITY CONFIGURATION ERROR: Production mode refused to start because an insecure default placeholder " +
                        "JWT secret was detected. You must configure a unique, cryptographically secure 256-bit+ secret via the JWT_SECRET environment variable.");
            }
        }

        byte[] keyBytes;
        try {
            keyBytes = Base64.getDecoder().decode(secret);
        } catch (IllegalArgumentException e) {
            keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        }

        if (keyBytes.length < 32) {
            if (isProd) {
                throw new IllegalStateException(
                        "CRITICAL SECURITY CONFIGURATION ERROR: JWT secret must be at least 256 bits (32 bytes) for secure HMAC-SHA256 signing in production. " +
                        "Found only " + keyBytes.length + " bytes (" + (keyBytes.length * 8) + " bits).");
            }
            log.warn("JWT secret is shorter than 256 bits ({} bytes). Padding for non-production environment.", keyBytes.length);
            byte[] padded = new byte[32];
            System.arraycopy(keyBytes, 0, padded, 0, Math.min(keyBytes.length, 32));
            keyBytes = padded;
        }

        this.key = Keys.hmacShaKeyFor(keyBytes);
        // Do not print or expose the secret in application logs
        log.info("JWT signing key initialized successfully ({} bits).", keyBytes.length * 8);
    }

    public boolean isProductionProfile() {
        if (environment == null) return false;
        String[] activeProfiles = environment.getActiveProfiles();
        return Arrays.stream(activeProfiles)
                .anyMatch(p -> "prod".equalsIgnoreCase(p) || "production".equalsIgnoreCase(p));
    }

    public String generateToken(Authentication authentication) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        return generateTokenFromUserId(userPrincipal.getId(), userPrincipal.getUsername());
    }

    public String generateTokenFromUserId(UUID userId, String email) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtProperties.getExpirationMs());

        return Jwts.builder()
                .subject(userId.toString())
                .claim("email", email)
                .issuer(ISSUER)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }

    public UUID getUserIdFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .requireIssuer(ISSUER)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return UUID.fromString(claims.getSubject());
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(key)
                    .requireIssuer(ISSUER)
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (ExpiredJwtException ex) {
            log.debug("Expired JWT token: {}", ex.getMessage());
        } catch (JwtException | IllegalArgumentException ex) {
            log.debug("Invalid JWT token: {}", ex.getMessage());
        }
        return false;
    }
}

