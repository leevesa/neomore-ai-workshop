package com.neomore.workshophub.web;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.neomore.workshophub.dto.HeartbeatRequest;
import com.neomore.workshophub.service.WorkshopService;

import lombok.RequiredArgsConstructor;

/**
 * Heartbeat endpoint. A bodyless request emits an anonymous room pulse, while a
 * request carrying a known participant ID also verifies the heartbeat task.
 */
@RestController
@RequestMapping("/heartbeat")
@RequiredArgsConstructor
public class HeartbeatController {

    private final WorkshopService workshopService;

    @PostMapping
    public ResponseEntity<Void> beat(@RequestBody(required = false) HeartbeatRequest request) {
        if (request == null) {
            workshopService.recordHeartbeat();
        } else {
            workshopService.recordHeartbeat(request.participantId());
        }
        return ResponseEntity.status(HttpStatus.ACCEPTED).build();
    }
}
