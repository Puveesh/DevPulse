package com.devpulse.auth.oauth;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.oauth.google")
public class GoogleOAuthProperties {

    private String clientId = "";
    private String clientSecret = "";
    private String redirectUri = "http://localhost:8081/api/v1/auth/google/callback";
    private String webCallbackUri = "http://localhost:5173/dashboard";

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
        return webCallbackUri != null && !webCallbackUri.trim().isEmpty() ? webCallbackUri.trim() : "http://localhost:5173/dashboard";
    }

    public void setWebCallbackUri(String webCallbackUri) {
        this.webCallbackUri = webCallbackUri;
    }

    public String getFrontendBaseUrl() {
        String uri = getWebCallbackUri();
        if (uri == null || uri.isBlank()) {
            return "http://localhost:5173";
        }
        uri = uri.trim();
        int queryIdx = uri.indexOf('?');
        if (queryIdx > 0) {
            uri = uri.substring(0, queryIdx);
        }
        int hashIdx = uri.indexOf('#');
        if (hashIdx > 0) {
            uri = uri.substring(0, hashIdx);
        }
        uri = uri.replaceAll("/+$", "");
        if (uri.endsWith("/auth/callback")) {
            uri = uri.substring(0, uri.length() - "/auth/callback".length());
        }
        if (uri.endsWith("/dashboard")) {
            uri = uri.substring(0, uri.length() - "/dashboard".length());
        }
        return uri.replaceAll("/+$", "");
    }

    public String getFrontendDashboardUrl() {
        return getFrontendBaseUrl() + "/dashboard";
    }

    public String getFrontendSettingsUrl() {
        return getFrontendBaseUrl() + "/settings";
    }

    public String getFrontendLoginUrl() {
        return getFrontendBaseUrl() + "/login";
    }

    public String getFrontendRegisterUrl() {
        return getFrontendBaseUrl() + "/register";
    }

    public boolean isConfigured() {
        return !getClientId().isEmpty() && !getClientSecret().isEmpty();
    }
}
