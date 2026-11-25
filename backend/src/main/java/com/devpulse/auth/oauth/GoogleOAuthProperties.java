package com.devpulse.auth.oauth;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.oauth.google")
public class GoogleOAuthProperties {

    private String clientId = "";
    private String clientSecret = "";
    private String redirectUri = "http://localhost:8081/api/v1/auth/google/callback";
    private String webCallbackUri = "http://localhost:5173/auth/callback";

    public String getClientId() {
        return clientId != null ? clientId.trim() : "";
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public String getClientSecret() {
        return clientSecret != null ? clientSecret.trim() : "";
    }

    public void setClientSecret(String clientSecret) {
        this.clientSecret = clientSecret;
    }

    public String getRedirectUri() {
        if (redirectUri != null && !redirectUri.trim().isEmpty()) {
            return redirectUri.trim().replaceAll("//api/v1", "/api/v1");
        }
        return "http://localhost:8081/api/v1/auth/google/callback";
    }

    public void setRedirectUri(String redirectUri) {
        this.redirectUri = redirectUri;
    }

    public String getWebCallbackUri() {
        return webCallbackUri != null && !webCallbackUri.trim().isEmpty() ? webCallbackUri.trim() : "http://localhost:5173/auth/callback";
    }

    public void setWebCallbackUri(String webCallbackUri) {
        this.webCallbackUri = webCallbackUri;
    }

    public boolean isConfigured() {
        return !getClientId().isEmpty() && !getClientSecret().isEmpty();
    }
}
