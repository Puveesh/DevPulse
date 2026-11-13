package com.devpulse.analytics.dto;

public record AnalyticsInsightDto(
        String type,
        String title,
        String description,
        String category,
        String level
) {
}

