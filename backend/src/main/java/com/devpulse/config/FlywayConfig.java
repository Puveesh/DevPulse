package com.devpulse.config;

import org.flywaydb.core.api.ResourceProvider;
import org.flywaydb.core.api.migration.JavaMigration;
import org.flywaydb.core.api.resource.LoadableResource;
import org.flywaydb.core.internal.scanner.LocationScannerCache;
import org.flywaydb.core.internal.scanner.ResourceNameCache;
import org.flywaydb.core.internal.scanner.Scanner;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.flyway.FlywayConfigurationCustomizer;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;

import java.util.Collection;
import java.util.List;

/**
 * Flyway configuration for multi-database migration isolation and profile safety.
 *
 * 1. Migration Isolation:
 *    Because Flyway classpath scanning is recursive, scanning 'classpath:db/migration'
 *    would discover both MySQL historical scripts (V1-V8) and PostgreSQL baseline scripts
 *    (in 'db/migration/postgres'), triggering duplicate version conflicts.
 *    The customizer ensures non-production environments strictly exclude PostgreSQL scripts,
 *    and production strictly isolates PostgreSQL migrations.
 *
 * 2. Execution Strategy:
 *    In development/testing, automatic repair runs prior to migrate to tolerate minor comment
 *    or formatting tweaks in local scripts.
 *    In production ('prod' profile), automatic repair is strictly disabled to guarantee
 *    audit trail immutability and fail-fast schema validation.
 */
@Configuration
public class FlywayConfig {

    private static final Logger log = LoggerFactory.getLogger(FlywayConfig.class);

    @Bean
    public FlywayConfigurationCustomizer flywayConfigurationCustomizer(Environment environment) {
        boolean isProd = environment.acceptsProfiles(Profiles.of("prod"));
        return configuration -> {
            Scanner<JavaMigration> defaultScanner = new Scanner<>(
                    JavaMigration.class,
                    false,
                    new ResourceNameCache(),
                    new LocationScannerCache(),
                    configuration
            );

            configuration.resourceProvider(new ResourceProvider() {
                @Override
                public LoadableResource getResource(String name) {
                    return defaultScanner.getResource(name);
                }

                @Override
                public Collection<LoadableResource> getResources(String prefix, String... suffixes) {
                    Collection<LoadableResource> rawResources = defaultScanner.getResources(prefix, suffixes);
                    if (rawResources == null) {
                        return List.of();
                    }
                    return rawResources.stream()
                            .filter(resource -> {
                                String normalized = resource.getAbsolutePath().replace('\\', '/');
                                if (isProd) {
                                    return normalized.contains("/postgres/");
                                } else {
                                    return !normalized.contains("/postgres/");
                                }
                            })
                            .toList();
                }
            });
        };
    }

    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy(Environment environment) {
        boolean isProd = environment.acceptsProfiles(Profiles.of("prod"));
        return flyway -> {
            if (!isProd) {
                log.info("Non-production environment detected: executing Flyway repair before migrate");
                flyway.repair();
            } else {
                log.info("Production environment ('prod') detected: executing standard Flyway migrate without auto-repair");
            }
            flyway.migrate();
        };
    }
}
