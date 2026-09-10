package com.example.taskmanager.exception;

/**
 * Thrown when an authenticated user attempts to access, modify, or delete
 * a resource (e.g. a Task) that does not belong to them.
 * Maps to HTTP 403 FORBIDDEN.
 */
public class UnauthorizedAccessException extends RuntimeException {

    public UnauthorizedAccessException(String message) {
        super(message);
    }
}
