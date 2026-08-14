package com.neomore.workshophub.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
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
import com.neomore.workshophub.repository.EventRepository;
import com.neomore.workshophub.repository.ParticipantRepository;
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

    private final ParticipantRepository participantRepository;
    private final EventRepository eventRepository;
    private final TaskRepository taskRepository;
    private final FeedBroadcaster feedBroadcaster;
    private final TaskVerificationService taskVerificationService;
    private final ObjectMapper objectMapper;

    public WorkshopService(ParticipantRepository participantRepository,
                           EventRepository eventRepository,
                           TaskRepository taskRepository,
                           FeedBroadcaster feedBroadcaster,
                           TaskVerificationService taskVerificationService,
                           ObjectMapper objectMapper) {
        this.participantRepository = participantRepository;
        this.eventRepository = eventRepository;
        this.taskRepository = taskRepository;
        this.feedBroadcaster = feedBroadcaster;
        this.taskVerificationService = taskVerificationService;
        this.objectMapper = objectMapper;
    }

    /**
     * Register a participant/team and emit a participant.connected event.
     */
    @Transactional
    public ParticipantResponse registerParticipant(RegisterParticipantRequest request) {
        Instant now = Instant.now();

        Participant participant = new Participant(
                UUID.randomUUID().toString(),
                request.displayName().trim(),
                now);
        participantRepository.save(participant);

        EventRecord event = baseEvent(EventType.PARTICIPANT_CONNECTED, now);
        event.setParticipantId(participant.getId());
        event.setDisplayName(participant.getDisplayName());
        event.setMessage(participant.getDisplayName() + " connected");
        persistAndBroadcast(event);

        // Hub is the source of truth: a real registration completes the 'register' task.
        taskVerificationService.markCompleted(participant.getId(), participant.getDisplayName(),
                "register", participant.getDisplayName() + " registered");

        return ParticipantResponse.from(participant);
    }

    /**
     * Validate and publish an event, updating participant heartbeat where applicable.
     */
    @Transactional
    public FeedItem publishEvent(PublishEventRequest request) {
        EventType eventType = EventType.fromWire(request.eventType());
        if (eventType == EventType.TASK_COMPLETED) {
            throw new IllegalArgumentException(
                    "task.completed events are authored by the Workshop Hub");
        }
        Instant now = Instant.now();

        String displayName = request.displayName();
        if (request.participantId() != null && !request.participantId().isBlank()) {
            Participant participant = participantRepository
                    .findById(request.participantId())
                    .orElseThrow(() -> new NotFoundException(
                            "Unknown participant " + request.participantId()));
            participant.setLastHeartbeatAt(now);
            participantRepository.save(participant);
            if (displayName == null || displayName.isBlank()) {
                displayName = participant.getDisplayName();
            }
        }

        EventRecord event = baseEvent(eventType, now);
        event.setParticipantId(request.participantId());
        event.setDisplayName(displayName);
        event.setTaskId(request.taskId());
        event.setMessage(request.message());
        event.setStatus(request.status());
        Map<String, Object> metadata = request.metadata();
        boolean reply = false;
        if (eventType == EventType.CHAT_MESSAGE_SENT) {
            metadata = validateReplyMetadata(metadata);
            reply = metadata != null && metadata.containsKey("replyToEventId");
        }
        event.setMetadata(serializeMetadata(metadata));

        FeedItem item = persistAndBroadcast(event);

        if (eventType == EventType.CHAT_MESSAGE_SENT
                && request.message() != null && !request.message().isBlank()) {
            taskVerificationService.markCompleted(request.participantId(), displayName,
                    "chat", "Posted to the chatboard");
            if (hasMultipleNonBlankLines(request.message())) {
                taskVerificationService.markCompleted(request.participantId(), displayName,
                        "multiline-message", "Sent a multiline chat message");
            }
            if (reply) {
                taskVerificationService.markCompleted(request.participantId(), displayName,
                        "reply-message", "Replied to a chat message");
            }
        }

        return item;
    }

    /**
     * Record an anonymous heartbeat. Heartbeats are ephemeral presence pings:
     * they are broadcast to the live dashboard (which keeps a global counter) but
     * not persisted, so they never bloat the feed history.
     */
    @Transactional(readOnly = true)
    public void recordHeartbeat() {
        FeedItem item = new FeedItem(null, null, null,
                EventType.PARTICIPANT_HEARTBEAT.wire(), null, "heartbeat", null, Instant.now(), null);
        feedBroadcaster.broadcast(item);
    }

        /**
         * Record a participant heartbeat and verify that the Hub observed it. The
         * pulse remains ephemeral even though participant presence is updated.
         */
        @Transactional
        public void recordHeartbeat(String participantId) {
        if (participantId == null || participantId.isBlank()) {
            throw new IllegalArgumentException("participantId is required");
        }

        Participant participant = participantRepository.findById(participantId)
            .orElseThrow(() -> new NotFoundException(
                "Unknown participant " + participantId));
        Instant now = Instant.now();
        participant.setLastHeartbeatAt(now);
        participantRepository.save(participant);

        FeedItem item = new FeedItem(null, participant.getId(), participant.getDisplayName(),
            EventType.PARTICIPANT_HEARTBEAT.wire(), null, "heartbeat", null, now, null);
        feedBroadcaster.broadcast(item);
        taskVerificationService.markCompleted(participant.getId(), participant.getDisplayName(),
            "heartbeat", "Sent a participant heartbeat");
        }

    /**
     * Read the most recent feed items, newest first.
     */
    @Transactional(readOnly = true)
    public List<FeedItem> readFeed(Integer limit) {
        int effectiveLimit = limit == null ? DEFAULT_FEED_LIMIT : Math.min(Math.max(limit, 1), MAX_FEED_LIMIT);
        return eventRepository
                .findAllByOrderByTimestampDescIdDesc(PageRequest.of(0, effectiveLimit))
                .stream()
                .map(FeedItem::from)
                .toList();
    }

    /**
     * Return the canonical task list.
     */
    @Transactional(readOnly = true)
    public List<TaskResponse> listTasks() {
        return taskRepository.findAllByOrderByOrdinalAsc()
                .stream()
                .map(TaskResponse::from)
                .toList();
    }

    private EventRecord baseEvent(EventType eventType, Instant timestamp) {
        EventRecord event = new EventRecord();
        event.setEventType(eventType);
        event.setTimestamp(timestamp);
        return event;
    }

    private FeedItem persistAndBroadcast(EventRecord event) {
        EventRecord saved = eventRepository.save(event);
        FeedItem item = FeedItem.from(saved);
        feedBroadcaster.broadcast(item);
        return item;
    }

    private Map<String, Object> validateReplyMetadata(Map<String, Object> metadata) {
        if (metadata == null || !metadata.containsKey("replyToEventId")) {
            return metadata;
        }

        long replyToEventId = parseReplyToEventId(metadata.get("replyToEventId"));
        EventRecord target = eventRepository.findById(replyToEventId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "replyToEventId must reference an existing chat message"));
        if (target.getEventType() != EventType.CHAT_MESSAGE_SENT) {
            throw new IllegalArgumentException(
                    "replyToEventId must reference an existing chat message");
        }

        Map<String, Object> enriched = new LinkedHashMap<>(metadata);
        enriched.put("replyToEventId", replyToEventId);
        enriched.put("replyToDisplayName", target.getDisplayName());
        enriched.put("replyToMessage", target.getMessage());
        return enriched;
    }

    private long parseReplyToEventId(Object value) {
        if (!(value instanceof Number) && !(value instanceof String)) {
            throw new IllegalArgumentException("replyToEventId must be a positive integer");
        }
        try {
            long eventId = new BigDecimal(value.toString().trim()).longValueExact();
            if (eventId <= 0) {
                throw new IllegalArgumentException("replyToEventId must be a positive integer");
            }
            return eventId;
        } catch (NumberFormatException | ArithmeticException ex) {
            throw new IllegalArgumentException("replyToEventId must be a positive integer");
        }
    }

    private boolean hasMultipleNonBlankLines(String message) {
        return message.lines().filter(line -> !line.isBlank()).limit(2).count() == 2;
    }

    private String serializeMetadata(Map<String, Object> metadata) {
        if (metadata == null || metadata.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(metadata);
        } catch (JacksonException ex) {
            throw new IllegalArgumentException("Invalid metadata: " + ex.getMessage());
        }
    }
}
