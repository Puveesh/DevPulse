package com.devpulse.worklog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record StartWorkSessionRequest(
        UUID projectId,
        UUID taskId,
        @NotBlank(message = "Session title is required")
        @Size(max = 255, message = "Session title cannot exceed 255 characters")
        String title,
        String notes
) {
}
