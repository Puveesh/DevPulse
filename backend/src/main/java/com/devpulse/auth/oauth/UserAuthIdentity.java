package com.devpulse.auth.oauth;

import com.devpulse.common.BaseEntity;
import com.devpulse.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
        name = "user_auth_identities",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_identities_provider_sub", columnNames = {"provider", "provider_subject"}),
                @UniqueConstraint(name = "uk_identities_user_provider", columnNames = {"user_id", "provider"})
        }
)
public class UserAuthIdentity extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "provider", nullable = false, length = 50)
    private String provider;

    @Column(name = "provider_subject", nullable = false, length = 255)
    private String providerSubject;

    @Column(name = "provider_email", nullable = false, length = 255)
    private String providerEmail;

    @Column(name = "provider_email_verified", nullable = false)
    private boolean providerEmailVerified;

    public UserAuthIdentity() {
    }

    public UserAuthIdentity(User user, String provider, String providerSubject, String providerEmail, boolean providerEmailVerified) {
        this.user = user;
        this.provider = provider;
        this.providerSubject = providerSubject;
        this.providerEmail = providerEmail != null ? providerEmail.trim().toLowerCase() : "";
        this.providerEmailVerified = providerEmailVerified;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getProviderSubject() {
        return providerSubject;
    }

    public void setProviderSubject(String providerSubject) {
        this.providerSubject = providerSubject;
    }

    public String getProviderEmail() {
        return providerEmail;
    }

    public void setProviderEmail(String providerEmail) {
        this.providerEmail = providerEmail != null ? providerEmail.trim().toLowerCase() : "";
    }

    public boolean isProviderEmailVerified() {
        return providerEmailVerified;
    }

    public void setProviderEmailVerified(boolean providerEmailVerified) {
        this.providerEmailVerified = providerEmailVerified;
    }
}
