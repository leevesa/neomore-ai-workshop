package com.neomore.workshophub.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import com.neomore.workshophub.config.WorkshopProperties;

/**
 * Seeds the canonical workshop task list on startup so the dashboard and tasks
 * endpoint work out of the box.
 */
@Component
public class StartupInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(StartupInitializer.class);

    private final TaskSeeder taskSeeder;
    private final WorkshopProperties properties;

    public StartupInitializer(TaskSeeder taskSeeder, WorkshopProperties properties) {
        this.taskSeeder = taskSeeder;
        this.properties = properties;
    }

    @Override
    public void run(ApplicationArguments args) {
        taskSeeder.seedTasks();
        log.info("Workshop Hub ready. Seeded {} tasks. Password protection: {}",
                properties.getSeedTasks().size(), properties.isPasswordProtected() ? "ON" : "OFF");
    }
}
