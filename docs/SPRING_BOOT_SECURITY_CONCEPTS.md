# 🛡️ Spring Boot 3 & Spring Security 6 Key Concepts

A comprehensive technical study guide covering the architectural concepts, design patterns, annotations, and security mechanisms implemented in the **Secure Task Management API**.

---

## 📚 Table of Contents
1. [Core Spring Boot 3 Concepts & Annotations](#1-core-spring-boot-3-concepts--annotations)
2. [Spring Security 6 Architecture & Filter Chain](#2-spring-security-6-architecture--filter-chain)
3. [JWT (JSON Web Token) Deep Dive](#3-jwt-json-web-token-deep-dive)
4. [Spring Data JPA & Hibernate Mechanisms](#4-spring-data-jpa--hibernate-mechanisms)
5. [Security Defenses Implemented](#5-security-defenses-implemented)
6. [Top Interview & Viva Questions with Answers](#6-top-interview--viva-questions-with-answers)

---

## 1. Core Spring Boot 3 Concepts & Annotations

### 🔄 Inversion of Control (IoC) & Dependency Injection (DI)
* **What is it?** Instead of objects creating their dependencies with `new`, the Spring IoC Container creates, configures, and injects them automatically at runtime.
* **How it's used in this project:** Using **Lombok's `@RequiredArgsConstructor`** to generate constructor-based dependency injection for final fields (e.g. `TaskService` injecting `TaskRepository`).

### 🏷️ Key Annotations Used in the Project

| Annotation | Location | Purpose |
| :--- | :--- | :--- |
| **`@SpringBootApplication`** | `TaskManagerApplication` | Convenience annotation bundling `@Configuration`, `@EnableAutoConfiguration`, and `@ComponentScan`. |
| **`@RestController`** | `AuthController`, `TaskController` | Combines `@Controller` and `@ResponseBody`. Tells Spring that all handler methods return data serialized directly into JSON. |
| **`@Service`** | `AuthService`, `TaskService` | Specialization of `@Component` indicating business logic layer. Eligible for transaction management. |
| **`@Repository`** | `UserRepository`, `TaskRepository` | Specialization of `@Component` for data access. Translates database exceptions into Spring's `DataAccessException`. |
| **`@Entity` & `@Table`** | `User`, `Task` | Marks class as a JPA entity mapped to a specific relational database table. |
| **`@Transactional`** | `TaskService` | Manages database transaction boundaries automatically (commits on success, rolls back on `RuntimeException`). Uses `readOnly = true` for query optimization. |
| **`@Valid`** | Controllers | Triggers Jakarta Bean Validation on incoming request body before executing the controller method. |
| **`@RestControllerAdvice`** | `GlobalExceptionHandler` | Global interceptor for exceptions thrown across any controller, returning uniform JSON error responses. |

---

## 2. Spring Security 6 Architecture & Filter Chain

### 🧱 Modern Spring Security 6 vs Legacy Spring Security
In Spring Boot 3 / Spring Security 6:
* `WebSecurityConfigurerAdapter` is **completely removed** (deprecated in Spring Security 5.7).
* Configuration is done using a component-based approach by defining a **`SecurityFilterChain` Bean** with lambda DSL syntax.

```
Incoming HTTP Request
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│  SecurityFilterChain                                         │
│                                                              │
│  1. CorsFilter (optional)                                    │
│  2. CsrfFilter (Disabled for stateless JWT)                  │
│  3. JwtAuthenticationFilter (Custom OncePerRequestFilter)    │  ◄── Extracts & Validates JWT
│  4. UsernamePasswordAuthenticationFilter                     │
│  5. ExceptionTranslationFilter                               │
│  6. AuthorizationFilter (Enforces permitAll / authenticated) │
└──────────────────────────────┬───────────────────────────────┘
                               │ Authenticated Principal
                               ▼
                    DispatcherServlet (Controllers)
```

### 🔍 Key Security Components

#### 1. `OncePerRequestFilter` (`JwtAuthenticationFilter`)
Guarantees a single execution per request dispatch. Intercepts incoming HTTP requests, extracts `Authorization: Bearer <token>`, validates the cryptographic signature and expiration, and sets the authentication object.

#### 2. `SecurityContextHolder` & `SecurityContext`
Stores security details of the currently running thread (ThreadLocal storage). Once `JwtAuthenticationFilter` validates a token, it stores the authenticated `UsernamePasswordAuthenticationToken` in `SecurityContextHolder.getContext().setAuthentication(...)`.

#### 3. `DaoAuthenticationProvider`
The default Spring Security `AuthenticationProvider` that uses:
* `UserDetailsService`: To load user data (`UserDetails`) from MySQL via email.
* `PasswordEncoder` (`BCryptPasswordEncoder`): To verify raw passwords against the stored one-way BCrypt hash.

#### 4. `SessionCreationPolicy.STATELESS`
Configures Spring Security to never create or store an `HttpSession` in memory. Every request must be independently authenticated via JWT.

---

## 3. JWT (JSON Web Token) Deep Dive

### 🔬 Anatomy of a JWT
A JWT string consists of 3 Base64URL-encoded parts separated by dots (`.`):
```
header.payload.signature
```

1. **Header:** Contains the algorithm and token type:
   ```json
   { "alg": "HS256", "typ": "JWT" }
   ```
2. **Payload (Claims):** Contains the statements about the user:
   ```json
   {
     "sub": "rahul@example.com",
     "role": "USER",
     "iat": 1725960000,
     "exp": 1726046400
   }
   ```
3. **Signature:** Cryptographically verifies that the sender is authentic and the message wasn't altered in transit:
   ```text
   HMACSHA256(
     base64UrlEncode(header) + "." + base64UrlEncode(payload),
     secretKey
   )
   ```

### 🛡️ Modern JJWT 0.12.x API (Used in this project)
* **Generating Token:**
  ```java
  Jwts.builder()
      .claims(extraClaims)
      .subject(user.getUsername())
      .issuedAt(new Date())
      .expiration(new Date(System.currentTimeMillis() + expiration))
      .signWith(getSignInKey())
      .compact();
  ```
* **Parsing & Validating Token:**
  ```java
  Jwts.parser()
      .verifyWith(getSignInKey())
      .build()
      .parseSignedClaims(token)
      .getPayload();
  ```

---

## 4. Spring Data JPA & Hibernate Mechanisms

### ⚙️ DDL Auto Update (`spring.jpa.hibernate.ddl-auto=update`)
Hibernate reads the entity definitions (`@Entity`) and automatically alters the database schema (creates tables, columns, indexes, foreign keys) without dropping existing data.

### 🔗 Entity Relationships & Fetch Types
* In `Task.java`:
  ```java
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;
  ```
* **Why `FetchType.LAZY`?** Prevents Hibernate from loading the entire `User` object and their associated records whenever a single `Task` is queried, avoiding the `N+1` query problem.

---

## 5. Security Defenses Implemented

| Vulnerability | Attack Scenario | How This Project Prevents It |
| :--- | :--- | :--- |
| **IDOR (Insecure Direct Object Reference)** | Attacker changes URL `/api/tasks/1` to `/api/tasks/2` to view another user's task. | `TaskService` checks `task.getUser().getId().equals(user.getId())`. Throws `403 Forbidden` if IDs mismatch. |
| **SQL Injection** | Attacker inserts `' OR 1=1 --` into input fields. | Spring Data JPA / Hibernate uses JDBC PreparedStatement with parameterized queries automatically. |
| **Password Theft** | Attacker dumps database to extract passwords. | Passwords are never stored in plaintext. They are hashed using **BCrypt** with salt and cost factor. |
| **Data Over-Posting** | Attacker sends extra fields (e.g. `role: ADMIN` or `id: 5`) in request body. | Dedicated Request DTOs only expose permitted fields for binding. |
| **CSRF Attacks** | Malicious site triggers actions on behalf of authenticated user. | Architecture is stateless using JWT Bearer headers (browser does not auto-attach Bearer tokens like it does with cookies). |

---

## 6. Top Interview & Viva Questions with Answers

### Q1: Why did you choose Stateless JWT over traditional Session-based authentication?
**Answer:** In session-based authentication, the server stores session IDs in memory or Redis (`HttpSession`). As user traffic increases across multiple backend nodes, sessions must be synchronized (sticky sessions or shared Redis cache). With Stateless JWT, all authentication claims are contained within the cryptographically signed token itself. The server verifies the signature locally with zero database or session cache lookups, allowing effortless horizontal scaling.

### Q2: How does Spring Security know which user is making the request?
**Answer:** The `JwtAuthenticationFilter` intercepts the request, parses the JWT from the `Authorization: Bearer` header, validates the signature, extracts the user's email (`sub` claim), and queries `CustomUserDetailsService`. If valid, it constructs an authenticated `UsernamePasswordAuthenticationToken` and places it in `SecurityContextHolder.getContext().setAuthentication(authToken)`. In controllers, Spring automatically injects this as `Principal` or `@AuthenticationPrincipal`.

### Q3: What is the difference between `@Entity` and `DTO`?
**Answer:** 
* An `@Entity` directly mirrors the database table structure and contains internal ORM mappings (passwords, foreign keys, relationships).
* A `DTO (Data Transfer Object)` is a lightweight contract specifically formatted for API network communication. DTOs prevent leaking sensitive fields (e.g. password hash), prevent over-posting vulnerabilities, and avoid circular JSON serialization errors during serialization.

### Q4: What is BCrypt and why is it preferred over MD5 or SHA-256?
**Answer:** MD5 and SHA-256 are general-purpose cryptographic hash functions designed to be extremely fast, making them vulnerable to brute-force and rainbow table attacks using modern GPUs. **BCrypt** is an adaptive, one-way key derivation function that includes built-in random salting and a configurable work factor (computational cost), making brute-force attacks computationally infeasible.

### Q5: How do you prevent a user from deleting someone else's task?
**Answer:** We enforce data ownership at the **Service Layer** (`TaskService.deleteTask`). We fetch the task by ID, retrieve the authenticated user from `SecurityContext`, and compare their primary keys:
```java
if (!task.getUser().getId().equals(authenticatedUser.getId())) {
    throw new UnauthorizedAccessException("You do not have permission to delete this task");
}
```
If they don't match, an `UnauthorizedAccessException` is thrown, which our `GlobalExceptionHandler` converts into a `403 Forbidden` response.
