package com.devpulse.auth.oauth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OAuthTicketRepository extends JpaRepository<OAuthTicket, UUID> {
    Optional<OAuthTicket> findByTicketHash(String ticketHash);
}
