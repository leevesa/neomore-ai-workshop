package com.neomore.workshophub.service;

import java.util.List;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.neomore.workshophub.config.WorkshopProperties;
import com.neomore.workshophub.model.Task;
import com.neomore.workshophub.repository.TaskRepository;

/**
 * Seeds the canonical workshop task list (from configuration). Idempotent: tasks
 * are only created the first time.
 */
@Component
public class TaskSeeder {

    private final TaskRepository taskRepository;
    private final WorkshopProperties properties;

    public TaskSeeder(TaskRepository taskRepository, WorkshopProperties properties) {
        this.taskRepository = taskRepository;
        this.properties = properties;
    }

    @Transactional
    public void seedTasks() {
        if (taskRepository.count() > 0) {
            return;
        }
        List<WorkshopProperties.SeedTask> seeds = properties.getSeedTasks();
        for (int i = 0; i < seeds.size(); i++) {
            WorkshopProperties.SeedTask seed = seeds.get(i);
            taskRepository.save(new Task(seed.getId(), seed.getTitle(), seed.getDescription(), i + 1));
        }
    }
}
