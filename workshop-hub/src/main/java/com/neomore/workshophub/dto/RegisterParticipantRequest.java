package com.neomore.workshophub.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request body for registering a participant or team.
 */
public record RegisterParticipantRequest(
        @NotBlank(message = "displayName is required")
        @Size(max = 80, message = "displayName must be at most 80 characters")
        String displayName) {
}
