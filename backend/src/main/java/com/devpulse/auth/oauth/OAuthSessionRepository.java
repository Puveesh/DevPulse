package com.devpulse.auth.oauth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OAuthSessionRepository extends JpaRepository<OAuthSession, UUID> {
    Optional<OAuthSession> findByState(String state);
}
