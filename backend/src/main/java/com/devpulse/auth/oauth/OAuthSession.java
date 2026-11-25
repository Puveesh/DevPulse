package com.devpulse.auth.oauth;

import com.devpulse.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "oauth_sessions",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_oauth_sessions_state", columnNames = {"state"})
        }
)
public class OAuthSession extends BaseEntity {

    @Column(name = "state", nullable = false, length = 255)
    private String state;

    @Column(name = "client_type", nullable = false, length = 50)
    private String clientType; // "DESKTOP" or "WEB"

    @Column(name = "action", nullable = false, length = 50)
    private String action; // "LOGIN", "REGISTER", or "LINK"

    @Column(name = "code_challenge", length = 255)
    private String codeChallenge;

    @Column(name = "google_code_verifier", length = 255)
    private String googleCodeVerifier;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "status", nullable = false, length = 50)
    private String status = "PENDING"; // "PENDING", "COMPLETED", "EXPIRED"

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    public OAuthSession() {
    }

    public OAuthSession(String state, String clientType, String action, String codeChallenge, String googleCodeVerifier, UUID userId, Instant expiresAt) {
        this.state = state;
        this.clientType = clientType;
        this.action = action;
        this.codeChallenge = codeChallenge;
        this.googleCodeVerifier = googleCodeVerifier;
        this.userId = userId;
        this.expiresAt = expiresAt;
        this.status = "PENDING";
    }

    public OAuthSession(String state, String clientType, String action, String codeChallenge, UUID userId, Instant expiresAt) {
        this(state, clientType, action, codeChallenge, null, userId, expiresAt);
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getClientType() {
        return clientType;
    }

    public void setClientType(String clientType) {
        this.clientType = clientType;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getCodeChallenge() {
        return codeChallenge;
    }

    public void setCodeChallenge(String codeChallenge) {
        this.codeChallenge = codeChallenge;
    }

    public String getGoogleCodeVerifier() {
        return googleCodeVerifier;
    }

    public void setGoogleCodeVerifier(String googleCodeVerifier) {
        this.googleCodeVerifier = googleCodeVerifier;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public boolean isExpired() {
        return expiresAt != null && Instant.now().isAfter(expiresAt);
    }
}
