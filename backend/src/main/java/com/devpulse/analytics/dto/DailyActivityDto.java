package com.devpulse.analytics.dto;

import java.util.List;

public record DailyActivityDto(
        String date,
        String day,
        long durationSeconds,
        List<ProjectDurationDto> projects
) {}
