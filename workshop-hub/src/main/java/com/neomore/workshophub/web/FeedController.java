package com.neomore.workshophub.web;

import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.neomore.workshophub.dto.FeedItem;
import com.neomore.workshophub.service.FeedBroadcaster;
import com.neomore.workshophub.service.WorkshopService;

@RestController
@RequestMapping("/feed")
public class FeedController {

    private final WorkshopService workshopService;
    private final FeedBroadcaster feedBroadcaster;

    public FeedController(WorkshopService workshopService, FeedBroadcaster feedBroadcaster) {
        this.workshopService = workshopService;
        this.feedBroadcaster = feedBroadcaster;
    }

    @GetMapping
    public List<FeedItem> feed(
            @RequestParam(required = false) Integer limit) {
        return workshopService.readFeed(limit);
    }

    @GetMapping(path = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream() {
        return feedBroadcaster.subscribe();
    }
}
