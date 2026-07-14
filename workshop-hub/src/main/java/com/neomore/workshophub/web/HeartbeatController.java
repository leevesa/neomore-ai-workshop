package com.neomore.workshophub.web;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.neomore.workshophub.service.WorkshopService;

import lombok.RequiredArgsConstructor;

/**
 * Anonymous heartbeat endpoint. Any client may ping it (no participant identity,
 * no body) to signal the room is alive; the dashboard keeps a global counter.
 */
@RestController
@RequestMapping("/heartbeat")
@RequiredArgsConstructor
public class HeartbeatController {

    private final WorkshopService workshopService;

    @PostMapping
    public ResponseEntity<Void> beat() {
        workshopService.recordHeartbeat();
        return ResponseEntity.status(HttpStatus.ACCEPTED).build();
    }
}
