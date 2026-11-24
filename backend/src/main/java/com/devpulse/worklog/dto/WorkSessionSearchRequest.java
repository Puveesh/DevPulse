package com.devpulse.worklog.dto;

import java.util.UUID;

public record WorkSessionSearchRequest(
        String title,
        UUID projectId,
        Integer month,
        Integer year,
        String date,
        String timezone
) {
    public boolean hasTitle() {
        return title != null && !title.trim().isBlank();
    }

    public boolean hasProject() {
        return projectId != null;
    }

    public boolean hasDate() {
        return (date != null && !date.trim().isBlank()) || month != null || year != null;
    }

    public boolean hasAnyFilter() {
        return hasTitle() || hasProject() || hasDate();
    }
}
