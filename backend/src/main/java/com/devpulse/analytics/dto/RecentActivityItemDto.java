package com.devpulse.analytics.dto;

import java.time.Instant;
import java.util.UUID;

public record RecentActivityItemDto(
        String id,
        String type,
        String title,
        String description,
        UUID projectId,
        String projectName,
        Instant timestamp,
        Long durationSeconds,
        String status
) {
}

