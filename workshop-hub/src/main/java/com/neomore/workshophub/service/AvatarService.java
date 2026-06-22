package com.neomore.workshophub.service;

import java.time.Instant;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.neomore.workshophub.model.Avatar;
import com.neomore.workshophub.model.Participant;
import com.neomore.workshophub.repository.AvatarRepository;
import com.neomore.workshophub.repository.ParticipantRepository;

import lombok.RequiredArgsConstructor;

/**
 * Stores and serves participant avatars. On a successful upload the
 * {@code feature-avatar} task is verified and marked complete for the
 * participant (the hub is the source of truth — it only records the task once it
 * has actually received a valid image).
 */
@Service
@RequiredArgsConstructor
public class AvatarService {

    private final AvatarRepository avatarRepository;
    private final ParticipantRepository participantRepository;
    private final AvatarValidator avatarValidator;
    private final TaskVerificationService taskVerificationService;

    @Transactional
    public void store(String sessionId, String participantId, byte[] data) {
        Participant participant = participantRepository.findByIdAndSessionId(participantId, sessionId)
                .orElseThrow(() -> new NotFoundException(
                        "Unknown participant " + participantId + " in session " + sessionId));

        String contentType = avatarValidator.validate(data);

        Avatar avatar = avatarRepository.findById(participantId)
                .orElseGet(() -> new Avatar(participantId, sessionId));
        avatar.setSessionId(sessionId);
        avatar.setContentType(contentType);
        avatar.setData(data);
        avatar.setSizeBytes(data.length);
        avatar.setUpdatedAt(Instant.now());
        avatarRepository.save(avatar);

        taskVerificationService.markCompleted(sessionId, participantId, participant.getDisplayName(),
                "feature-avatar", participant.getDisplayName() + " added a team avatar");
    }

    @Transactional(readOnly = true)
    public Avatar get(String sessionId, String participantId) {
        return avatarRepository.findByParticipantIdAndSessionId(participantId, sessionId)
                .orElseThrow(() -> new NotFoundException(
                        "No avatar for participant " + participantId + " in session " + sessionId));
    }
}
