package com.neomore.workshophub.service;

import java.time.Instant;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.neomore.workshophub.dto.FeedItem;
import com.neomore.workshophub.model.EventRecord;
import com.neomore.workshophub.model.EventType;
import com.neomore.workshophub.repository.EventRepository;

import lombok.RequiredArgsConstructor;

/**
 * Authors {@code task.completed} events on the server side once the hub has
 * actually observed the work being done. This makes the hub the source of truth
 * for task progress: clients never self-report completion, they perform the real
 * action (register, chat, upload an avatar) and the hub verifies and records it.
 *
 * Completion is idempotent per (session, participant, task): a task is only ever
 * marked complete once for a given participant.
 */
@Service
@RequiredArgsConstructor
public class TaskVerificationService {

    private final EventRepository eventRepository;
    private final FeedBroadcaster feedBroadcaster;

    /**
     * Mark a task complete for a participant, emitting and broadcasting a
     * server-authored {@code task.completed} event. No-op if required fields are
     * missing or the task was already completed by this participant.
     */
    @Transactional
    public void markCompleted(String sessionId, String participantId, String displayName, String taskId,
            String message) {
        if (sessionId == null || participantId == null || participantId.isBlank() || taskId == null) {
            return;
        }
        boolean alreadyDone = eventRepository.existsBySessionIdAndParticipantIdAndTaskIdAndEventType(
                sessionId, participantId, taskId, EventType.TASK_COMPLETED);
        if (alreadyDone) {
            return;
        }

        EventRecord event = new EventRecord();
        event.setSessionId(sessionId);
        event.setParticipantId(participantId);
        event.setDisplayName(displayName);
        event.setEventType(EventType.TASK_COMPLETED);
        event.setTaskId(taskId);
        event.setStatus("completed");
        event.setMessage(message);
        event.setTimestamp(Instant.now());

        EventRecord saved = eventRepository.save(event);
        feedBroadcaster.broadcast(sessionId, FeedItem.from(saved));
    }
}
