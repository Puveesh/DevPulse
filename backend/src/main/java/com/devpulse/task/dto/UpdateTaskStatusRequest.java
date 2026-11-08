package com.devpulse.task.dto;

import com.devpulse.task.TaskStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateTaskStatusRequest(
        @NotNull(message = "Task status is required")
        TaskStatus status
) {}
