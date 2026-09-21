# 🛡️ Secure Task Management RESTful API

A production-grade, secure RESTful Task Management backend application built with **Java 17**, **Spring Boot 3.3.3**, **Spring Security 6**, **Spring Data JPA**, **MySQL 8.0 (Docker)**, and **JWT (JSON Web Token)** stateless authentication.

---

## 📚 Documentation Index
For deep-dive technical explanations and interview preparation, refer to the guides in the [`docs/`](./docs) folder:
* 🏛️ **[Project Structure & Architecture Walkthrough](./docs/PROJECT_STRUCTURE_AND_WALKTHROUGH.md)** — Package breakdown, request lifecycles, and how to present this project in interviews.
* 🛡️ **[Spring Boot 3 & Spring Security 6 Concepts](./docs/SPRING_BOOT_SECURITY_CONCEPTS.md)** — In-depth guide on annotations, SecurityFilterChain, JWT anatomy, JPA mechanisms, and interview Q&A.

---

## 📌 Features

- **🔐 Stateless Authentication & Authorization:** Secure JWT-based authentication using modern JJWT 0.12.x and BCrypt password hashing.
- **🛡️ Strict Multi-Tenant Data Isolation:** Users can only view, update, and delete their own tasks, preventing Insecure Direct Object Reference (IDOR) attacks.
- **👥 Role-Based Access Control (RBAC):** Extensible roles (`USER`, `ADMIN`).
- **🐳 Dockerized Database:** Instant MySQL 8.0 setup via Docker Compose on port `3307`.
- **✅ Input Validation & Sanitization:** Jakarta Validation (`@Valid`, `@NotBlank`, `@Email`, `@Size`).
- **🌐 Centralized Exception Handling:** `@RestControllerAdvice` returning uniform JSON error responses across all endpoints.
- **🗄️ ORM & Schema Automation:** Spring Data JPA / Hibernate with automated table and constraint generation.
- **⚡ Layered Clean Architecture:** Strict separation of concerns (`Controller` $\rightarrow$ `Service` $\rightarrow$ `Repository` $\rightarrow$ `MySQL`).

---

## 🛠️ Technology Stack

| Component | Technology | Version |
| :--- | :--- | :--- |
| **Language** | Java (LTS) | 17 |
| **Framework** | Spring Boot | 3.3.3 |
| **Security Engine** | Spring Security (Stateless FilterChain) | 6.3.3 |
| **Token Authentication** | JJWT (Java JWT) | 0.12.6 |
| **Password Hashing** | BCrypt Password Encoder | Built-in |
| **Persistence / ORM** | Spring Data JPA / Hibernate | 6.5.2 |
| **Database** | MySQL (Containerized) | 8.0 |
| **Containerization** | Docker & Docker Compose | Latest |
| **Validation** | Jakarta Bean Validation | 3.0.2 |
| **Boilerplate Reduction** | Project Lombok | Latest |
| **Build Tool** | Apache Maven Wrapper | 3.8+ |

---

## 🏗️ Architecture & Request Lifecycle

```
Client (Postman / Web App)
   │
   │ 1. HTTP Request (Header: Authorization: Bearer <JWT_TOKEN>)
   ▼
┌─────────────────────────────────────────────────────────────┐
│  JwtAuthenticationFilter (OncePerRequestFilter)             │
│  - Extracts Bearer token from Authorization header           │
│  - Validates cryptographic signature and expiration         │
│  - Sets authenticated user into SecurityContextHolder       │
└──────────────────────────────┬──────────────────────────────┘
                               │ 2. Authenticated Request
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  Controller Layer (AuthController / TaskController)         │
│  - Validates request DTOs (@Valid)                          │
│  - Extracts Principal (logged-in user email)                │
└──────────────────────────────┬──────────────────────────────┘
                               │ 3. Clean DTOs & Principal
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  Service Layer (AuthService / TaskService)                  │
│  - Executes business logic                                  │
│  - Enforces strict user ownership & data isolation          │
└──────────────────────────────┬──────────────────────────────┘
                               │ 4. Domain Operations
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  Repository Layer (Spring Data JPA)                         │
│  - findByUserOrderByCreatedAtDesc(user)                     │
│  - Automated SQL parameterization (SQL Injection immunity)  │
└──────────────────────────────┬──────────────────────────────┘
                               │ 5. SQL Queries
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  MySQL Database in Docker (Port 3307:3306)                  │
│  - 'users' and 'tasks' tables                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 How to Open and Run This Project

### 1. Prerequisites
* **Java 17 or higher:** `java -version`
* **Docker Desktop:** Installed and running on your machine.

---

### 2. Step-by-Step Setup

#### Step A: Start the MySQL Database with Docker
Open your terminal in the project root directory and run:
```bash
docker compose up -d
```
*(This starts a MySQL 8.0 container on port `3307` with database `task_management_db` and password `password`).*

To verify MySQL is running:
```bash
docker ps
```

#### Step B: Start the Spring Boot Application
In the same terminal, run:
```bash
./mvnw spring-boot:run
```
*(On Windows, use `mvnw.cmd spring-boot:run`)*

The application will start on **`http://localhost:8080`**.

---

## 📡 REST API Documentation

### 1. Authentication Endpoints (Public)

#### 🔹 Register a New User
* **URL:** `POST /api/auth/register`
* **Request Body:**
```json
{
  "name": "Rahul Negi",
  "email": "rahul@example.com",
  "password": "Password123"
}
```
* **Response (`201 Created`):**
```json
{
  "message": "User registered successfully"
}
```

---

#### 🔹 Login & Obtain JWT Token
* **URL:** `POST /api/auth/login`
* **Request Body:**
```json
{
  "email": "rahul@example.com",
  "password": "Password123"
}
```
* **Response (`200 OK`):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiVVNFUiIsInN1YiI6InJhaHVsQGV4YW1wbGUuY29tIiwiaWF0IjoxNzI1OTYwMDAwLCJleHAiOjE3MjYwNDY0MDB9...",
  "tokenType": "Bearer",
  "email": "rahul@example.com",
  "role": "USER"
}
```

---

### 2. Task Endpoints (Protected — Require `Authorization: Bearer <token>`)

#### 🔹 Create a Task
* **URL:** `POST /api/tasks`
* **Header:** `Authorization: Bearer <JWT_TOKEN>`
* **Request Body:**
```json
{
  "title": "Complete Backend Placement Project",
  "description": "Secure Spring Boot Task API with JWT & Docker MySQL",
  "status": "IN_PROGRESS"
}
```
* **Response (`201 Created`):**
```json
{
  "id": 1,
  "title": "Complete Backend Placement Project",
  "description": "Secure Spring Boot Task API with JWT & Docker MySQL",
  "status": "IN_PROGRESS",
  "createdAt": "2026-09-22T04:00:00",
  "updatedAt": "2026-09-22T04:00:00"
}
```

---

#### 🔹 Get All Tasks for Logged-In User
* **URL:** `GET /api/tasks`
* **Header:** `Authorization: Bearer <JWT_TOKEN>`
* **Response (`200 OK`):**
```json
[
  {
    "id": 1,
    "title": "Complete Backend Placement Project",
    "description": "Secure Spring Boot Task API with JWT & Docker MySQL",
    "status": "IN_PROGRESS",
    "createdAt": "2026-09-22T04:00:00",
    "updatedAt": "2026-09-22T04:00:00"
  }
]
```

---

#### 🔹 Get Specific Task by ID
* **URL:** `GET /api/tasks/1`
* **Header:** `Authorization: Bearer <JWT_TOKEN>`
* **Response (`200 OK`):** Returns task details if owned by the logged-in user.

---

#### 🔹 Update Task
* **URL:** `PUT /api/tasks/1`
* **Header:** `Authorization: Bearer <JWT_TOKEN>`
* **Request Body:**
```json
{
  "title": "Complete Backend Placement Project",
  "description": "All endpoints tested and verified with Postman",
  "status": "COMPLETED"
}
```
* **Response (`200 OK`):** Returns updated task.

---

#### 🔹 Delete Task
* **URL:** `DELETE /api/tasks/1`
* **Header:** `Authorization: Bearer <JWT_TOKEN>`
* **Response:** `204 No Content`

---

## 🧪 Postman Testing Workflow

1. **Register User 1:** `POST /api/auth/register` with `user1@example.com`.
2. **Login User 1:** `POST /api/auth/login` and copy the `token`.
3. **Set Postman Auth:** In Postman, go to **Authorization** $\rightarrow$ Type: **`Bearer Token`** $\rightarrow$ Paste your token (no quotes).
4. **Create Task:** `POST /api/tasks` (Body: raw JSON) $\rightarrow$ Task ID 1 is created.
5. **Register & Login User 2:** `POST /api/auth/register` & `login` with `user2@example.com` and copy User 2's token.
6. **Verify Data Isolation:** With User 2's token, try to `GET /api/tasks/1` or `DELETE /api/tasks/1` $\rightarrow$ Returns **`403 Forbidden`**!

---

## 🛑 Standardized Error Responses

### Validation Error (`400 Bad Request`)
```json
{
  "timestamp": "2026-09-22T04:00:00",
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
  "timestamp": "2026-09-22T04:00:00",
  "status": 403,
  "error": "Forbidden",
  "message": "You do not have permission to access this task",
  "path": "/api/tasks/1"
}
```
