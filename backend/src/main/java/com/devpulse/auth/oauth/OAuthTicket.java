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
        name = "oauth_tickets",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_oauth_tickets_hash", columnNames = {"ticket_hash"})
        }
)
public class OAuthTicket extends BaseEntity {

    @Column(name = "ticket_hash", nullable = false, length = 64)
    private String ticketHash;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "action", nullable = false, length = 50)
    private String action; // "LOGIN", "REGISTER", "LINK"

    @Column(name = "code_challenge", length = 255)
    private String codeChallenge;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "consumed", nullable = false)
    private boolean consumed = false;

    public OAuthTicket() {
    }

    public OAuthTicket(String ticketHash, UUID userId, String action, String codeChallenge, Instant expiresAt) {
        this.ticketHash = ticketHash;
        this.userId = userId;
        this.action = action;
        this.codeChallenge = codeChallenge;
        this.expiresAt = expiresAt;
        this.consumed = false;
    }

    public String getTicketHash() {
        return ticketHash;
    }

    public void setTicketHash(String ticketHash) {
        this.ticketHash = ticketHash;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
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

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public boolean isConsumed() {
        return consumed;
    }

    public void setConsumed(boolean consumed) {
        this.consumed = consumed;
    }

    public boolean isExpired() {
        return expiresAt != null && Instant.now().isAfter(expiresAt);
    }
}
