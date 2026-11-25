package com.devpulse.auth.oauth;

public record GoogleUserInfo(
        String sub,
        String email,
        boolean emailVerified,
        String name,
        String picture
) {
}
