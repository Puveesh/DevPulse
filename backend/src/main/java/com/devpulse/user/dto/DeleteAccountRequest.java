package com.devpulse.user.dto;

import jakarta.validation.constraints.NotBlank;

public record DeleteAccountRequest(
        @NotBlank(message = "Password is required for account deletion")
        String password,

        @NotBlank(message = "Confirmation text is required")
        String confirmation
) {
}
