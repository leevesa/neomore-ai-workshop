package com.neomore.workshophub.web;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.neomore.workshophub.dto.ParticipantResponse;
import com.neomore.workshophub.dto.RegisterParticipantRequest;
import com.neomore.workshophub.service.WorkshopService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/sessions/{sessionId}/participants")
public class ParticipantController {

    private final WorkshopService workshopService;

    public ParticipantController(WorkshopService workshopService) {
        this.workshopService = workshopService;
    }

    @PostMapping
    public ResponseEntity<ParticipantResponse> register(
            @PathVariable String sessionId,
            @Valid @RequestBody RegisterParticipantRequest request) {
        ParticipantResponse response = workshopService.registerParticipant(sessionId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
