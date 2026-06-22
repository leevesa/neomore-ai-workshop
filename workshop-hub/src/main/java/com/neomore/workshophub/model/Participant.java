package com.neomore.workshophub.model;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

/**
 * A participant or team registered to a session.
 */
@Entity
@Table(name = "participants", indexes = @Index(name = "idx_participant_session", columnList = "sessionId"))
public class Participant {

    @Id
    private String id;

    @Column(nullable = false)
    private String sessionId;

    @Column(nullable = false)
    private String displayName;

    @Column(nullable = false)
    private Instant connectedAt;

    @Column(nullable = false)
    private Instant lastHeartbeatAt;

    protected Participant() {
        // for JPA
    }

    public Participant(String id, String sessionId, String displayName, Instant connectedAt) {
        this.id = id;
        this.sessionId = sessionId;
        this.displayName = displayName;
        this.connectedAt = connectedAt;
        this.lastHeartbeatAt = connectedAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public Instant getConnectedAt() {
        return connectedAt;
    }

    public void setConnectedAt(Instant connectedAt) {
        this.connectedAt = connectedAt;
    }

    public Instant getLastHeartbeatAt() {
        return lastHeartbeatAt;
    }

    public void setLastHeartbeatAt(Instant lastHeartbeatAt) {
        this.lastHeartbeatAt = lastHeartbeatAt;
    }
}
