package com.devpulse.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.util.Arrays;

@Component
public class StartupLogger implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(StartupLogger.class);

    private final Environment environment;
    private final DataSource dataSource;

    @Value("${server.port:8081}")
    private String serverPort;

    public StartupLogger(Environment environment, DataSource dataSource) {
        this.environment = environment;
        this.dataSource = dataSource;
    }

    @Override
    public void run(ApplicationArguments args) {
        String[] activeProfiles = environment.getActiveProfiles();
        String profilesDisplay = activeProfiles.length > 0 ? Arrays.toString(activeProfiles) : "[default]";

        log.info("==================================================================");
        log.info(" DevPulse Backend started successfully!");
        log.info(" Active Profile(s)    : {}", profilesDisplay);
        log.info(" Server Port          : {}", serverPort);
        log.info(" Health Check URL     : http://localhost:{}/api/health", serverPort);

        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();
            String url = metaData.getURL();
            // Sanitize JDBC URL: remove query string or credentials if present
            String sanitizedUrl = url.contains("?") ? url.substring(0, url.indexOf('?')) : url;
            log.info(" Database Connected   : {}", sanitizedUrl);
            log.info(" Database Product     : {} {}", metaData.getDatabaseProductName(), metaData.getDatabaseProductVersion());
        } catch (Exception ex) {
            log.warn(" Database Connectivity Check: Unable to query metadata ({})", ex.getMessage());
        }

        // Production profile safeguards
        boolean isProd = Arrays.asList(activeProfiles).contains("prod") || Arrays.asList(activeProfiles).contains("production");
        if (isProd) {
            String jwtSecret = environment.getProperty("app.jwt.secret");
            if (jwtSecret == null || jwtSecret.contains("dGVzdC1zZWNyZXQta2V5")) {
                log.warn(" SECURITY WARNING: Default test JWT_SECRET detected in production profile! Configure a strong JWT_SECRET environment variable in Railway.");
            }
        }

        log.info("==================================================================");
    }
}
