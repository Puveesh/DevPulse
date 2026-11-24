# Multi-stage Dockerfile for DevPulse Spring Boot Backend
# Stage 1: Build with Maven and Eclipse Temurin JDK 21
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder
WORKDIR /workspace

# Pre-fetch dependencies to leverage Docker layer caching
COPY backend/pom.xml .
RUN mvn dependency:go-offline -B

# Copy backend source code and compile
COPY backend/src ./src
RUN mvn clean package -DskipTests

# Stage 2: Lightweight, secure JRE runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Run as non-root user for production security
RUN addgroup -S devpulse && adduser -S devpulse -G devpulse
USER devpulse:devpulse

# Copy compiled executable JAR
COPY --from=builder --chown=devpulse:devpulse /workspace/target/devpulse-backend-0.0.1-SNAPSHOT.jar app.jar

# Railway provides dynamic PORT variable
ENV PORT=8080
ENV SPRING_PROFILES_ACTIVE=prod

EXPOSE 8080

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-Dserver.port=${PORT}", "-jar", "app.jar"]
