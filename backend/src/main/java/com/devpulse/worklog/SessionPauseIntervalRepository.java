package com.devpulse.worklog;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SessionPauseIntervalRepository extends JpaRepository<SessionPauseInterval, UUID> {
    List<SessionPauseInterval> findBySessionIdOrderByPausedAtAsc(UUID sessionId);
    List<SessionPauseInterval> findBySessionIdInOrderByPausedAtAsc(java.util.Collection<UUID> sessionIds);
    Optional<SessionPauseInterval> findFirstBySessionIdAndResumedAtIsNullOrderByPausedAtDesc(UUID sessionId);
}

