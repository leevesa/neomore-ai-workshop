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
import com.neomore.workshophub.repository.EventRepository;
import com.neomore.workshophub.repository.ParticipantRepository;

import java.time.Instant;
import java.util.Map;

@ExtendWith(MockitoExtension.class)
class WorkshopServiceTest {

    @Mock
    private ParticipantRepository participantRepository;
    @Mock
    private EventRepository eventRepository;
    @Mock
    private com.neomore.workshophub.repository.TaskRepository taskRepository;
    @Mock
    private FeedBroadcaster feedBroadcaster;
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
    void registerPersistsParticipantAndBroadcastsConnected() {
        when(participantRepository.save(any(Participant.class))).thenAnswer(i -> i.getArgument(0));

        ParticipantResponse response = service.registerParticipant(
                new RegisterParticipantRequest("Team A"));

        assertThat(response.displayName()).isEqualTo("Team A");
        assertThat(response.participantId()).isNotBlank();

        ArgumentCaptor<EventRecord> eventCaptor = ArgumentCaptor.forClass(EventRecord.class);
        verify(eventRepository).save(eventCaptor.capture());
        assertThat(eventCaptor.getValue().getEventType()).isEqualTo(EventType.PARTICIPANT_CONNECTED);
        verify(feedBroadcaster).broadcast(any(FeedItem.class));
        // Hub auto-verifies the 'register' task on a real registration.
        verify(taskVerificationService).markCompleted(anyString(), eq("Team A"),
                eq("register"), anyString());
    }

    @Test
    void publishEventUpdatesHeartbeatPersistsAndBroadcasts() {
        Participant participant = new Participant("p-1", "Team A", Instant.parse("2026-06-22T10:00:00Z"));
        when(participantRepository.findById("p-1")).thenReturn(Optional.of(participant));

        FeedItem item = service.publishEvent(new PublishEventRequest(
                "p-1", null, "task.completed", "cap-backend", null, "ok", Map.of("attempt", 1)));

        assertThat(item.eventType()).isEqualTo("task.completed");
        assertThat(item.displayName()).isEqualTo("Team A");
        assertThat(item.metadata()).contains("attempt");
        verify(participantRepository).save(participant);
        verify(feedBroadcaster).broadcast(any(FeedItem.class));
    }

    @Test
    void publishEventRejectsUnknownType() {
        assertThatThrownBy(() -> service.publishEvent(new PublishEventRequest(
                null, "Team A", "bogus.type", null, null, null, null)))
                .isInstanceOf(IllegalArgumentException.class);

        verify(eventRepository, never()).save(any());
    }

    @Test
    void publishChatMessageCompletesChatTask() {
        Participant participant = new Participant("p-1", "Team A", Instant.parse("2026-06-22T10:00:00Z"));
        when(participantRepository.findById("p-1")).thenReturn(Optional.of(participant));

        service.publishEvent(new PublishEventRequest(
                "p-1", null, "chat.message.sent", null, "hello room", null, null));

        verify(taskVerificationService).markCompleted(eq("p-1"), eq("Team A"),
                eq("chat"), anyString());
    }

    @Test
    void blankChatMessageDoesNotCompleteChatTask() {
        Participant participant = new Participant("p-1", "Team A", Instant.parse("2026-06-22T10:00:00Z"));
        when(participantRepository.findById("p-1")).thenReturn(Optional.of(participant));

        service.publishEvent(new PublishEventRequest(
                "p-1", null, "chat.message.sent", null, "   ", null, null));

        verify(taskVerificationService, never()).markCompleted(anyString(), any(),
                eq("chat"), anyString());
    }

    @Test
    void recordHeartbeatBroadcastsWithoutPersisting() {
        service.recordHeartbeat();

        ArgumentCaptor<FeedItem> itemCaptor = ArgumentCaptor.forClass(FeedItem.class);
        verify(feedBroadcaster).broadcast(itemCaptor.capture());
        assertThat(itemCaptor.getValue().eventType()).isEqualTo("participant.heartbeat");
        assertThat(itemCaptor.getValue().participantId()).isNull();
        verify(eventRepository, never()).save(any());
    }

    @Test
    void publishEventRejectsUnknownParticipant() {
        when(participantRepository.findById("ghost")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.publishEvent(new PublishEventRequest(
                "ghost", null, "task.started", "connect", null, null, null)))
                .isInstanceOf(NotFoundException.class);
    }
}
