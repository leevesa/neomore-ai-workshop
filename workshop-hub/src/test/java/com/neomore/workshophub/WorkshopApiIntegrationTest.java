package com.neomore.workshophub;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * End-to-end happy path across the real wiring (in-memory H2).
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = "workshop.password=")
class WorkshopApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void registerPublishFeedAndTasksFlow() throws Exception {
        // Tasks are seeded on startup with the canonical task list.
        mockMvc.perform(get("/tasks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(6))
                .andExpect(jsonPath("$[0].taskId").value("register"))
                .andExpect(jsonPath("$[1].taskId").value("heartbeat"))
                .andExpect(jsonPath("$[2].taskId").value("chat"))
                .andExpect(jsonPath("$[3].taskId").value("multiline-message"))
                .andExpect(jsonPath("$[4].taskId").value("feature-avatar"))
                .andExpect(jsonPath("$[5].taskId").value("reply-message"));

        // Register a participant. The hub auto-verifies the 'register' task.
        MvcResult registerResult = mockMvc.perform(post("/participants")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"displayName\":\"Team Integration\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.displayName").value("Team Integration"))
                .andReturn();

        JsonNode registered = objectMapper.readTree(registerResult.getResponse().getContentAsString());
        String participantId = registered.get("participantId").asText();

        // Publish a (non-verifying) task.started event.
        mockMvc.perform(post("/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"participantId\":\"" + participantId
                                + "\",\"eventType\":\"task.started\",\"taskId\":\"chat\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.eventType").value("task.started"));

        // Feed (newest first): task.started, the server-authored register completion, then connected.
        mockMvc.perform(get("/feed"))
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

    @Test
    void hubVerifiesAllTasksFromRealEndpointActivity() throws Exception {
        MvcResult registerResult = mockMvc.perform(post("/participants")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"displayName\":\"Team Verifier\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        String participantId = objectMapper
                .readTree(registerResult.getResponse().getContentAsString())
                .get("participantId").asText();

        mockMvc.perform(post("/heartbeat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "participantId", participantId))))
                .andExpect(status().isAccepted());

        MvcResult chatResult = mockMvc.perform(post("/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "participantId", participantId,
                                "eventType", "chat.message.sent",
                                "message", "Hello room"))))
                .andExpect(status().isCreated())
                .andReturn();
        long chatEventId = objectMapper
                .readTree(chatResult.getResponse().getContentAsString())
                .get("id").asLong();

        mockMvc.perform(post("/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "participantId", participantId,
                                "eventType", "chat.message.sent",
                                "message", "First line\nSecond line"))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/participants/{participantId}/avatar", participantId)
                        .contentType(MediaType.IMAGE_PNG)
                        .content(new byte[] {(byte) 0x89, 0x50, 0x4e, 0x47}))
                .andExpect(status().isNoContent());

        mockMvc.perform(post("/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "participantId", participantId,
                                "eventType", "chat.message.sent",
                                "message", "Replying now",
                                "metadata", Map.of("replyToEventId", chatEventId)))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.metadata").value(
                        org.hamcrest.Matchers.containsString("replyToDisplayName")));

        mockMvc.perform(post("/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "participantId", participantId,
                                "eventType", "task.completed",
                                "taskId", "chat"))))
                .andExpect(status().isBadRequest());

        MvcResult feedResult = mockMvc.perform(get("/feed").param("limit", "200"))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode feed = objectMapper.readTree(feedResult.getResponse().getContentAsString());
        Set<String> completions = new HashSet<>();
        for (JsonNode item : feed) {
            if ("task.completed".equals(item.path("eventType").asText())) {
                completions.add(item.path("taskId").asText());
            }
        }

        assertThat(completions).contains(
                "register", "heartbeat", "chat", "multiline-message",
                "feature-avatar", "reply-message");
    }
}
