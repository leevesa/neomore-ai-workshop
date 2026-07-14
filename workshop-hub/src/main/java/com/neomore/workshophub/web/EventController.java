package com.neomore.workshophub.web;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.neomore.workshophub.dto.FeedItem;
import com.neomore.workshophub.dto.PublishEventRequest;
import com.neomore.workshophub.service.WorkshopService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/events")
public class EventController {

    private final WorkshopService workshopService;

    public EventController(WorkshopService workshopService) {
        this.workshopService = workshopService;
    }

    @PostMapping
    public ResponseEntity<FeedItem> publish(
            @Valid @RequestBody PublishEventRequest request) {
        FeedItem item = workshopService.publishEvent(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(item);
    }
}
