package com.example.taskmanager.exception;

/**
 * Thrown when trying to register a user with an email that already exists.
 * Maps to HTTP 409 CONFLICT.
 */
public class UserAlreadyExistsException extends RuntimeException {

    public UserAlreadyExistsException(String message) {
        super(message);
    }
}
