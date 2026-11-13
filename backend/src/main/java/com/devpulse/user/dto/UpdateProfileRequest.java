package com.devpulse.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NotBlank(message = "Display name cannot be blank")
        @Size(min = 1, max = 100, message = "Display name must be between 1 and 100 characters")
        String displayName,

        @Size(max = 2000, message = "Bio cannot exceed 2000 characters")
        String bio,

        @Size(max = 150, message = "Professional title cannot exceed 150 characters")
        String professionalTitle,

        @Size(max = 50, message = "Experience level cannot exceed 50 characters")
        String experienceLevel,

        String programmingLanguages,

        String technologies,

        @Pattern(regexp = "^(https?:\\/\\/)?([a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,}(\\/.*)?$|^$", message = "Invalid GitHub URL format")
        @Size(max = 500, message = "GitHub URL cannot exceed 500 characters")
        String githubUrl,

        @Pattern(regexp = "^(https?:\\/\\/)?([a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,}(\\/.*)?$|^$", message = "Invalid Portfolio URL format")
        @Size(max = 500, message = "Portfolio URL cannot exceed 500 characters")
        String portfolioUrl,

        @Size(max = 1000, message = "Current focus cannot exceed 1000 characters")
        String currentFocus
) {
}

