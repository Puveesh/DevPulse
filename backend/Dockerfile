# syntax=docker/dockerfile:1
# ==========================================
# DevPulse Backend - Multi-stage Dockerfile
# Optimized for Render Free Tier (512 MB RAM)
# Resilient Maven Dependency Caching & Retries
# ==========================================

# ------------------------------------------
# Stage 1: Build stage
# ------------------------------------------
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder

WORKDIR /build

# Configure Maven/Wagon retry policies and network resilience
ENV MAVEN_OPTS="-Dmaven.wagon.http.retryHandler.count=5 \
                -Dmaven.wagon.http.retryHandler.requestSentKeepAlive=true \
                -Dmaven.wagon.http.connectionTimeout=15000 \
                -Dmaven.wagon.http.readTimeout=60000 \
                -Dhttp.keepAlive=true"

# Copy Maven descriptor first to isolate dependency resolution layer
COPY pom.xml .

# Pre-fetch plugins and dependencies using Docker BuildKit cache mount.
# Persisting /root/.m2 avoids re-downloading dependencies on every build,
# mitigating Maven Central HTTP 429 (Too Many Requests) rate limits.
RUN --mount=type=cache,target=/root/.m2 \
    mvn dependency:resolve-plugins dependency:resolve -B || true

# Copy backend source code after dependencies have been resolved
COPY src ./src

# Build production Spring Boot executable JAR skipping tests.
# Mounts the same /root/.m2 cache to leverage already-downloaded artifacts.
RUN --mount=type=cache,target=/root/.m2 \
    mvn clean package -DskipTests -B

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
