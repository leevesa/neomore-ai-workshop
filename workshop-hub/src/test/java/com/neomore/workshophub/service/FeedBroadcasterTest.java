package com.neomore.workshophub.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

import java.time.Instant;

import org.junit.jupiter.api.Test;

import com.neomore.workshophub.config.WorkshopProperties;
import com.neomore.workshophub.dto.FeedItem;

class FeedBroadcasterTest {

    private final FeedBroadcaster broadcaster = new FeedBroadcaster(new WorkshopProperties());

    @Test
    void subscribeRegistersEmitterForSession() {
        assertThat(broadcaster.subscriberCount("demo")).isZero();

        broadcaster.subscribe("demo");

        assertThat(broadcaster.subscriberCount("demo")).isEqualTo(1);
    }

    @Test
    void broadcastToSubscriberDoesNotThrow() {
        broadcaster.subscribe("demo");
        FeedItem item = new FeedItem(1L, "demo", "p-1", "Team A", "task.completed",
                "cap-backend", null, null, Instant.now(), null);

        assertThatCode(() -> broadcaster.broadcast("demo", item)).doesNotThrowAnyException();
    }

    @Test
    void broadcastWithNoSubscribersIsNoOp() {
        FeedItem item = new FeedItem(1L, "empty", null, null, "task.started",
                null, null, null, Instant.now(), null);

        assertThatCode(() -> broadcaster.broadcast("empty", item)).doesNotThrowAnyException();
        assertThat(broadcaster.subscriberCount("empty")).isZero();
    }
}
