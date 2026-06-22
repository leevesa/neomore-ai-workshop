# Multi-stage build for the Workshop Hub Spring Boot service.
# Stage 1: Build the application with the Microsoft OpenJDK 21 image.
FROM mcr.microsoft.com/openjdk/jdk:21-ubuntu AS builder

WORKDIR /workspace

# Copy Gradle configuration first for better layer caching.
COPY gradle ./gradle
COPY gradlew .
COPY build.gradle .
COPY settings.gradle .

RUN chmod +x ./gradlew

# Warm the dependency cache.
RUN ./gradlew dependencies --no-daemon || true

# Copy sources and build the boot jar (tests run separately in CI).
COPY src ./src
RUN ./gradlew bootJar --no-daemon -x test

# Stage 2: Build a slim custom JRE with jlink.
FROM mcr.microsoft.com/openjdk/jdk:21-ubuntu AS jre-builder

RUN jlink \
    --add-modules java.base,java.compiler,java.desktop,java.instrument,java.management,java.naming,java.net.http,java.prefs,java.scripting,java.security.jgss,java.security.sasl,java.sql,java.transaction.xa,java.xml,jdk.crypto.ec,jdk.crypto.cryptoki,jdk.jfr,jdk.management,jdk.unsupported \
    --strip-debug \
    --no-man-pages \
    --no-header-files \
    --compress=2 \
    --output /custom-jre

# Stage 3: Minimal runtime image.
FROM ubuntu:22.04

RUN apt-get update && \
    apt-get install -y ca-certificates curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY --from=jre-builder /custom-jre /opt/java/openjdk
ENV JAVA_HOME=/opt/java/openjdk
ENV PATH="${JAVA_HOME}/bin:${PATH}"

# Run as a non-root user.
RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app
COPY --from=builder /workspace/build/libs/*.jar app.jar
RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
