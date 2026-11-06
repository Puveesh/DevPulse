package com.devpulse.task;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TaskRepository extends JpaRepository<Task, UUID> {
    Optional<Task> findByIdAndUserId(UUID id, UUID userId);
    Page<Task> findByUserId(UUID userId, Pageable pageable);
    List<Task> findByUserIdAndProjectId(UUID userId, UUID projectId);
    long countByUserIdAndStatus(UUID userId, TaskStatus status);
}

