package com.neomore.workshophub.dto;

import java.time.Instant;

/**
 * Lightweight health payload for the contract /health endpoint.
 */
public record HealthResponse(String status, Instant timestamp) {

    public static HealthResponse up() {
        return new HealthResponse("UP", Instant.now());
    }
}
