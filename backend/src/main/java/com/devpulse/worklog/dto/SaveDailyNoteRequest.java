package com.devpulse.worklog.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record SaveDailyNoteRequest(
        LocalDate noteDate,
        @NotNull(message = "Note content cannot be null")
        String content
) {
}

