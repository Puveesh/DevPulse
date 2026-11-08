package com.devpulse.task.dto;

import com.devpulse.task.TaskPriority;
import com.devpulse.task.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public record CreateTaskRequest(
        @NotBlank(message = "Task title is required")
        @Size(max = 255, message = "Task title cannot exceed 255 characters")
        String title,

        String description,

        TaskStatus status,

        TaskPriority priority,

        Instant dueDate
) {}
