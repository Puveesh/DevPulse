package com.devpulse.worklog.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateSessionNotesRequest(
        @NotNull(message = "Session notes cannot be null")
        String sessionNotes
) {
}
