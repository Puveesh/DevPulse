package com.devpulse.user.dto;

import jakarta.validation.constraints.NotBlank;

public record AvatarUploadRequest(
        @NotBlank(message = "Avatar image data is required")
        String avatarDataUrl
) {
}

