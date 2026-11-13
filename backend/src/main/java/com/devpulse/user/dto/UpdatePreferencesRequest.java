package com.devpulse.user.dto;

import jakarta.validation.constraints.Size;

public record UpdatePreferencesRequest(
        @Size(max = 100, message = "Timezone cannot exceed 100 characters")
        String timezone,

        @Size(max = 20, message = "Date format cannot exceed 20 characters")
        String dateFormat,

        @Size(max = 20, message = "Time format cannot exceed 20 characters")
        String timeFormat,

        @Size(max = 20, message = "Week start day cannot exceed 20 characters")
        String weekStartDay,

        @Size(max = 50, message = "Theme cannot exceed 50 characters")
        String theme
) {
}

