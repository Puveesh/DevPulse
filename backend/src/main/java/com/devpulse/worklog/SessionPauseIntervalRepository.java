package com.devpulse.worklog;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SessionPauseIntervalRepository extends JpaRepository<SessionPauseInterval, UUID> {
    List<SessionPauseInterval> findBySessionIdOrderByPausedAtAsc(UUID sessionId);
    List<SessionPauseInterval> findBySessionIdInOrderByPausedAtAsc(Collection<UUID> sessionIds);
    Optional<SessionPauseInterval> findFirstBySessionIdAndResumedAtIsNullOrderByPausedAtDesc(UUID sessionId);

    @Modifying
    @Query("DELETE FROM SessionPauseInterval i WHERE i.sessionId IN :sessionIds")
    void deleteBySessionIdIn(@Param("sessionIds") Collection<UUID> sessionIds);
}
