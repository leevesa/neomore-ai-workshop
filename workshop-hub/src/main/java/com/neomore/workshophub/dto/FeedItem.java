package com.neomore.workshophub.dto;

import java.time.Instant;

import com.neomore.workshophub.model.EventRecord;

/**
 * A single item in the activity feed, returned by the REST feed endpoint and
 * pushed over SSE to the projector dashboard.
 */
public record FeedItem(
        Long id,
        String participantId,
        String displayName,
        String eventType,
        String taskId,
        String message,
        String status,
        Instant timestamp,
        String metadata) {

    public static FeedItem from(EventRecord event) {
        return new FeedItem(
                event.getId(),
                event.getParticipantId(),
                event.getDisplayName(),
                event.getEventType().wire(),
                event.getTaskId(),
                event.getMessage(),
                event.getStatus(),
                event.getTimestamp(),
                event.getMetadata());
    }
}
