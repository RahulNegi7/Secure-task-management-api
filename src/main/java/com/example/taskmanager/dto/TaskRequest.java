package com.example.taskmanager.dto;

import com.example.taskmanager.enums.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request payload for creating or updating a Task.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskRequest {

    @NotBlank(message = "Title cannot be blank")
    @Size(max = 150, message = "Title cannot exceed 150 characters")
    private String title;

    private String description;

    /**
     * Optional status. Defaults to TODO if not specified during creation.
     */
    private TaskStatus status;
}
