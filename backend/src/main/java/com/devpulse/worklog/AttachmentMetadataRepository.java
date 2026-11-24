package com.devpulse.worklog;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AttachmentMetadataRepository extends JpaRepository<AttachmentMetadata, UUID> {
    Optional<AttachmentMetadata> findByIdAndUserId(UUID id, UUID userId);
    Page<AttachmentMetadata> findByUserIdAndProjectId(UUID userId, UUID projectId, Pageable pageable);
    long countByUserId(UUID userId);

    @Modifying
    @Query("DELETE FROM AttachmentMetadata a WHERE a.userId = :userId")
    void deleteByUserId(@Param("userId") UUID userId);
}
