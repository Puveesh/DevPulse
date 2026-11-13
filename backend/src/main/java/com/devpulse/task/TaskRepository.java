package com.devpulse.task;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TaskRepository extends JpaRepository<Task, UUID> {
    Optional<Task> findByIdAndUserId(UUID id, UUID userId);
    Optional<Task> findByIdAndProjectIdAndUserId(UUID id, UUID projectId, UUID userId);
    Page<Task> findByUserId(UUID userId, Pageable pageable);
    List<Task> findByUserId(UUID userId);
    List<Task> findByUserIdOrderByUpdatedAtDesc(UUID userId);
    List<Task> findByUserIdAndProjectId(UUID userId, UUID projectId);
    List<Task> findByUserIdAndProjectIdOrderByCreatedAtDesc(UUID userId, UUID projectId);
    long countByUserIdAndStatus(UUID userId, TaskStatus status);

    @Query("SELECT t.projectId, COUNT(t) FROM Task t " +
           "WHERE t.userId = :userId " +
           "AND t.status IN :statuses " +
           "AND t.projectId IS NOT NULL " +
           "GROUP BY t.projectId")
    List<Object[]> countTasksByUserIdAndStatusInGroupByProjectId(
            @Param("userId") UUID userId,
            @Param("statuses") Collection<TaskStatus> statuses
    );
}
