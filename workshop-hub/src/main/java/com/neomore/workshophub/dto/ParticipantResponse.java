package com.neomore.workshophub.dto;

import java.time.Instant;

import com.neomore.workshophub.model.Participant;

/**
 * Response returned after registering or looking up a participant.
 */
public record ParticipantResponse(
        String participantId,
        String sessionId,
        String displayName,
        Instant connectedAt,
        Instant lastHeartbeatAt) {

    public static ParticipantResponse from(Participant participant) {
        return new ParticipantResponse(
                participant.getId(),
                participant.getSessionId(),
                participant.getDisplayName(),
                participant.getConnectedAt(),
                participant.getLastHeartbeatAt());
    }
}
