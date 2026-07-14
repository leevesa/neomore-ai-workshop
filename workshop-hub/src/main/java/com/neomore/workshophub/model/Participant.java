package com.neomore.workshophub.model;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * A participant or team registered to the workshop.
 */
@Entity
@Table(name = "participants")
public class Participant {

    @Id
    private String id;

    @Column(nullable = false)
    private String displayName;

    @Column(nullable = false)
    private Instant connectedAt;

    @Column(nullable = false)
    private Instant lastHeartbeatAt;

    protected Participant() {
        // for JPA
    }

    public Participant(String id, String displayName, Instant connectedAt) {
        this.id = id;
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
