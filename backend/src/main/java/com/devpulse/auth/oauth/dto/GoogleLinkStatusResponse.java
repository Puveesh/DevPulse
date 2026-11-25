package com.devpulse.auth.oauth.dto;

public record GoogleLinkStatusResponse(
        boolean linked,
        String googleEmail,
        boolean hasPassword
) {
}
