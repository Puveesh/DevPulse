package com.devpulse.common;

public record FieldErrorDto(
        String field,
        String message,
        Object rejectedValue
) {}

