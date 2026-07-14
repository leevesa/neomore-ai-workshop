package com.neomore.workshophub.config;

import java.util.ArrayList;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Bindable configuration for the Workshop Hub, sourced from application.yaml
 * and overridable via environment variables (e.g. WORKSHOP_PASSWORD).
 */
@ConfigurationProperties(prefix = "workshop")
public class WorkshopProperties {

    /** Shared workshop password. When blank, the hub is fully open. */
    private String password = "";

    /** Interval between SSE keep-alive comments, in seconds. */
    private int sseKeepAliveSeconds = 15;

    /** Canonical task list seeded on startup. */
    private List<SeedTask> seedTasks = new ArrayList<>();

    /** Avatar upload constraints. */
    private AvatarSettings avatar = new AvatarSettings();

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public int getSseKeepAliveSeconds() {
        return sseKeepAliveSeconds;
    }

    public void setSseKeepAliveSeconds(int sseKeepAliveSeconds) {
        this.sseKeepAliveSeconds = sseKeepAliveSeconds;
    }

    public List<SeedTask> getSeedTasks() {
        return seedTasks;
    }

    public void setSeedTasks(List<SeedTask> seedTasks) {
        this.seedTasks = seedTasks;
    }

    public AvatarSettings getAvatar() {
        return avatar;
    }

    public void setAvatar(AvatarSettings avatar) {
        this.avatar = avatar;
    }

    /** True when a password is configured and must be enforced. */
    public boolean isPasswordProtected() {
        return password != null && !password.isBlank();
    }

    /** Avatar upload constraints. */
    public static class AvatarSettings {
        /** Maximum accepted avatar size in bytes. */
        private long maxBytes = 524288;

        public long getMaxBytes() {
            return maxBytes;
        }

        public void setMaxBytes(long maxBytes) {
            this.maxBytes = maxBytes;
        }
    }

    public static class SeedTask {
        private String id;
        private String title;
        private String description;

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }
    }
}
