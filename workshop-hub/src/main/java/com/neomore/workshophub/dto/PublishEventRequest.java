package com.neomore.workshophub.dto;

import java.util.Map;

import jakarta.validation.constraints.NotBlank;

/**
 * Request body for publishing a workshop event. The eventType uses the dotted
 * wire format (e.g. "task.completed").
 */
public record PublishEventRequest(
        String participantId,
        String displayName,
        @NotBlank(message = "eventType is required")
        String eventType,
        String taskId,
        String message,
        String status,
        Map<String, Object> metadata) {
}
