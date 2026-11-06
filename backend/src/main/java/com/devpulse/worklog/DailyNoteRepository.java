package com.devpulse.worklog;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DailyNoteRepository extends JpaRepository<DailyNote, UUID> {
    Optional<DailyNote> findByIdAndUserId(UUID id, UUID userId);
    Optional<DailyNote> findByUserIdAndNoteDate(UUID userId, LocalDate noteDate);
    Page<DailyNote> findByUserIdOrderByNoteDateDesc(UUID userId, Pageable pageable);
}

