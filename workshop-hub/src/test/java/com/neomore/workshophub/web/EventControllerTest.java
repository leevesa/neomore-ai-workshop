package com.neomore.workshophub.web;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.neomore.workshophub.config.WorkshopProperties;
import com.neomore.workshophub.dto.FeedItem;
import com.neomore.workshophub.service.WorkshopService;

@WebMvcTest(EventController.class)
class EventControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private WorkshopService workshopService;

    @MockitoBean
    private WorkshopProperties properties;

    @Test
    void publishesValidEventAndReturns201() throws Exception {
        FeedItem item = new FeedItem(1L, "demo", "p-1", "Team A", "task.completed",
                "cap-backend", null, null, Instant.parse("2026-06-22T10:05:00Z"), null);
        when(workshopService.publishEvent(eq("demo"), any())).thenReturn(item);

        mockMvc.perform(post("/sessions/demo/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"participantId\":\"p-1\",\"eventType\":\"task.completed\",\"taskId\":\"cap-backend\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.eventType").value("task.completed"))
                .andExpect(jsonPath("$.taskId").value("cap-backend"));
    }

    @Test
    void rejectsMissingEventTypeWith400() throws Exception {
        mockMvc.perform(post("/sessions/demo/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"participantId\":\"p-1\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.eventType").exists());
    }

    @Test
    void rejectsUnknownEventTypeWith400() throws Exception {
        when(workshopService.publishEvent(eq("demo"), any()))
                .thenThrow(new IllegalArgumentException("Unknown eventType: bogus.type"));

        mockMvc.perform(post("/sessions/demo/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"eventType\":\"bogus.type\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejectsWhenPasswordRequiredAndMissing() throws Exception {
        when(properties.isPasswordProtected()).thenReturn(true);
        when(properties.getPassword()).thenReturn("secret");

        mockMvc.perform(post("/sessions/demo/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"eventType\":\"task.completed\"}"))
                .andExpect(status().isUnauthorized());
    }
}
