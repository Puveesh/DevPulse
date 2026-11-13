package com.devpulse.worklog;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DailyNoteRepository extends JpaRepository<DailyNote, UUID> {
    Optional<DailyNote> findByIdAndUserId(UUID id, UUID userId);
    Optional<DailyNote> findByProjectIdAndUserIdAndNoteDate(UUID projectId, UUID userId, LocalDate noteDate);
    List<DailyNote> findByUserIdOrderByNoteDateDesc(UUID userId);
    List<DailyNote> findByProjectIdAndUserIdOrderByNoteDateDesc(UUID projectId, UUID userId);
    Page<DailyNote> findByProjectIdAndUserIdOrderByNoteDateDesc(UUID projectId, UUID userId, Pageable pageable);
    boolean existsByProjectIdAndUserIdAndNoteDate(UUID projectId, UUID userId, LocalDate noteDate);
}

