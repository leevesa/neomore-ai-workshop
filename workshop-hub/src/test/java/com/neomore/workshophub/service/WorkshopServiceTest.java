package com.neomore.workshophub.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import tools.jackson.databind.ObjectMapper;

import com.neomore.workshophub.dto.FeedItem;
import com.neomore.workshophub.dto.ParticipantResponse;
import com.neomore.workshophub.dto.PublishEventRequest;
import com.neomore.workshophub.dto.RegisterParticipantRequest;
import com.neomore.workshophub.model.EventRecord;
import com.neomore.workshophub.model.EventType;
import com.neomore.workshophub.model.Participant;
import com.neomore.workshophub.model.Session;
import com.neomore.workshophub.repository.EventRepository;
import com.neomore.workshophub.repository.ParticipantRepository;
import com.neomore.workshophub.repository.SessionRepository;
import com.neomore.workshophub.repository.TaskRepository;

import java.time.Instant;
import java.util.Map;

@ExtendWith(MockitoExtension.class)
class WorkshopServiceTest {

    @Mock
    private SessionRepository sessionRepository;
    @Mock
    private ParticipantRepository participantRepository;
    @Mock
    private EventRepository eventRepository;
    @Mock
    private TaskRepository taskRepository;
    @Mock
    private FeedBroadcaster feedBroadcaster;
    @Mock
    private TaskSeeder taskSeeder;
    @Mock
    private TaskVerificationService taskVerificationService;
    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private WorkshopService service;

    @BeforeEach
    void echoSavedEvents() {
        lenient().when(eventRepository.save(any(EventRecord.class))).thenAnswer(invocation -> {
            EventRecord event = invocation.getArgument(0);
            event.setId(99L);
            return event;
        });
    }

    @Test
    void registerCreatesSessionSeedsTasksAndBroadcastsConnected() {
        when(sessionRepository.findById("demo")).thenReturn(Optional.empty());
        when(sessionRepository.save(any(Session.class))).thenAnswer(i -> i.getArgument(0));
        when(participantRepository.save(any(Participant.class))).thenAnswer(i -> i.getArgument(0));

        ParticipantResponse response = service.registerParticipant("demo",
                new RegisterParticipantRequest("Team A"));

        assertThat(response.displayName()).isEqualTo("Team A");
        assertThat(response.sessionId()).isEqualTo("demo");
        assertThat(response.participantId()).isNotBlank();
        verify(taskSeeder).seedTasksFor("demo");

        ArgumentCaptor<EventRecord> eventCaptor = ArgumentCaptor.forClass(EventRecord.class);
        verify(eventRepository).save(eventCaptor.capture());
        assertThat(eventCaptor.getValue().getEventType()).isEqualTo(EventType.PARTICIPANT_CONNECTED);
        verify(feedBroadcaster).broadcast(eq("demo"), any(FeedItem.class));
        // Hub auto-verifies the 'register' task on a real registration.
        verify(taskVerificationService).markCompleted(eq("demo"), anyString(), eq("Team A"),
                eq("register"), anyString());
    }

    @Test
    void publishEventUpdatesHeartbeatPersistsAndBroadcasts() {
        when(sessionRepository.findById("demo")).thenReturn(
                Optional.of(new Session("demo", "demo", Instant.parse("2026-06-22T09:00:00Z"))));
        Participant participant = new Participant("p-1", "demo", "Team A", Instant.parse("2026-06-22T10:00:00Z"));
        when(participantRepository.findByIdAndSessionId("p-1", "demo")).thenReturn(Optional.of(participant));

        FeedItem item = service.publishEvent("demo", new PublishEventRequest(
                "p-1", null, "task.completed", "cap-backend", null, "ok", Map.of("attempt", 1)));

        assertThat(item.eventType()).isEqualTo("task.completed");
        assertThat(item.displayName()).isEqualTo("Team A");
        assertThat(item.metadata()).contains("attempt");
        verify(participantRepository).save(participant);
        verify(feedBroadcaster).broadcast(eq("demo"), any(FeedItem.class));
    }

    @Test
    void publishEventRejectsUnknownType() {
        when(sessionRepository.findById("demo")).thenReturn(
                Optional.of(new Session("demo", "demo", Instant.parse("2026-06-22T09:00:00Z"))));

        assertThatThrownBy(() -> service.publishEvent("demo", new PublishEventRequest(
                null, "Team A", "bogus.type", null, null, null, null)))
                .isInstanceOf(IllegalArgumentException.class);

        verify(eventRepository, never()).save(any());
    }

    @Test
    void publishChatMessageCompletesChatTask() {
        when(sessionRepository.findById("demo")).thenReturn(
                Optional.of(new Session("demo", "demo", Instant.parse("2026-06-22T09:00:00Z"))));
        Participant participant = new Participant("p-1", "demo", "Team A", Instant.parse("2026-06-22T10:00:00Z"));
        when(participantRepository.findByIdAndSessionId("p-1", "demo")).thenReturn(Optional.of(participant));

        service.publishEvent("demo", new PublishEventRequest(
                "p-1", null, "chat.message.sent", null, "hello room", null, null));

        verify(taskVerificationService).markCompleted(eq("demo"), eq("p-1"), eq("Team A"),
                eq("chat"), anyString());
    }

    @Test
    void blankChatMessageDoesNotCompleteChatTask() {
        when(sessionRepository.findById("demo")).thenReturn(
                Optional.of(new Session("demo", "demo", Instant.parse("2026-06-22T09:00:00Z"))));
        Participant participant = new Participant("p-1", "demo", "Team A", Instant.parse("2026-06-22T10:00:00Z"));
        when(participantRepository.findByIdAndSessionId("p-1", "demo")).thenReturn(Optional.of(participant));

        service.publishEvent("demo", new PublishEventRequest(
                "p-1", null, "chat.message.sent", null, "   ", null, null));

        verify(taskVerificationService, never()).markCompleted(anyString(), anyString(), any(),
                eq("chat"), anyString());
    }

    @Test
    void recordHeartbeatBroadcastsWithoutPersisting() {
        when(sessionRepository.existsById("demo")).thenReturn(true);

        service.recordHeartbeat("demo");

        ArgumentCaptor<FeedItem> itemCaptor = ArgumentCaptor.forClass(FeedItem.class);
        verify(feedBroadcaster).broadcast(eq("demo"), itemCaptor.capture());
        assertThat(itemCaptor.getValue().eventType()).isEqualTo("participant.heartbeat");
        assertThat(itemCaptor.getValue().participantId()).isNull();
        verify(eventRepository, never()).save(any());
    }

    @Test
    void readFeedRejectsUnknownSession() {
        when(sessionRepository.existsById("missing")).thenReturn(false);

        assertThatThrownBy(() -> service.readFeed("missing", null))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    void publishEventRejectsUnknownParticipant() {
        when(sessionRepository.findById("demo")).thenReturn(
                Optional.of(new Session("demo", "demo", Instant.parse("2026-06-22T09:00:00Z"))));
        when(participantRepository.findByIdAndSessionId(anyString(), eq("demo"))).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.publishEvent("demo", new PublishEventRequest(
                "ghost", null, "task.started", "connect", null, null, null)))
                .isInstanceOf(NotFoundException.class);
    }
}
