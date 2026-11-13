package com.devpulse.analytics.dto;

public record ConsistencyDto(
        int currentStreak,
        int longestStreak,
        int activeDays,
        long totalDays,
        double activeDaysRatio,
        String mostActiveWeekday,
        long mostActiveDaySeconds,
        long leastActiveDaySeconds,
        long averageActiveDaySeconds,
        long morningSeconds,
        long afternoonSeconds,
        long eveningSeconds,
        long nightSeconds,
        String mostProductiveTimeSlot
) {
}
