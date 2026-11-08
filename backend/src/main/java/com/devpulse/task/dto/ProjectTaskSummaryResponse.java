package com.devpulse.task.dto;

import java.util.List;

public record ProjectTaskSummaryResponse(
        List<ProjectTaskSummaryDto> projects
) {}
