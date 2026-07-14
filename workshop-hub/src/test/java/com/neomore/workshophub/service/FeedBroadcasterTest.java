package com.neomore.workshophub.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

import java.time.Instant;

import org.junit.jupiter.api.Test;

import com.neomore.workshophub.dto.FeedItem;

class FeedBroadcasterTest {

    private final FeedBroadcaster broadcaster = new FeedBroadcaster();

    @Test
    void subscribeRegistersEmitter() {
        assertThat(broadcaster.subscriberCount()).isZero();

        broadcaster.subscribe();

        assertThat(broadcaster.subscriberCount()).isEqualTo(1);
    }

    @Test
    void broadcastToSubscriberDoesNotThrow() {
        broadcaster.subscribe();
        FeedItem item = new FeedItem(1L, "p-1", "Team A", "task.completed",
                "cap-backend", null, null, Instant.now(), null);

        assertThatCode(() -> broadcaster.broadcast(item)).doesNotThrowAnyException();
    }

    @Test
    void broadcastWithNoSubscribersIsNoOp() {
        FeedItem item = new FeedItem(1L, null, null, "task.started",
                null, null, null, Instant.now(), null);

        assertThatCode(() -> broadcaster.broadcast(item)).doesNotThrowAnyException();
        assertThat(broadcaster.subscriberCount()).isZero();
    }
}
