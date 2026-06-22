package com.neomore.workshophub.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import com.neomore.workshophub.config.WorkshopProperties;

/**
 * Creates and seeds the default workshop session on startup so the dashboard and
 * tasks endpoint work out of the box.
 */
@Component
public class DefaultSessionInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DefaultSessionInitializer.class);

    private final WorkshopService workshopService;
    private final WorkshopProperties properties;

    public DefaultSessionInitializer(WorkshopService workshopService, WorkshopProperties properties) {
        this.workshopService = workshopService;
        this.properties = properties;
    }

    @Override
    public void run(ApplicationArguments args) {
        String sessionId = properties.getDefaultSessionId();
        workshopService.ensureSeededSession(sessionId);
        log.info("Workshop Hub ready. Default session '{}' seeded with {} tasks. Password protection: {}",
                sessionId, properties.getSeedTasks().size(), properties.isPasswordProtected() ? "ON" : "OFF");
    }
}
