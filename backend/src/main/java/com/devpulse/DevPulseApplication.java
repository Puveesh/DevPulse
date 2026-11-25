package com.devpulse;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.web.config.EnableSpringDataWebSupport;

@SpringBootApplication
@EnableJpaAuditing
@EnableSpringDataWebSupport(pageSerializationMode = EnableSpringDataWebSupport.PageSerializationMode.VIA_DTO)
public class DevPulseApplication {

    public static void main(String[] args) {
        loadDotEnvIfPresent();
        SpringApplication.run(DevPulseApplication.class, args);
    }

    /**
     * Loads key-value pairs from a local .env file into System properties if not already
     * defined in the environment. Keeps local development smooth without exposing secrets to git.
     */
    static void loadDotEnvIfPresent() {
        String[] potentialPaths = {
            ".env",
            "../.env",
            "backend/.env",
            "../backend/.env"
        };
        for (String p : potentialPaths) {
            java.io.File file = new java.io.File(p);
            if (file.exists() && file.isFile()) {
                try {
                    java.util.List<String> lines = java.nio.file.Files.readAllLines(file.toPath());
                    for (String line : lines) {
                        line = line.trim();
                        if (line.isEmpty() || line.startsWith("#")) continue;
                        int idx = line.indexOf('=');
                        if (idx > 0) {
                            String key = line.substring(0, idx).trim();
                            String val = line.substring(idx + 1).trim();
                            if (val.startsWith("\"") && val.endsWith("\"") && val.length() >= 2) {
                                val = val.substring(1, val.length() - 1);
                            }
                            if (System.getProperty(key) == null && System.getenv(key) == null) {
                                System.setProperty(key, val);
                            }
                        }
                    }
                } catch (Exception ignored) {
                }
            }
        }
    }
}