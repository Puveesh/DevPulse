package com.devpulse.analytics.dto;

public record DailyActivityDto(
        String date,
        String day,
        long durationSeconds
) {}
