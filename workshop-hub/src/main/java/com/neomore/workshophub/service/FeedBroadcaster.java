package com.neomore.workshophub.service;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.neomore.workshophub.dto.FeedItem;

/**
 * Manages Server-Sent Events subscribers and broadcasts feed items to the
 * projector dashboard(s). Dead emitters are pruned automatically.
 */
@Component
public class FeedBroadcaster {

    private static final Logger log = LoggerFactory.getLogger(FeedBroadcaster.class);

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    /**
     * Register a new SSE subscriber.
     */
    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        emitters.add(emitter);

        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError(error -> emitters.remove(emitter));

        try {
            emitter.send(SseEmitter.event().name("connected").data(Map.of("status", "connected")));
        } catch (IOException ex) {
            emitters.remove(emitter);
        }
        return emitter;
    }

    /**
     * Broadcast a feed item to every subscriber.
     */
    public void broadcast(FeedItem item) {
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name("feed").data(item));
            } catch (IOException | IllegalStateException ex) {
                log.debug("Removing dead SSE emitter: {}", ex.getMessage());
                emitters.remove(emitter);
            }
        }
    }

    /**
     * Periodic keep-alive to stop idle proxies from closing the stream.
     */
    @Scheduled(fixedDelayString = "#{${workshop.sse-keep-alive-seconds:15} * 1000}")
    public void keepAlive() {
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().comment("keep-alive"));
            } catch (IOException | IllegalStateException ex) {
                emitters.remove(emitter);
            }
        }
    }

    int subscriberCount() {
        return emitters.size();
    }
}
