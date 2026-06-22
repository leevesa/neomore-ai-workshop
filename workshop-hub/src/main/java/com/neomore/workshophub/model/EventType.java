package com.neomore.workshophub.model;

import java.util.Arrays;

/**
 * Supported workshop event types. The wire format uses dotted lowercase names
 * (e.g. "task.completed") as defined in the Workshop Hub contract.
 */
public enum EventType {

    PARTICIPANT_CONNECTED("participant.connected"),
    PARTICIPANT_HEARTBEAT("participant.heartbeat"),
    TASK_STARTED("task.started"),
    TASK_COMPLETED("task.completed"),
    CHAT_MESSAGE_SENT("chat.message.sent"),
    CHECKPOINT_PASSED("checkpoint.passed"),
    VERIFICATION_FAILED("verification.failed");

    private final String wire;

    EventType(String wire) {
        this.wire = wire;
    }

    public String wire() {
        return wire;
    }

    /**
     * Resolve an {@link EventType} from its dotted wire name.
     *
     * @throws IllegalArgumentException if the value does not map to a known type
     */
    public static EventType fromWire(String value) {
        if (value == null) {
            throw new IllegalArgumentException("eventType is required");
        }
        String normalized = value.trim().toLowerCase();
        return Arrays.stream(values())
                .filter(type -> type.wire.equals(normalized))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown eventType: " + value));
    }
}
