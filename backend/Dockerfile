# ==========================================
# Stage 1: Build
# ==========================================
FROM maven:3.9.9-eclipse-temurin-21 AS builder

WORKDIR /app

# Cache dependencies layer separately
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source and build
COPY src ./src
RUN mvn clean package -DskipTests -B

# ==========================================
# Stage 2: Runtime
# ==========================================
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Create non-root user for security
RUN addgroup -S quantpos && adduser -S quantpos -G quantpos

# Copy the built jar from the builder stage
COPY --from=builder /app/target/*.jar app.jar

# Change ownership
RUN chown quantpos:quantpos app.jar

USER quantpos

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
