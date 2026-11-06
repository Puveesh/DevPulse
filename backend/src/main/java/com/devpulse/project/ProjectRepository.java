package com.devpulse.project;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID> {

    Optional<Project> findByIdAndUserId(UUID id, UUID userId);

    Page<Project> findByUserId(UUID userId, Pageable pageable);

    Page<Project> findByUserIdAndStatus(UUID userId, ProjectStatus status, Pageable pageable);

    @Query("SELECT p FROM Project p WHERE p.userId = :userId AND " +
           "(:status IS NULL OR p.status = :status) AND " +
           "(:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Project> findByUserIdWithFilters(
            @Param("userId") UUID userId,
            @Param("status") ProjectStatus status,
            @Param("search") String search,
            Pageable pageable
    );

    long countByUserIdAndStatus(UUID userId, ProjectStatus status);

    long countByUserId(UUID userId);
}

