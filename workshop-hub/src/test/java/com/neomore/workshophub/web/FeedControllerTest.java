package com.neomore.workshophub.web;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.neomore.workshophub.config.WorkshopProperties;
import com.neomore.workshophub.dto.FeedItem;
import com.neomore.workshophub.service.FeedBroadcaster;
import com.neomore.workshophub.service.WorkshopService;

@WebMvcTest(FeedController.class)
class FeedControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private WorkshopService workshopService;

    @MockitoBean
    private FeedBroadcaster feedBroadcaster;

    @MockitoBean
    private WorkshopProperties properties;

    @Test
    void returnsFeedItems() throws Exception {
        FeedItem item = new FeedItem(1L, "demo", "p-1", "Team A", "task.completed",
                "cap-backend", null, null, Instant.parse("2026-06-22T10:05:00Z"), null);
        when(workshopService.readFeed(eq("demo"), isNull())).thenReturn(List.of(item));

        mockMvc.perform(get("/sessions/demo/feed"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].eventType").value("task.completed"))
                .andExpect(jsonPath("$[0].displayName").value("Team A"));
    }

    @Test
    void streamReturnsEventStreamAndSubscribes() throws Exception {
        when(feedBroadcaster.subscribe("demo")).thenReturn(new SseEmitter());

        mockMvc.perform(get("/sessions/demo/feed/stream").accept(MediaType.TEXT_EVENT_STREAM))
                .andExpect(request().asyncStarted())
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_EVENT_STREAM));

        verify(feedBroadcaster).subscribe("demo");
    }
}
