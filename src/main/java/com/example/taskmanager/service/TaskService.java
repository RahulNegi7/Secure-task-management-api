package com.example.taskmanager.service;

import com.example.taskmanager.dto.TaskRequest;
import com.example.taskmanager.dto.TaskResponse;
import com.example.taskmanager.entity.Task;
import com.example.taskmanager.entity.User;
import com.example.taskmanager.enums.TaskStatus;
import com.example.taskmanager.exception.ResourceNotFoundException;
import com.example.taskmanager.exception.UnauthorizedAccessException;
import com.example.taskmanager.repository.TaskRepository;
import com.example.taskmanager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service managing Task lifecycle operations.
 * Enforces strict user data isolation so users can only view, update, or delete their own tasks.
 */
@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    /**
     * Helper to fetch authenticated user by email.
     */
    private User getAuthenticatedUser(String userEmail) {
        return userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));
    }

    /**
     * Create a new task assigned to the authenticated user.
     */
    @Transactional
    public TaskResponse createTask(TaskRequest request, String userEmail) {
        User user = getAuthenticatedUser(userEmail);

        Task task = Task.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .status(request.getStatus() != null ? request.getStatus() : TaskStatus.TODO)
                .user(user)
                .build();

        Task savedTask = taskRepository.save(task);
        return TaskResponse.fromEntity(savedTask);
    }

    /**
     * Retrieve all tasks owned by the authenticated user.
     */
    @Transactional(readOnly = true)
    public List<TaskResponse> getAllTasksForUser(String userEmail) {
        User user = getAuthenticatedUser(userEmail);

        return taskRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(TaskResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Retrieve a specific task by ID if owned by the authenticated user.
     */
    @Transactional(readOnly = true)
    public TaskResponse getTaskById(Long id, String userEmail) {
        User user = getAuthenticatedUser(userEmail);

        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task", "id", id));

        // Enforce user ownership isolation
        if (!task.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedAccessException("You do not have permission to access this task");
        }

        return TaskResponse.fromEntity(task);
    }

    /**
     * Update an existing task if owned by the authenticated user.
     */
    @Transactional
    public TaskResponse updateTask(Long id, TaskRequest request, String userEmail) {
        User user = getAuthenticatedUser(userEmail);

        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task", "id", id));

        // Enforce user ownership isolation
        if (!task.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedAccessException("You do not have permission to update this task");
        }

        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        if (request.getStatus() != null) {
            task.setStatus(request.getStatus());
        }

        Task updatedTask = taskRepository.save(task);
        return TaskResponse.fromEntity(updatedTask);
    }

    /**
     * Delete an existing task if owned by the authenticated user.
     */
    @Transactional
    public void deleteTask(Long id, String userEmail) {
        User user = getAuthenticatedUser(userEmail);

        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task", "id", id));

        // Enforce user ownership isolation
        if (!task.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedAccessException("You do not have permission to delete this task");
        }

        taskRepository.delete(task);
    }
}
