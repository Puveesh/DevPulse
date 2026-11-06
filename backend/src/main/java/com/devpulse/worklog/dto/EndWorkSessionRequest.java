package com.devpulse.worklog.dto;

import java.time.Instant;

public record EndWorkSessionRequest(
        String notes,
        Instant endedAt
) {
}
