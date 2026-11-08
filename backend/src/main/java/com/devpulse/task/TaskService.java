package com.devpulse.task;

import com.devpulse.common.BadRequestException;
import com.devpulse.common.ResourceNotFoundException;
import com.devpulse.project.Project;
import com.devpulse.project.ProjectRepository;
import com.devpulse.task.dto.CreateTaskRequest;
import com.devpulse.task.dto.ProjectTaskSummaryDto;
import com.devpulse.task.dto.ProjectTaskSummaryResponse;
import com.devpulse.task.dto.TaskResponse;
import com.devpulse.task.dto.UpdateTaskRequest;
import com.devpulse.task.dto.UpdateTaskStatusRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;

    public TaskService(TaskRepository taskRepository, ProjectRepository projectRepository) {
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
    }

    @Transactional
    public TaskResponse createTask(UUID userId, UUID projectId, CreateTaskRequest request) {
        // Verify project existence and ownership
        projectRepository.findByIdAndUserId(projectId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        if (request.title() == null || request.title().trim().isBlank()) {
            throw new BadRequestException("Task title cannot be empty");
        }

        TaskStatus status = request.status() != null ? request.status() : TaskStatus.TODO;
        TaskPriority priority = request.priority() != null ? request.priority() : TaskPriority.MEDIUM;
        String trimmedDesc = request.description() != null ? request.description().trim() : null;

        Task task = new Task(
                userId,
                projectId,
                request.title().trim(),
                trimmedDesc,
                status,
                priority,
                request.dueDate()
        );

        Task saved = taskRepository.save(task);
        return TaskResponse.fromTask(saved);
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> getTasksForProject(UUID userId, UUID projectId) {
        // Verify project ownership
        projectRepository.findByIdAndUserId(projectId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        return taskRepository.findByUserIdAndProjectIdOrderByCreatedAtDesc(userId, projectId)
                .stream()
                .map(TaskResponse::fromTask)
                .toList();
    }

    @Transactional
    public TaskResponse updateTaskStatus(UUID userId, UUID projectId, UUID taskId, UpdateTaskStatusRequest request) {
        // Verify project ownership
        projectRepository.findByIdAndUserId(projectId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        Task task = taskRepository.findByIdAndProjectIdAndUserId(taskId, projectId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));

        if (request.status() != null) {
            task.setStatus(request.status());
        }

        Task updated = taskRepository.save(task);
        return TaskResponse.fromTask(updated);
    }

    @Transactional
    public TaskResponse updateTask(UUID userId, UUID projectId, UUID taskId, UpdateTaskRequest request) {
        // Verify project ownership
        projectRepository.findByIdAndUserId(projectId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        Task task = taskRepository.findByIdAndProjectIdAndUserId(taskId, projectId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));

        if (request.title() != null) {
            if (request.title().trim().isBlank()) {
                throw new BadRequestException("Task title cannot be empty");
            }
            task.setTitle(request.title().trim());
        }

        if (request.description() != null) {
            task.setDescription(request.description().trim());
        }

        if (request.status() != null) {
            task.setStatus(request.status());
        }

        if (request.priority() != null) {
            task.setPriority(request.priority());
        }

        if (request.dueDate() != null) {
            task.setDueDate(request.dueDate());
        }

        Task updated = taskRepository.save(task);
        return TaskResponse.fromTask(updated);
    }

    @Transactional
    public void deleteTask(UUID userId, UUID projectId, UUID taskId) {
        // Verify project ownership
        projectRepository.findByIdAndUserId(projectId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        Task task = taskRepository.findByIdAndProjectIdAndUserId(taskId, projectId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));

        taskRepository.delete(task);
    }

    @Transactional(readOnly = true)
    public ProjectTaskSummaryResponse getProjectTaskSummary(UUID userId) {
        List<Project> userProjects = projectRepository.findByUserIdOrderByUpdatedAtDesc(userId);

        if (userProjects.isEmpty()) {
            return new ProjectTaskSummaryResponse(List.of());
        }

        // Aggregate pending tasks (TODO and IN_PROGRESS)
        List<Object[]> pendingCountsRaw = taskRepository.countTasksByUserIdAndStatusInGroupByProjectId(
                userId,
                List.of(TaskStatus.TODO, TaskStatus.IN_PROGRESS)
        );

        Map<UUID, Long> pendingCountMap = new HashMap<>();
        for (Object[] row : pendingCountsRaw) {
            if (row != null && row.length >= 2 && row[0] instanceof UUID pid && row[1] instanceof Number count) {
                pendingCountMap.put(pid, count.longValue());
            }
        }

        List<ProjectTaskSummaryDto> summaryList = new ArrayList<>(userProjects.size());
        for (Project project : userProjects) {
            long count = pendingCountMap.getOrDefault(project.getId(), 0L);
            summaryList.add(new ProjectTaskSummaryDto(project.getId(), project.getName(), count));
        }

        return new ProjectTaskSummaryResponse(summaryList);
    }
}
