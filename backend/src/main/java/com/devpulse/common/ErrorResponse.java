package com.devpulse.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(
        boolean success,
        int status,
        String error,
        String message,
        String path,
        List<FieldErrorDto> validationErrors,
        Instant timestamp
) {
    public ErrorResponse(int status, String error, String message, String path) {
        this(false, status, error, message, path, null, Instant.now());
    }

    public ErrorResponse(int status, String error, String message, String path, List<FieldErrorDto> validationErrors) {
        this(false, status, error, message, path, validationErrors, Instant.now());
    }
}

