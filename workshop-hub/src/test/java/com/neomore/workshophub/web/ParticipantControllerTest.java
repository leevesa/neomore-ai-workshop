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

import tools.jackson.databind.ObjectMapper;
import com.neomore.workshophub.config.WorkshopProperties;
import com.neomore.workshophub.dto.ParticipantResponse;
import com.neomore.workshophub.dto.RegisterParticipantRequest;
import com.neomore.workshophub.service.WorkshopService;

@WebMvcTest(ParticipantController.class)
class ParticipantControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private WorkshopService workshopService;

    @MockitoBean
    private WorkshopProperties properties;

    @Test
    void registersParticipantAndReturns201() throws Exception {
        Instant now = Instant.parse("2026-06-22T10:00:00Z");
        when(workshopService.registerParticipant(eq("demo"), any()))
                .thenReturn(new ParticipantResponse("p-1", "demo", "Team A", now, now));

        mockMvc.perform(post("/sessions/demo/participants")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RegisterParticipantRequest("Team A"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.participantId").value("p-1"))
                .andExpect(jsonPath("$.displayName").value("Team A"));
    }

    @Test
    void rejectsBlankDisplayNameWith400() throws Exception {
        mockMvc.perform(post("/sessions/demo/participants")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"displayName\":\"  \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.displayName").exists());
    }

    @Test
    void rejectsWhenPasswordRequiredAndMissing() throws Exception {
        when(properties.isPasswordProtected()).thenReturn(true);
        when(properties.getPassword()).thenReturn("secret");

        mockMvc.perform(post("/sessions/demo/participants")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RegisterParticipantRequest("Team A"))))
                .andExpect(status().isUnauthorized());
    }
}
