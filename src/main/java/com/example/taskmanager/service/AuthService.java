package com.example.taskmanager.service;

import com.example.taskmanager.dto.LoginRequest;
import com.example.taskmanager.dto.LoginResponse;
import com.example.taskmanager.dto.RegisterRequest;
import com.example.taskmanager.entity.User;
import com.example.taskmanager.enums.Role;
import com.example.taskmanager.exception.ResourceNotFoundException;
import com.example.taskmanager.exception.UserAlreadyExistsException;
import com.example.taskmanager.repository.UserRepository;
import com.example.taskmanager.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

/**
 * Service managing user registration and authentication business logic.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    /**
     * Registers a new user with encrypted password.
     * 
     * @param request Registration payload containing name, email, password, and optional role
     * @return Confirmation message or user details
     */
    @Transactional
    public String register(RegisterRequest request) {
        // 1. Check if email is already registered
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("Email is already registered: " + request.getEmail());
        }

        // 2. Default to ROLE_USER if role not specified in request
        Role userRole = request.getRole() != null ? request.getRole() : Role.USER;

        // 3. Create and save new user with BCrypt hashed password
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(userRole)
                .build();

        userRepository.save(user);

        return "User registered successfully";
    }

    /**
     * Authenticates user credentials and generates a signed JWT token.
     * 
     * @param request Login credentials (email and password)
     * @return LoginResponse with JWT token, email, and role
     */
    public LoginResponse login(LoginRequest request) {
        // 1. Authenticate user credentials via Spring Security AuthenticationManager
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        // 2. Retrieve user entity from database
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", request.getEmail()));

        // 3. Attach custom claims (role) to JWT token
        Map<String, Object> extraClaims = Map.of("role", user.getRole().name());

        // 4. Generate signed JWT token
        String token = jwtService.generateToken(extraClaims, user);

        // 5. Build and return response DTO
        return LoginResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }
}
