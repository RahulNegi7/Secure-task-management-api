# 🛡️ Secure Task Management API

A production-grade, secure RESTful Task Management backend application built with **Java 17**, **Spring Boot 3**, **Spring Security 6**, **Spring Data JPA**, **MySQL**, and **JWT (JSON Web Token)** authentication.

---

## 📌 Features

- **🔐 Stateless Authentication & Authorization:** JWT-based authentication using modern JJWT 0.12.x and BCrypt password encryption.
- **🛡️ Strict User Data Isolation:** Multi-tenant security guarantee where users can only view, update, and delete their own tasks.
- **👥 Role-Based Access Control (RBAC):** Extensible roles (`USER`, `ADMIN`).
- **✅ Input Validation & Sanitization:** Jakarta Validation (`@Valid`, `@NotBlank`, `@Email`, `@Size`).
- **🌐 Centralized Exception Handling:** `@RestControllerAdvice` returning uniform JSON error responses across the entire application.
- **🗄️ ORM & Database:** Spring Data JPA / Hibernate with automated schema management and clean repository derivations.
- **⚡ Layered Clean Architecture:** Strict separation of concerns (`Controller` $\rightarrow$ `Service` $\rightarrow$ `Repository` $\rightarrow$ `MySQL`).

---

## 🛠️ Technology Stack

| Component | Technology |
| :--- | :--- |
| **Language** | Java 17 (LTS) |
| **Framework** | Spring Boot 3.3.3 |
| **Security Engine** | Spring Security 6 (Stateless `SecurityFilterChain`) |
| **Token Authentication** | JJWT (Java JWT) 0.12.6 |
| **Password Hashing** | BCrypt Password Encoder |
| **Persistence / ORM** | Spring Data JPA / Hibernate |
| **Database** | MySQL 8.x |
| **Validation** | Jakarta Bean Validation |
| **Boilerplate Reduction** | Project Lombok |
| **Build Tool** | Apache Maven |

---

## 🏗️ Architecture & Request Lifecycle

```
Client (Postman / Frontend)
   │
   │ 1. HTTP Request (Header: Authorization: Bearer <JWT_TOKEN>)
   ▼
┌─────────────────────────────────────────────────────────────┐
│  JwtAuthenticationFilter (OncePerRequestFilter)             │
│  - Extracts Bearer token from header                        │
│  - Validates signature, expiration, and extracts email      │
│  - Sets authenticated user into SecurityContextHolder       │
└──────────────────────────────┬──────────────────────────────┘
                               │ 2. Authenticated Request
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  Controller Layer (AuthController / TaskController)         │
│  - Validates request DTOs (@Valid)                          │
│  - Extracts Principal (logged-in user)                      │
└──────────────────────────────┬──────────────────────────────┘
                               │ 3. Clean DTOs & Principal
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  Service Layer (AuthService / TaskService)                  │
│  - Business logic & authorization checks                    │
│  - Enforces user ownership isolation                        │
└──────────────────────────────┬──────────────────────────────┘
                               │ 4. Domain Operations
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  Repository Layer (Spring Data JPA)                         │
│  - findByIdAndUser(id, user)                                │
│  - Automated parameterization (SQL Injection immunity)      │
└──────────────────────────────┬──────────────────────────────┘
                               │ 5. SQL Queries
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  MySQL Database (users & tasks tables)                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Java 17 or higher:** `java -version`
- **Maven 3.8+:** `mvn -version`
- **MySQL Server:** Running locally on port `3306`

### 2. MySQL Database Setup
Open your MySQL terminal or MySQL Workbench and run:
```sql
CREATE DATABASE IF NOT EXISTS task_management_db;
```

### 3. Configure Database Credentials
Edit `src/main/resources/application.properties` with your MySQL credentials:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/task_management_db?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=YOUR_MYSQL_PASSWORD

application.security.jwt.secret-key=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
application.security.jwt.expiration=86400000
```

### 4. Build and Run
```bash
# Build the project
mvn clean install

# Run the Spring Boot application
mvn spring-boot:run
```
The application will start on **`http://localhost:8080`**.

---

## 📡 REST API Documentation

### 1. Authentication Endpoints (Public)

#### 🔹 Register a New User
- **URL:** `POST /api/auth/register`
- **Request Body:**
```json
{
  "name": "Rahul Negi",
  "email": "rahul@example.com",
  "password": "Password123"
}
```
- **Response (`201 Created`):**
```json
{
  "message": "User registered successfully"
}
```

---

#### 🔹 Login & Get JWT Token
- **URL:** `POST /api/auth/login`
- **Request Body:**
```json
{
  "email": "rahul@example.com",
  "password": "Password123"
}
```
- **Response (`200 OK`):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiVVNFUiIsInN1YiI6InJhaHVsQGV4YW1wbGUuY29tIiwiaWF0IjoxNzI1OTYwMDAwLCJleHAiOjE3MjYwNDY0MDB9...",
  "tokenType": "Bearer",
  "email": "rahul@example.com",
  "role": "USER"
}
```

---

### 2. Task Endpoints (Protected - Require `Authorization: Bearer <token>`)

#### 🔹 Create a Task
- **URL:** `POST /api/tasks`
- **Header:** `Authorization: Bearer <JWT_TOKEN>`
- **Request Body:**
```json
{
  "title": "Complete placement project",
  "description": "Build Spring Boot Secure Task Management API",
  "status": "IN_PROGRESS"
}
```
- **Response (`201 Created`):**
```json
{
  "id": 1,
  "title": "Complete placement project",
  "description": "Build Spring Boot Secure Task Management API",
  "status": "IN_PROGRESS",
  "createdAt": "2026-09-10T17:00:00",
  "updatedAt": "2026-09-10T17:00:00"
}
```

---

#### 🔹 Get All Tasks for Logged-in User
- **URL:** `GET /api/tasks`
- **Header:** `Authorization: Bearer <JWT_TOKEN>`
- **Response (`200 OK`):**
```json
[
  {
    "id": 1,
    "title": "Complete placement project",
    "description": "Build Spring Boot Secure Task Management API",
    "status": "IN_PROGRESS",
    "createdAt": "2026-09-10T17:00:00",
    "updatedAt": "2026-09-10T17:00:00"
  }
]
```

---

#### 🔹 Get Specific Task by ID
- **URL:** `GET /api/tasks/1`
- **Header:** `Authorization: Bearer <JWT_TOKEN>`
- **Response (`200 OK`):**
```json
{
  "id": 1,
  "title": "Complete placement project",
  "description": "Build Spring Boot Secure Task Management API",
  "status": "IN_PROGRESS",
  "createdAt": "2026-09-10T17:00:00",
  "updatedAt": "2026-09-10T17:00:00"
}
```

---

#### 🔹 Update Task
- **URL:** `PUT /api/tasks/1`
- **Header:** `Authorization: Bearer <JWT_TOKEN>`
- **Request Body:**
```json
{
  "title": "Complete placement project",
  "description": "All endpoints tested and verified",
  "status": "COMPLETED"
}
```
- **Response (`200 OK`):**
```json
{
  "id": 1,
  "title": "Complete placement project",
  "description": "All endpoints tested and verified",
  "status": "COMPLETED",
  "createdAt": "2026-09-10T17:00:00",
  "updatedAt": "2026-09-10T17:05:00"
}
```

---

#### 🔹 Delete Task
- **URL:** `DELETE /api/tasks/1`
- **Header:** `Authorization: Bearer <JWT_TOKEN>`
- **Response (`204 No Content`)**

---

## 🛑 Standardized Error Responses

### Validation Error (`400 Bad Request`)
```json
{
  "timestamp": "2026-09-10T17:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed for one or more fields",
  "path": "/api/auth/register",
  "validationErrors": {
    "email": "Email must be a valid email address",
    "password": "Password must be at least 6 characters long"
  }
}
```

### Unauthorized / Forbidden (`403 Forbidden`)
```json
{
  "timestamp": "2026-09-10T17:00:00",
  "status": 403,
  "error": "Forbidden",
  "message": "You do not have permission to access this task",
  "path": "/api/tasks/99"
}
```

---

## 🧪 Postman Testing Guide

1. **Register User 1:** `POST /api/auth/register` with `user1@example.com`.
2. **Login User 1:** `POST /api/auth/login` and copy the `token`.
3. **Set Postman Token:** In Postman, go to **Authorization** $\rightarrow$ Type: **Bearer Token** $\rightarrow$ Paste your token.
4. **Create Task:** `POST /api/tasks` $\rightarrow$ Task ID 1 is created.
5. **Register & Login User 2:** `POST /api/auth/register` & `login` with `user2@example.com` and copy User 2's token.
6. **Test Isolation:** With User 2's token, try to `GET /api/tasks/1` or `DELETE /api/tasks/1` $\rightarrow$ Returns **`403 Forbidden`**! Data isolation verified!

---

## 🎓 Placement & Technical Interview Q&A

### 1. What is the difference between `@Entity` and DTO?
**Answer:** An `@Entity` maps directly to a database table row and contains internal mappings (like passwords and foreign keys). A **DTO (Data Transfer Object)** is a tailored object designed solely for sending/receiving data over the network, preventing accidental leakage of sensitive fields and circular reference exceptions.

### 2. How does Stateless Authentication work in Spring Security?
**Answer:** In traditional stateful applications, the server stores user sessions in memory (`HttpSession`). In our stateless architecture (`SessionCreationPolicy.STATELESS`), the server stores zero session state. Every incoming request must provide a cryptographically signed JWT in the `Authorization: Bearer` header. The server verifies the signature on each request using HMAC-SHA256 without needing session lookups.

### 3. Why use BCrypt for password storage?
**Answer:** BCrypt is an adaptive one-way cryptographic hash function incorporating salt to protect against rainbow table attacks and a configurable work factor (cost) to defend against hardware brute-force attacks.
