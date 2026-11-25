package com.devpulse.auth.oauth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserAuthIdentityRepository extends JpaRepository<UserAuthIdentity, UUID> {
    Optional<UserAuthIdentity> findByProviderAndProviderSubject(String provider, String providerSubject);
    Optional<UserAuthIdentity> findByUserIdAndProvider(UUID userId, String provider);
    boolean existsByProviderAndProviderSubject(String provider, String providerSubject);
    void deleteByUserIdAndProvider(UUID userId, String provider);
    void deleteByUserId(UUID userId);
}
