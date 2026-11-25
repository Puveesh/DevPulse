package com.devpulse.auth.oauth;

public interface GoogleTokenVerifier {
    default GoogleUserInfo exchangeAndVerify(String authCode, String redirectUri) {
        return exchangeAndVerify(authCode, redirectUri, null);
    }

    GoogleUserInfo exchangeAndVerify(String authCode, String redirectUri, String codeVerifier);
}
