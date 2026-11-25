package com.devpulse.auth.oauth.dto;

import jakarta.validation.constraints.NotBlank;

public record GoogleExchangeRequest(
        @NotBlank(message = "One-time ticket is required")
        String ticket,
        String codeVerifier, // PKCE code verifier if PKCE challenge was used
        @NotBlank(message = "State parameter is required")
        String state
) {
}
