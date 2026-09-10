package com.example.taskmanager.repository;

import com.example.taskmanager.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data JPA Repository for User entity operations.
 * 
 * JpaRepository provides out-of-the-box CRUD operations (save, findById, findAll, delete, etc.)
 * without requiring manual SQL or JPQL implementation.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Find a user by their unique email address.
     * Used during authentication and login verification.
     * 
     * @param email The user's email address
     * @return An Optional containing the User if found, or empty Optional
     */
    Optional<User> findByEmail(String email);

    /**
     * Check if a user with the specified email already exists.
     * Used during user registration to prevent duplicate accounts.
     * 
     * @param email The email address to check
     * @return true if a user already exists with this email, false otherwise
     */
    boolean existsByEmail(String email);
}
