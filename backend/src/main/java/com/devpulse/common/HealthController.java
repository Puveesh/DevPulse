package com.devpulse.common;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    private static final Logger log = LoggerFactory.getLogger(HealthController.class);
    private final DataSource dataSource;

    public HealthController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> checkHealth() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", "UP");
        body.put("service", "DevPulse Backend API");
        body.put("timestamp", Instant.now().toString());

        boolean isDatabaseConnected = false;
        try (Connection conn = dataSource.getConnection()) {
            isDatabaseConnected = conn.isValid(2);
        } catch (Exception ex) {
            log.warn("Health check: database connection check failed: {}", ex.getMessage());
            isDatabaseConnected = false;
        }

        body.put("database", isDatabaseConnected ? "CONNECTED" : "DISCONNECTED");

        if (isDatabaseConnected) {
            return ResponseEntity.ok(body);
        } else {
            body.put("status", "DEGRADED");
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(body);
        }
    }
}
