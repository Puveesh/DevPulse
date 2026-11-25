package com.devpulse.auth.oauth.dto;

import jakarta.validation.constraints.NotBlank;

public record GoogleAuthStartRequest(
        @NotBlank(message = "Action must be LOGIN, REGISTER, or LINK")
        String action,
        String clientType, // "DESKTOP" or "WEB"
        String codeChallenge // Optional PKCE SHA-256 base64url challenge
) {
}
