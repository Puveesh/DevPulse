package com.devpulse.task.dto;

import java.util.UUID;

public record ProjectTaskSummaryDto(
        UUID projectId,
        String projectName,
        long pendingTaskCount
) {}

