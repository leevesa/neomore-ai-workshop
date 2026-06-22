package com.neomore.workshophub.web;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.neomore.workshophub.dto.TaskResponse;
import com.neomore.workshophub.service.WorkshopService;

@RestController
@RequestMapping("/sessions/{sessionId}/tasks")
public class TaskController {

    private final WorkshopService workshopService;

    public TaskController(WorkshopService workshopService) {
        this.workshopService = workshopService;
    }

    @GetMapping
    public List<TaskResponse> tasks(@PathVariable String sessionId) {
        return workshopService.listTasks(sessionId);
    }
}
