package com.neomore.workshophub.web;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.neomore.workshophub.dto.TaskResponse;
import com.neomore.workshophub.service.WorkshopService;

@RestController
@RequestMapping("/tasks")
public class TaskController {

    private final WorkshopService workshopService;

    public TaskController(WorkshopService workshopService) {
        this.workshopService = workshopService;
    }

    @GetMapping
    public List<TaskResponse> tasks() {
        return workshopService.listTasks();
    }
}
