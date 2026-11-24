package com.devpulse.worklog;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkSessionRepository extends JpaRepository<WorkSession, UUID>, JpaSpecificationExecutor<WorkSession> {
    Optional<WorkSession> findByIdAndUserId(UUID id, UUID userId);

    Optional<WorkSession> findFirstByUserIdAndStatusInOrderByStartedAtDesc(UUID userId, Collection<WorkSessionStatus> statuses);

    boolean existsByUserIdAndStatusIn(UUID userId, Collection<WorkSessionStatus> statuses);

    Page<WorkSession> findByUserIdOrderByStartedAtDesc(UUID userId, Pageable pageable);

    Page<WorkSession> findByUserIdAndStatusOrderByStartedAtDesc(UUID userId, WorkSessionStatus status, Pageable pageable);

    Page<WorkSession> findByProjectIdAndUserIdOrderByStartedAtDesc(UUID projectId, UUID userId, Pageable pageable);

    Optional<WorkSession> findFirstByProjectIdAndUserIdOrderByStartedAtDesc(UUID projectId, UUID userId);

    List<WorkSession> findTop10ByUserIdOrderByStartedAtDesc(UUID userId);

    Optional<WorkSession> findFirstByUserIdOrderByStartedAtAsc(UUID userId);

    @Modifying
    @Query("DELETE FROM WorkSession w WHERE w.userId = :userId")
    void deleteByUserId(@Param("userId") UUID userId);

    @Query("SELECT s FROM WorkSession s WHERE s.userId = :userId AND s.startedAt < :windowEnd AND (s.endedAt IS NULL OR s.endedAt >= :windowStart)")
    List<WorkSession> findSessionsIntersectingWindow(
            @Param("userId") UUID userId,
            @Param("windowStart") java.time.Instant windowStart,
            @Param("windowEnd") java.time.Instant windowEnd
    );

    @Query("SELECT MAX(COALESCE(w.endedAt, w.startedAt)) FROM WorkSession w WHERE w.userId = :userId AND w.projectId = :projectId")
    Optional<java.time.Instant> findLatestActivityByProjectId(
            @Param("userId") UUID userId,
            @Param("projectId") UUID projectId
    );

    @Query("SELECT w.projectId, MAX(COALESCE(w.endedAt, w.startedAt)) FROM WorkSession w WHERE w.userId = :userId GROUP BY w.projectId")
    List<Object[]> findLatestActivityByUserIdGroupByProjectId(
            @Param("userId") UUID userId
    );
}
