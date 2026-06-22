package com.neomore.workshophub.model;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * A live workshop session. The session id is supplied by the caller (path
 * variable) and is stable for the duration of a workshop.
 */
@Entity
@Table(name = "sessions")
public class Session {

    @Id
    private String id;

    @Column(nullable = false)
    private String displayName;

    @Column(nullable = false)
    private Instant createdAt;

    protected Session() {
        // for JPA
    }

    public Session(String id, String displayName, Instant createdAt) {
        this.id = id;
        this.displayName = displayName;
        this.createdAt = createdAt;
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

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
