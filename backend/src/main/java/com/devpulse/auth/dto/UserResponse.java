package com.devpulse.auth.dto;

import com.devpulse.user.User;
import java.time.Instant;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String email,
        String displayName,
        Instant createdAt,
        String bio,
        String profileImage,
        String professionalTitle,
        String experienceLevel,
        String programmingLanguages,
        String technologies,
        String githubUrl,
        String portfolioUrl,
        String currentFocus,
        String timezone,
        String dateFormat,
        String timeFormat,
        String weekStartDay,
        String theme,
        String accountStatus,
        String authMethod,
        String databaseInfo,
        String dataIsolation,
        boolean hasPassword,
        boolean googleLinked,
        String googleEmail
) {
    public static UserResponse fromUser(User user) {
        return fromUser(user, false, null);
    }

    public static UserResponse fromUser(User user, boolean googleLinked, String googleEmail) {
        String authMethodDesc;
        if (googleLinked && user.hasPassword()) {
            authMethodDesc = "Email/Password + Linked Google";
        } else if (googleLinked) {
            authMethodDesc = "Google OAuth 2.0 (Single Sign-On)";
        } else {
            authMethodDesc = "Email/Password + JWT Bearer";
        }

        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                user.getCreatedAt(),
                user.getBio(),
                user.getProfileImage(),
                user.getProfessionalTitle(),
                user.getExperienceLevel(),
                user.getProgrammingLanguages(),
                user.getTechnologies(),
                user.getGithubUrl(),
                user.getPortfolioUrl(),
                user.getCurrentFocus(),
                user.getTimezone() != null ? user.getTimezone() : "UTC",
                user.getDateFormat() != null ? user.getDateFormat() : "YYYY-MM-DD",
                user.getTimeFormat() != null ? user.getTimeFormat() : "24-hour",
                user.getWeekStartDay() != null ? user.getWeekStartDay() : "Monday",
                user.getTheme() != null ? user.getTheme() : "dark",
                "ACTIVE",
                authMethodDesc,
                "MySQL 8.0 (Relational schema with Flyway migrations)",
                "Workspace data isolated by developer UUID",
                user.hasPassword(),
                googleLinked,
                googleEmail
        );
    }
}
