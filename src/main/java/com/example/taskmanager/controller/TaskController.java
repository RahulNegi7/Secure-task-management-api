package com.example.taskmanager.controller;

import com.example.taskmanager.dto.TaskRequest;
import com.example.taskmanager.dto.TaskResponse;
import com.example.taskmanager.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

/**
 * Controller exposing protected Task Management REST endpoints.
 * Requires valid JWT Bearer authentication on every request.
 */
@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    /**
     * POST /api/tasks
     * Create a new task for the currently authenticated user.
     */
    @PostMapping
    public ResponseEntity<TaskResponse> createTask(
            @Valid @RequestBody TaskRequest request,
            Principal principal
    ) {
        TaskResponse response = taskService.createTask(request, principal.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/tasks
     * Retrieve all tasks belonging to the currently authenticated user.
     */
    @GetMapping
    public ResponseEntity<List<TaskResponse>> getAllTasks(Principal principal) {
        List<TaskResponse> responses = taskService.getAllTasksForUser(principal.getName());
        return ResponseEntity.ok(responses);
    }

    /**
     * GET /api/tasks/{id}
     * Retrieve a specific task by ID if owned by the currently authenticated user.
     */
    @GetMapping("/{id}")
    public ResponseEntity<TaskResponse> getTaskById(
            @PathVariable Long id,
            Principal principal
    ) {
        TaskResponse response = taskService.getTaskById(id, principal.getName());
        return ResponseEntity.ok(response);
    }

    /**
     * PUT /api/tasks/{id}
     * Update an existing task if owned by the currently authenticated user.
     */
    @PutMapping("/{id}")
    public ResponseEntity<TaskResponse> updateTask(
            @PathVariable Long id,
            @Valid @RequestBody TaskRequest request,
            Principal principal
    ) {
        TaskResponse response = taskService.updateTask(id, request, principal.getName());
        return ResponseEntity.ok(response);
    }

    /**
     * DELETE /api/tasks/{id}
     * Delete an existing task if owned by the currently authenticated user.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(
            @PathVariable Long id,
            Principal principal
    ) {
        taskService.deleteTask(id, principal.getName());
        return ResponseEntity.noContent().build();
    }
}
