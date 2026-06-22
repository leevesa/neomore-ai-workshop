package com.neomore.workshophub.service;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.neomore.workshophub.config.WorkshopProperties;
import com.neomore.workshophub.dto.FeedItem;

/**
 * Manages Server-Sent Events subscribers per session and broadcasts feed items
 * to the projector dashboard(s). Dead emitters are pruned automatically.
 */
@Component
public class FeedBroadcaster {

    private static final Logger log = LoggerFactory.getLogger(FeedBroadcaster.class);

    private final Map<String, List<SseEmitter>> emittersBySession = new ConcurrentHashMap<>();
    private final WorkshopProperties properties;

    public FeedBroadcaster(WorkshopProperties properties) {
        this.properties = properties;
    }

    /**
     * Register a new SSE subscriber for the given session.
     */
    public SseEmitter subscribe(String sessionId) {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        List<SseEmitter> emitters = emittersBySession.computeIfAbsent(sessionId, key -> new CopyOnWriteArrayList<>());
        emitters.add(emitter);

        emitter.onCompletion(() -> remove(sessionId, emitter));
        emitter.onTimeout(() -> remove(sessionId, emitter));
        emitter.onError(error -> remove(sessionId, emitter));

        try {
            emitter.send(SseEmitter.event().name("connected").data(Map.of("sessionId", sessionId)));
        } catch (IOException ex) {
            remove(sessionId, emitter);
        }
        return emitter;
    }

    /**
     * Broadcast a feed item to every subscriber of the session.
     */
    public void broadcast(String sessionId, FeedItem item) {
        List<SseEmitter> emitters = emittersBySession.get(sessionId);
        if (emitters == null || emitters.isEmpty()) {
            return;
        }
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name("feed").data(item));
            } catch (IOException | IllegalStateException ex) {
                log.debug("Removing dead SSE emitter for session {}: {}", sessionId, ex.getMessage());
                remove(sessionId, emitter);
            }
        }
    }

    /**
     * Periodic keep-alive to stop idle proxies from closing the stream.
     */
    @Scheduled(fixedDelayString = "#{${workshop.sse-keep-alive-seconds:15} * 1000}")
    public void keepAlive() {
        emittersBySession.forEach((sessionId, emitters) -> {
            for (SseEmitter emitter : emitters) {
                try {
                    emitter.send(SseEmitter.event().comment("keep-alive"));
                } catch (IOException | IllegalStateException ex) {
                    remove(sessionId, emitter);
                }
            }
        });
    }

    int subscriberCount(String sessionId) {
        List<SseEmitter> emitters = emittersBySession.get(sessionId);
        return emitters == null ? 0 : emitters.size();
    }

    private void remove(String sessionId, SseEmitter emitter) {
        List<SseEmitter> emitters = emittersBySession.get(sessionId);
        if (emitters != null) {
            emitters.remove(emitter);
        }
    }
}
