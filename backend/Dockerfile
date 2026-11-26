# ==========================================
# DevPulse Backend - Multi-stage Dockerfile
# Optimized for Render Free Tier (512 MB RAM)
# ==========================================

# ------------------------------------------
# Stage 1: Build stage
# ------------------------------------------
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder

WORKDIR /build

# Copy Maven descriptor to cache dependencies
COPY pom.xml .

# Pre-fetch project dependencies offline layer
RUN mvn dependency:go-offline -B || true

# Copy backend source code
COPY src ./src

# Build production Spring Boot executable JAR skipping tests
RUN mvn clean package -DskipTests -B

# ------------------------------------------
# Stage 2: Runtime stage
# ------------------------------------------
FROM eclipse-temurin:21-jre-alpine AS runner

# Create non-root system group and user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy the generated JAR artifact from the builder stage
COPY --from=builder --chown=appuser:appgroup /build/target/*.jar app.jar

# Run as non-root user
USER appuser:appgroup

# Document standard container port (Render dynamically assigns $PORT at runtime)
EXPOSE 8081

# Configure environment variables
# - SPRING_PROFILES_ACTIVE=prod: enables application-prod.yml (PostgreSQL + Neon optimizations)
# - PORT=8081: default fallback if Render does not set PORT
# - JAVA_OPTS: conservative memory safeguards tuned for Render 512MB instance (256MB max heap)
ENV SPRING_PROFILES_ACTIVE=prod \
    PORT=8081 \
    JAVA_OPTS="-XX:+UseContainerSupport -Xms128m -Xmx256m -XX:MaxMetaspaceSize=128m -XX:ReservedCodeCacheSize=64m -Xss512k -XX:+UseSerialGC -XX:+ExitOnOutOfMemoryError -Djava.security.egd=file:/dev/./urandom"

# Use exec in shell form to forward SIGTERM directly to the Java process (PID 1) for graceful shutdown
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -Dserver.port=${PORT:-8081} -jar app.jar"]
