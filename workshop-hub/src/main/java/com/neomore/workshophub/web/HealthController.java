package com.neomore.workshophub.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.neomore.workshophub.dto.HealthResponse;

@RestController
public class HealthController {

    @GetMapping("/health")
    public HealthResponse health() {
        return HealthResponse.up();
    }
}
