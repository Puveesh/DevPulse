package com.devpulse.analytics.dto;

import java.util.UUID;

public record ProjectDurationDto(
        UUID projectId,
        String projectName,
        long durationSeconds
) {}

