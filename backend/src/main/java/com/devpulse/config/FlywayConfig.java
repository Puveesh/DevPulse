package com.devpulse.config;

import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Flyway configuration to ensure automatic repair of schema history.
 * If a migration script is formatted, commented, or updated during development,
 * Flyway automatically repairs the stored checksum before migrating, preventing
 * checksum validation failures and context crashes.
 */
@Configuration
public class FlywayConfig {

    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy() {
        return flyway -> {
            flyway.repair();
            flyway.migrate();
        };
    }
}
