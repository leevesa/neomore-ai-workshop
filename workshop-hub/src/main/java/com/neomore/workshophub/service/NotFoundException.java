package com.neomore.workshophub.service;

/**
 * Thrown when a referenced resource (session, participant) does not exist.
 * Mapped to HTTP 404 by the API exception handler.
 */
public class NotFoundException extends RuntimeException {

    public NotFoundException(String message) {
        super(message);
    }
}
