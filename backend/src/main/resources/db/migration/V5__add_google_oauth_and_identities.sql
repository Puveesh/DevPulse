-- Migration V5: Add Google OAuth 2.0 identities, OAuth sessions and short-lived tickets

-- Allow password_hash to be nullable for users who register exclusively with Google
ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255) NULL;

-- Linked User Authentication Identities (Google, etc.)
CREATE TABLE user_auth_identities (
    id BINARY(16) NOT NULL,
    user_id BINARY(16) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    provider_subject VARCHAR(255) NOT NULL,
    provider_email VARCHAR(255) NOT NULL,
    provider_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_identities_provider_sub UNIQUE (provider, provider_subject),
    CONSTRAINT uk_identities_user_provider UNIQUE (user_id, provider),
    CONSTRAINT fk_identities_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_identities_user_id ON user_auth_identities(user_id);
CREATE INDEX idx_identities_provider_sub ON user_auth_identities(provider, provider_subject);

-- OAuth Sessions (tracks pending authorization code requests with state and PKCE)
CREATE TABLE oauth_sessions (
    id BINARY(16) NOT NULL,
    state VARCHAR(255) NOT NULL,
    client_type VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    code_challenge VARCHAR(255),
    user_id BINARY(16),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    expires_at DATETIME(6) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_oauth_sessions_state UNIQUE (state)
);

CREATE INDEX idx_oauth_sessions_state ON oauth_sessions(state);

-- Single-Use, Short-Lived OAuth Tickets (used for desktop/web post-auth token exchange)
CREATE TABLE oauth_tickets (
    id BINARY(16) NOT NULL,
    ticket_hash VARCHAR(64) NOT NULL,
    user_id BINARY(16) NOT NULL,
    action VARCHAR(50) NOT NULL,
    code_challenge VARCHAR(255),
    expires_at DATETIME(6) NOT NULL,
    consumed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_oauth_tickets_hash UNIQUE (ticket_hash),
    CONSTRAINT fk_oauth_tickets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_oauth_tickets_hash ON oauth_tickets(ticket_hash);

