package com.example.taskmanager.exception;

/**
 * Thrown when a requested resource (e.g. Task, User) is not found in the database.
 * Maps to HTTP 404 NOT FOUND.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s not found with %s: '%s'", resourceName, fieldName, fieldValue));
    }
}
