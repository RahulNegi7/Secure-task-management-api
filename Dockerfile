# Stage 1: Build Spring Boot application
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Cache Maven dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build jar
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Lightweight runtime image
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy jar from build stage
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
