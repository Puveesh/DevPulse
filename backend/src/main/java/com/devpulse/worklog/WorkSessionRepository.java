package com.devpulse.worklog;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkSessionRepository extends JpaRepository<WorkSession, UUID> {
    Optional<WorkSession> findByIdAndUserId(UUID id, UUID userId);
    Optional<WorkSession> findFirstByUserIdAndStatusOrderByStartedAtDesc(UUID userId, WorkSessionStatus status);
    Page<WorkSession> findByUserId(UUID userId, Pageable pageable);
    List<WorkSession> findByUserIdAndStartedAtBetween(UUID userId, Instant start, Instant end);

    @Query("SELECT COALESCE(SUM(ws.durationSeconds), 0) FROM WorkSession ws WHERE ws.userId = :userId AND ws.startedAt >= :since")
    long getTotalDurationSecondsSince(@Param("userId") UUID userId, @Param("since") Instant since);
}

