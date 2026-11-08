package com.devpulse.task.dto;

import com.devpulse.task.Task;
import com.devpulse.task.TaskPriority;
import com.devpulse.task.TaskStatus;

import java.time.Instant;
import java.util.UUID;

public record TaskResponse(
        UUID id,
        UUID userId,
        UUID projectId,
        String title,
        String description,
        TaskStatus status,
        TaskPriority priority,
        Instant dueDate,
        Instant createdAt,
        Instant updatedAt
) {
    public static TaskResponse fromTask(Task task) {
        return new TaskResponse(
                task.getId(),
                task.getUserId(),
                task.getProjectId(),
                task.getTitle(),
                task.getDescription(),
                task.getStatus(),
                task.getPriority(),
                task.getDueDate(),
                task.getCreatedAt(),
                task.getUpdatedAt()
        );
    }
}
