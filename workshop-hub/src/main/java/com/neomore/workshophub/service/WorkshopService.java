package com.neomore.workshophub.service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.neomore.workshophub.dto.FeedItem;
import com.neomore.workshophub.dto.ParticipantResponse;
import com.neomore.workshophub.dto.PublishEventRequest;
import com.neomore.workshophub.dto.RegisterParticipantRequest;
import com.neomore.workshophub.dto.TaskResponse;
import com.neomore.workshophub.model.EventRecord;
import com.neomore.workshophub.model.EventType;
import com.neomore.workshophub.model.Participant;
import com.neomore.workshophub.model.Session;
import com.neomore.workshophub.repository.EventRepository;
import com.neomore.workshophub.repository.ParticipantRepository;
import com.neomore.workshophub.repository.SessionRepository;
import com.neomore.workshophub.repository.TaskRepository;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

/**
 * Core Workshop Hub business logic: participant registration, event publishing,
 * feed reads, and task lookups. Every persisted event is broadcast to the live
 * feed via {@link FeedBroadcaster}.
 */
@Service
public class WorkshopService {

    private static final int DEFAULT_FEED_LIMIT = 50;
    private static final int MAX_FEED_LIMIT = 200;

    private final SessionRepository sessionRepository;
    private final ParticipantRepository participantRepository;
    private final EventRepository eventRepository;
    private final TaskRepository taskRepository;
    private final FeedBroadcaster feedBroadcaster;
    private final TaskSeeder taskSeeder;
    private final TaskVerificationService taskVerificationService;
    private final ObjectMapper objectMapper;

    public WorkshopService(SessionRepository sessionRepository,
                           ParticipantRepository participantRepository,
                           EventRepository eventRepository,
                           TaskRepository taskRepository,
                           FeedBroadcaster feedBroadcaster,
                           TaskSeeder taskSeeder,
                           TaskVerificationService taskVerificationService,
                           ObjectMapper objectMapper) {
        this.sessionRepository = sessionRepository;
        this.participantRepository = participantRepository;
        this.eventRepository = eventRepository;
        this.taskRepository = taskRepository;
        this.feedBroadcaster = feedBroadcaster;
        this.taskSeeder = taskSeeder;
        this.taskVerificationService = taskVerificationService;
        this.objectMapper = objectMapper;
    }

    /**
     * Create and seed a session if it does not yet exist. Used at startup for
     * the default session.
     */
    @Transactional
    public void ensureSeededSession(String sessionId) {
        ensureSession(sessionId);
    }

    /**
     * Register a participant/team, auto-creating the session if needed, and emit
     * a participant.connected event.
     */
    @Transactional
    public ParticipantResponse registerParticipant(String sessionId, RegisterParticipantRequest request) {
        Session session = ensureSession(sessionId);
        Instant now = Instant.now();

        Participant participant = new Participant(
                UUID.randomUUID().toString(),
                session.getId(),
                request.displayName().trim(),
                now);
        participantRepository.save(participant);

        EventRecord event = baseEvent(sessionId, EventType.PARTICIPANT_CONNECTED, now);
        event.setParticipantId(participant.getId());
        event.setDisplayName(participant.getDisplayName());
        event.setMessage(participant.getDisplayName() + " connected");
        persistAndBroadcast(event);

        // Hub is the source of truth: a real registration completes the 'register' task.
        taskVerificationService.markCompleted(sessionId, participant.getId(), participant.getDisplayName(),
                "register", participant.getDisplayName() + " registered");

        return ParticipantResponse.from(participant);
    }

    /**
     * Validate and publish an event, updating participant heartbeat where applicable.
     */
    @Transactional
    public FeedItem publishEvent(String sessionId, PublishEventRequest request) {
        ensureSession(sessionId);
        EventType eventType = EventType.fromWire(request.eventType());
        Instant now = Instant.now();

        String displayName = request.displayName();
        if (request.participantId() != null && !request.participantId().isBlank()) {
            Participant participant = participantRepository
                    .findByIdAndSessionId(request.participantId(), sessionId)
                    .orElseThrow(() -> new NotFoundException(
                            "Unknown participant " + request.participantId() + " in session " + sessionId));
            participant.setLastHeartbeatAt(now);
            participantRepository.save(participant);
            if (displayName == null || displayName.isBlank()) {
                displayName = participant.getDisplayName();
            }
        }

        EventRecord event = baseEvent(sessionId, eventType, now);
        event.setParticipantId(request.participantId());
        event.setDisplayName(displayName);
        event.setTaskId(request.taskId());
        event.setMessage(request.message());
        event.setStatus(request.status());
        event.setMetadata(serializeMetadata(request));

        FeedItem item = persistAndBroadcast(event);

        // Hub is the source of truth: a real chat message completes the 'chat' task.
        if (eventType == EventType.CHAT_MESSAGE_SENT
                && request.message() != null && !request.message().isBlank()) {
            taskVerificationService.markCompleted(sessionId, request.participantId(), displayName,
                    "chat", "Posted to the chatboard");
        }

        return item;
    }

    /**
     * Record an anonymous heartbeat for a session. Heartbeats are ephemeral
     * presence pings: they are broadcast to the live dashboard (which keeps a
     * global counter) but not persisted, so they never bloat the feed history.
     */
    @Transactional(readOnly = true)
    public void recordHeartbeat(String sessionId) {
        requireSession(sessionId);
        FeedItem item = new FeedItem(null, sessionId, null, null,
                EventType.PARTICIPANT_HEARTBEAT.wire(), null, "heartbeat", null, Instant.now(), null);
        feedBroadcaster.broadcast(sessionId, item);
    }

    /**
     * Read the most recent feed items for a session, newest first.
     */
    @Transactional(readOnly = true)
    public List<FeedItem> readFeed(String sessionId, Integer limit) {
        requireSession(sessionId);
        int effectiveLimit = limit == null ? DEFAULT_FEED_LIMIT : Math.min(Math.max(limit, 1), MAX_FEED_LIMIT);
        return eventRepository
                .findBySessionIdOrderByTimestampDescIdDesc(sessionId, PageRequest.of(0, effectiveLimit))
                .stream()
                .map(FeedItem::from)
                .toList();
    }

    /**
     * Return the canonical task list for a session.
     */
    @Transactional(readOnly = true)
    public List<TaskResponse> listTasks(String sessionId) {
        requireSession(sessionId);
        return taskRepository.findBySessionIdOrderByOrdinalAsc(sessionId)
                .stream()
                .map(TaskResponse::from)
                .toList();
    }

    public boolean sessionExists(String sessionId) {
        return sessionRepository.existsById(sessionId);
    }

    private Session ensureSession(String sessionId) {
        return sessionRepository.findById(sessionId).orElseGet(() -> {
            Session session = sessionRepository.save(new Session(sessionId, sessionId, Instant.now()));
            taskSeeder.seedTasksFor(sessionId);
            return session;
        });
    }

    private void requireSession(String sessionId) {
        if (!sessionRepository.existsById(sessionId)) {
            throw new NotFoundException("Unknown session " + sessionId);
        }
    }

    private EventRecord baseEvent(String sessionId, EventType eventType, Instant timestamp) {
        EventRecord event = new EventRecord();
        event.setSessionId(sessionId);
        event.setEventType(eventType);
        event.setTimestamp(timestamp);
        return event;
    }

    private FeedItem persistAndBroadcast(EventRecord event) {
        EventRecord saved = eventRepository.save(event);
        FeedItem item = FeedItem.from(saved);
        feedBroadcaster.broadcast(saved.getSessionId(), item);
        return item;
    }

    private String serializeMetadata(PublishEventRequest request) {
        if (request.metadata() == null || request.metadata().isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(request.metadata());
        } catch (JacksonException ex) {
            throw new IllegalArgumentException("Invalid metadata: " + ex.getMessage());
        }
    }
}
