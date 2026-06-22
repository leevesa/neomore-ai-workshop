package com.neomore.workshophub.model;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A team/participant profile picture, stored crudely as a raw image BLOB in its
 * own table. Keyed by participantId (one avatar per participant). The image is
 * served back verbatim with its detected content type.
 */
@Entity
@Table(name = "participant_avatar")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Avatar {

    @Id
    private String participantId;

    @Column(nullable = false)
    private String sessionId;

    @Column(nullable = false)
    private String contentType;

    @Lob
    @Column(nullable = false)
    private byte[] data;

    @Column(nullable = false)
    private long sizeBytes;

    @Column(nullable = false)
    private Instant updatedAt;

    public Avatar(String participantId, String sessionId) {
        this.participantId = participantId;
        this.sessionId = sessionId;
    }
}
