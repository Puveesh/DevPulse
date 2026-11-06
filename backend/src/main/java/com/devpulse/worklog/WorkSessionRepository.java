package com.devpulse.worklog;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkSessionRepository extends JpaRepository<WorkSession, UUID> {
    Optional<WorkSession> findByIdAndUserId(UUID id, UUID userId);

    Optional<WorkSession> findFirstByUserIdAndStatusInOrderByStartedAtDesc(UUID userId, Collection<WorkSessionStatus> statuses);

    boolean existsByUserIdAndStatusIn(UUID userId, Collection<WorkSessionStatus> statuses);

    Page<WorkSession> findByUserIdOrderByStartedAtDesc(UUID userId, Pageable pageable);

    Page<WorkSession> findByUserIdAndStatusOrderByStartedAtDesc(UUID userId, WorkSessionStatus status, Pageable pageable);

    Page<WorkSession> findByProjectIdAndUserIdOrderByStartedAtDesc(UUID projectId, UUID userId, Pageable pageable);

    List<WorkSession> findTop10ByUserIdOrderByStartedAtDesc(UUID userId);

    @org.springframework.data.jpa.repository.Query("SELECT s FROM WorkSession s WHERE s.userId = :userId AND s.startedAt < :windowEnd AND (s.endedAt IS NULL OR s.endedAt >= :windowStart)")
    List<WorkSession> findSessionsIntersectingWindow(
            @org.springframework.data.repository.query.Param("userId") UUID userId,
            @org.springframework.data.repository.query.Param("windowStart") java.time.Instant windowStart,
            @org.springframework.data.repository.query.Param("windowEnd") java.time.Instant windowEnd
    );
}
