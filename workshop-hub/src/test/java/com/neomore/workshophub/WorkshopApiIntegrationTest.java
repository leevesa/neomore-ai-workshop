package com.neomore.workshophub;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * End-to-end happy path across the real wiring (in-memory H2).
 */
@SpringBootTest
@AutoConfigureMockMvc
class WorkshopApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void registerPublishFeedAndTasksFlow() throws Exception {
        // The default session is seeded on startup with the canonical task list.
        mockMvc.perform(get("/sessions/demo/tasks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].taskId").value("register"));

        // Register a participant. The hub auto-verifies the 'register' task.
        MvcResult registerResult = mockMvc.perform(post("/sessions/demo/participants")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"displayName\":\"Team Integration\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.displayName").value("Team Integration"))
                .andReturn();

        JsonNode registered = objectMapper.readTree(registerResult.getResponse().getContentAsString());
        String participantId = registered.get("participantId").asText();

        // Publish a (non-verifying) task.started event.
        mockMvc.perform(post("/sessions/demo/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"participantId\":\"" + participantId
                                + "\",\"eventType\":\"task.started\",\"taskId\":\"chat\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.eventType").value("task.started"));

        // Feed (newest first): task.started, the server-authored register completion, then connected.
        mockMvc.perform(get("/sessions/demo/feed"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].eventType").value("task.started"))
                .andExpect(jsonPath("$[1].eventType").value("task.completed"))
                .andExpect(jsonPath("$[1].taskId").value("register"))
                .andExpect(jsonPath("$[2].eventType").value("participant.connected"));
    }

    @Test
    void healthEndpointReportsUp() throws Exception {
        mockMvc.perform(get("/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }
}
