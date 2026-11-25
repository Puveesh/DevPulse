package com.devpulse.auth.oauth.dto;

public record GoogleAuthStartResponse(
        String authorizationUrl,
        String state,
        String sessionId
) {
}
