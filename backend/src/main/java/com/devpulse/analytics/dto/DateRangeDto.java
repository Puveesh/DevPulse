package com.devpulse.analytics.dto;

public record DateRangeDto(
        String preset,
        String startDate,
        String endDate,
        long totalDays
) {
}
