package com.example.taskmanager.repository;

import com.example.taskmanager.entity.Task;
import com.example.taskmanager.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository for Task entity operations.
 * 
 * Enforces database-level user isolation so users can only access their own tasks.
 */
@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    /**
     * Retrieve all tasks belonging to a specific user, sorted from newest to oldest.
     * 
     * @param user The authenticated user
     * @return List of tasks owned by this user
     */
    List<Task> findByUserOrderByCreatedAtDesc(User user);

    /**
     * Retrieve a specific task by its ID ONLY if it belongs to the given user.
     * 
     * Security Guarantee:
     * If user A attempts to fetch task ID 5 belonging to user B, this query returns Optional.empty(),
     * completely isolating user data at the SQL query level.
     * 
     * @param id The Task ID
     * @param user The authenticated user
     * @return An Optional containing the Task if owned by the user, or empty Optional
     */
    Optional<Task> findByIdAndUser(Long id, User user);

    /**
     * Check if a task with the given ID belongs to the specific user.
     * 
     * @param id The Task ID
     * @param user The authenticated user
     * @return true if the task exists and belongs to the user
     */
    boolean existsByIdAndUser(Long id, User user);
}
