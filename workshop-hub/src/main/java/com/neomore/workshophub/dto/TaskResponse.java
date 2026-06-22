package com.neomore.workshophub.dto;

import com.neomore.workshophub.model.Task;

/**
 * Canonical task list item.
 */
public record TaskResponse(
        String taskId,
        String title,
        String description,
        int ordinal) {

    public static TaskResponse from(Task task) {
        return new TaskResponse(
                task.getTaskId(),
                task.getTitle(),
                task.getDescription(),
                task.getOrdinal());
    }
}
