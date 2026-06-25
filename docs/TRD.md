# QuantPOS  Technical Requirements Document (TRD)

**Version:** 1.0  
**Date:** June 2026  
**Status:** Active Development (Phase 1)  
**Technology Stack:** Java 17 | Spring Boot 4.x | PostgreSQL 15 | Redis 7 | React 18 | AWS  
**Audience:** Development Team, Technical Architects, DevOps Engineers  
**Document Scope:** All 10 Phases (Complete Product Lifecycle)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture Overview](#system-architecture-overview)
3. [Technology Stack & Rationale](#technology-stack--rationale)
4. [Database Design & Schema](#database-design--schema)
5. [API Architecture & Specifications](#api-architecture--specifications)
6. [Security Architecture](#security-architecture)
7. [Frontend Architecture](#frontend-architecture)
8. [Multi-Tenancy Implementation](#multi-tenancy-implementation)
9. [Performance & Scalability](#performance--scalability)
10. [Deployment & Infrastructure](#deployment--infrastructure)
11. [Disaster Recovery & Backup](#disaster-recovery--backup)
12. [Monitoring & Observability](#monitoring--observability)
13. [Testing Strategy](#testing-strategy)
14. [Phase-by-Phase Technical Specifications](#phase-by-phase-technical-specifications)
15. [Development Workflow & CI/CD](#development-workflow--cicd)
16. [Known Limitations & Future Considerations](#known-limitations--future-considerations)

---

## Executive Summary

### Technical Vision

QuantPOS is a **cloud-native, multi-tenant SaaS platform** architected for:
- **Complete data isolation** between businesses using row-level tenant filtering
- **High availability** with 99.9% uptime SLA and automatic failover
- **Horizontal scalability** supporting 100,000+ concurrent users
- **Zero-knowledge architecture** where tenants cannot access each other's data even through SQL injection
- **Real-time operations** with sub-500ms API latency at p95
- **Enterprise-grade security** with encrypted data at rest and in transit, role-based access control, and comprehensive audit logging

### Core Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Multi-tenancy | Row-level isolation, shared schema | Shopify/Zoho pattern: cost-efficient, operationally simple, scales to millions |
| Database | PostgreSQL (shared instance) | ACID compliance, Hibernate support, excellent JSON support for flexible schemas |
| Caching | Redis (in-memory) | Stateless JWT + refresh token storage, session management, rate limiting |
| Authentication | JWT + refresh token pattern | Stateless, scalable, prevents token hijacking through rotation |
| Frontend state | Zustand + React Query | Lightweight, event-driven, server state properly separated from client state |
| Deployment | Docker + AWS | Containerized for consistency, AWS RDS/EC2 for managed infrastructure |
| API design | RESTful with standard response envelopes | Predictable client integration, easy error handling |

### Success Metrics Driving Design

- **Performance:** p95 latency < 500ms, p99 < 1 second
- **Reliability:** 99.9% uptime, < 15 min RTO, < 1 hour RPO
- **Scalability:** Support 100,000 concurrent users, 10M requests/day
- **Security:** Zero successful security breaches, SOC 2 compliant
- **Cost:** < $10K/month AWS bill for 10,000 businesses

---

## System Architecture Overview

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                │
├─────────────────────────────────────────────────────────────────────┤
│  React 18 SPA (Vite) │ Zustand Store │ React Query │ Axios          │
│  - Login/Register      - User state      - Server state   - HTTP    │
│  - Dashboard           - Auth tokens     - Caching        client    │
│  - POS Terminal        - Roles           - Background sync          │
│  - Reports             - Permissions     - Refetch logic            │
└──────────────────────────────────────┬──────────────────────────────┘
                                       │ JWT Authorization
                                       │ Bearer Token
                                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       API GATEWAY LAYER                             │
├─────────────────────────────────────────────────────────────────────┤
│  Spring Security (JWT Filter) → TenantContext (ThreadLocal)         │
│  CORS Policy → Rate Limiting → Request/Response Logging             │
└──────────────────────────────────────┬──────────────────────────────┘
                                       │
                ┌──────────────────────┼──────────────────────┐
                │                      │                      │
                ▼                      ▼                      ▼
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│  AUTH CONTROLLERS    │  │  BUSINESS LOGIC      │  │ EXTERNAL INTEGRATIONS|
│                      │  │  CONTROLLERS         │  │                      │
│ - Register           │  │                      │  │ - Stripe API         │
│ - Login              │  │ - Products           │  │ - Brevo SMTP         │
│ - Refresh            │  │ - Inventory          │  │ - OpenAI API         │
│ - Verify Email       │  │ - Sales              │  │ - Payment processors │
│ - Reset Password     │  │ - Reports            │  │                      │
│                      │  │ - Billing            │  │                      │
└──────────┬───────────┘  └──────┬───────────────┘  └──────┬───────────────┘
           │                     │                         │
           └─────────────────────┼─────────────────────────┘
                                 │ Service Layer
                                 │ Business Logic
                                 │ Validation
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     DATA ACCESS LAYER                               │
├─────────────────────────────────────────────────────────────────────┤
│  Spring Data JPA + Hibernate with Tenant Filters                    │
│  - TenantAwareRepository base class                                 │
│  - Automatic tenant_id filtering on all queries                     │
│  - Custom queries with explicit tenant filtering                    │
│  - Query performance monitoring                                     │
└──────────────────────────────────────┬──────────────────────────────┘
                                       │
                ┌──────────────────────┼──────────────────────┐
                │                      │                      │
                ▼                      ▼                      ▼
        ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
        │ PostgreSQL   │      │ Redis Cache  │      │ Elasticsearch│
        │ (Primary DB) │      │ (Sessions)   │      │ (Optional)   │
        │              │      │ (Tokens)     │      │ (Logs)       │
        │ - Tenants    │      │ (Refresh)    │      │              │
        │ - Users      │      │ (Rate limit) │      │              │
        │ - Products   │      │              │      │              │
        │ - Sales      │      │              │      │              │
        │ - Inventory  │      │              │      │              │
        └──────────────┘      └──────────────┘      └──────────────┘

                          ↕ Async Events
                          
        ┌─────────────────────────────────────┐
        │  MESSAGE QUEUE (RabbitMQ/Kafka)     │
        │  - Email sending                    │
        │  - Webhook processing               │
        │  - AI agent triggers                │
        │  - Analytics events                 │
        └─────────────────────────────────────┘
```

### Request Flow - Complete Journey

```
1. USER ACTION
   User clicks "Login" button in React app

2. FRONTEND
   React component collects email + password
   Axios calls POST /api/auth/login with credentials

3. API GATEWAY
   Request reaches Spring Boot on localhost:8080
   CORSFilter checks origin matches whitelist
   TenantFilter runs (no tenant yet, request bypasses TenantContext)

4. AUTHENTICATION
   AuthController.login() receives request
   AuthService validates credentials:
     - Find user by email in PostgreSQL
     - BCrypt.matches(password, passwordHash)
     - Check is_email_verified = true
     - Check user.is_active = true
     - Check tenant.is_active = true
   
5. TOKEN GENERATION
   If valid:
     - JwtProvider.generateAccessToken(user)
       Creates JWT with claims: {sub: userId, tenantId, role, email}
       Signs with HS256 and JWT_SECRET
       Returns "eyJhbGc..."
     
     - TokenService.generateRefreshToken(user)
       Creates UUID token
       Stores in Redis: refresh_token:{token} → userId (TTL: 7 days)
       Returns UUID string
   
6. RESPONSE
   Return:
   {
     "success": true,
     "data": {
       "accessToken": "eyJhbGc...",
       "refreshToken": "f47ac10b-58cc...",
       "user": { id, email, role, tenantId, businessName }
     }
   }

7. FRONTEND STORAGE
   Zustand authStore.setAuth(user, accessToken, refreshToken)
   - Access token stored in memory (NOT localStorage)
   - Refresh token stored in memory (NOT localStorage)
   - User info stored in store
   - useAuth() hook provides global access

8. NEXT API REQUEST
   User clicks "View Products"
   Axios interceptor prepends: Authorization: Bearer {accessToken}
   
   POST /api/products
   Headers: { Authorization: Bearer eyJhbGc... }

9. REQUEST WITH TENANT CONTEXT
   JwtFilter intercepts request
   Extracts JWT from Authorization header
   JwtProvider.validateToken() checks signature and expiry
   JwtProvider.extractClaims() gets tenantId
   TenantContext.setTenantId(tenantId) ← ThreadLocal set
   
10. BUSINESS LOGIC EXECUTION
    ProductController.getProducts()
    ProductService.getProducts()
    ProductRepository.findAll()
    
    Hibernate interceptor automatically appends:
    SELECT * FROM products WHERE tenant_id = {TenantContext.getTenantId()}
    
    Only products for this tenant returned

11. RESPONSE
    Return product list
    TenantContext.clear() called in finally block

12. TOKEN EXPIRY (15 minutes later)
    User makes API request
    JwtProvider.validateToken() returns false (exp claim in past)
    JwtFilter passes (doesn't block 401 yet, controller will check)
    
    API endpoint is protected: @PreAuthorize("isAuthenticated()")
    throws AuthenticationException → 401 Unauthorized

13. AUTOMATIC TOKEN REFRESH
    Axios interceptor catches 401
    Calls POST /api/auth/refresh with refreshToken
    
    TokenService.validateRefreshToken(token)
    Checks Redis: get refresh_token:{token} → returns userId
    
    If found:
      - Delete old token from Redis (rotation)
      - Generate new access token
      - Generate new refresh token
      - Store new refresh token in Redis
      - Return both tokens
    
    Axios interceptor:
      - Updates Zustand store with new tokens
      - Retries original request with new access token
      - User never sees logout

14. LOGOUT (User clicks "Logout")
    Calls POST /api/auth/logout with refreshToken
    TokenService.deleteRefreshToken(token)
    Deletes from Redis: refresh_token:{token}
    Zustand store clears auth
    Redirects to /login
```

### Component Interaction Pattern

```
React Component
     │
     ├─ useAuth() hook
     │   └─ Zustand authStore
     │       └─ accessToken, refreshToken, user
     │
     └─ API call via Axios
         │
         ├─ Request interceptor
         │  └─ Attach Bearer token
         │
         ├─ Response interceptor
         │  ├─ On 401: silent refresh
         │  └─ Retry request
         │
         └─ Spring Boot API
             │
             ├─ JwtFilter
             │  └─ TenantContext.setTenantId()
             │
             ├─ Controller
             │  └─ @PreAuthorize checks
             │
             ├─ Service
             │  └─ Business logic
             │
             └─ Repository
                 └─ Hibernate query
                    (auto-filtered by tenant_id)
```

---

## Technology Stack & Rationale

### Backend Stack - Detailed Breakdown

#### Java 17
- **Version:** 17 LTS (Long-term support until Sep 2026)
- **Why:** Latest stable with records, text blocks, pattern matching
- **Performance:** ~15% faster than Java 11 with improvements to GC and memory efficiency
- **Compatibility:** All Spring Boot 3.x libraries require Java 17+

#### Spring Boot 3.x
- **Core modules:**
  - `spring-boot-starter-web`  REST API, embedded Tomcat
  - `spring-boot-starter-security`  Authentication, authorization
  - `spring-boot-starter-data-jpa`  ORM layer with Hibernate
  - `spring-boot-starter-data-redis`  Redis client
  - `spring-boot-starter-mail`  SMTP client
  - `spring-boot-starter-actuator`  Monitoring endpoints
  - `spring-boot-starter-validation`  Bean validation
  
- **Why:** 
  - Industry standard for enterprise Java applications
  - Extensive ecosystem of libraries
  - Excellent multi-tenancy support via Hibernate filters
  - Built-in metrics and health checks

#### PostgreSQL 15
- **Version:** 15 (released Oct 2022, stable and mature)
- **Why:**
  - ACID compliance  guarantees data integrity
  - JSON/JSONB support  flexible schema for product metadata
  - Full-text search  for product search feature
  - Window functions  for complex analytics queries
  - Excellent Hibernate support
  - Proven at massive scale (Uber, Dropbox)
  - Free and open-source
  
- **Configuration:**
  - Connection pooling: HikariCP (20 connections in prod)
  - Connection pool size: 5-20 based on environment
  - Max connections: 100 (per AWS RDS constraints)
  - Idle timeout: 10 minutes

#### Redis 7
- **Version:** 7 (Nov 2022)
- **Purpose:** Session store, token storage, rate limiting cache
- **Data structures:**
  - String: `refresh_token:{uuid} → userId` (7-day TTL)
  - String: `password_reset:{uuid} → userId` (1-hour TTL)
  - String: `email_verify:{uuid} → userId` (24-hour TTL)
  - String: `rate_limit:{userId}:{endpoint} → count` (1-minute TTL)
  
- **Why:**
  - In-memory performance: < 1ms latency
  - Native TTL expiration: automatic token cleanup
  - Atomic operations: safe concurrent access
  - Persistence: RDB snapshots + AOF for backup
  - Cluster support: horizontal scaling if needed
  
- **Configuration:**
  - Persistence: RDB snapshots every 60 seconds
  - Memory policy: maxmemory-policy = allkeys-lru
  - Eviction: Least recently used when memory full

#### Hibernate 6.x + JPA
- **Why:** 
  - ORM abstraction layer prevents SQL injection
  - Filter support enables multi-tenancy at database level
  - Lazy loading improves performance
  - Caching (L2) reduces database round-trips
  
- **Multi-tenancy configuration:**
  ```
  hibernate:
    dialect: org.hibernate.dialect.PostgreSQLDialect
    enable_lazy_load_no_trans: true
    properties:
      hibernate:
        jdbc:
          batch_size: 20
          fetch_size: 50
```

#### Spring Security 6.x
- **Authentication chain:**
  1. JwtFilter (extract and validate token)
  2. UsernamePasswordAuthenticationToken (set in SecurityContext)
  3. @PreAuthorize (check permissions before method execution)
  
- **Password encoding:** BCrypt with strength 12
  ```
  BCryptPasswordEncoder(12)
  Cost = 2^12 = 4096 rounds of hashing
  Single password hash takes ~1 second
  Brute-force attack cost: exponential
```

#### Flyway Database Migrations
- **Versioning:** V1__, V2__, V3__ naming convention
- **Immutability:** Never modify old migrations
- **Rollback:** Create new migration to undo changes
- **Validation:** Verify all migrations run successfully on startup
- **Location:** `src/main/resources/db/migration/`

#### jjwt (Java JWT Library)
- **Version:** 0.12.x (latest, supports HS256)
- **Algorithm:** HMACSHA256 (HS256)
- **Signing:**
  ```
  Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8))
  Strength: 256-bit key (32 bytes) minimum
```
- **Claims:**
  ```
  {
    "sub": "userId-uuid",           // Subject
    "tenantId": "tenant-uuid",      // Tenant for isolation
    "role": "OWNER|MANAGER|...",    // Authorization
    "email": "user@example.com",    // Contact
    "businessName": "Name",         // UX convenience
    "iat": 1705318200,              // Issued at
    "exp": 1705319100               // Expiry
  }
```

#### MapStruct
- **Purpose:** Type-safe DTO ↔ Entity mapping
- **Why:** Prevents casting errors, generates code at compile-time
- **Performance:** Zero reflection overhead

#### Lombok
- **Purpose:** Reduce boilerplate (getters, setters, constructors)
- **Annotations:** @Data, @AllArgsConstructor, @NoArgsConstructor
- **Generated at:** Compile-time (no runtime reflection)

#### Springdoc OpenAPI (Swagger)
- **Auto-generates:** API documentation from code annotations
- **Endpoint:** `/swagger-ui.html` for interactive testing
- **Spec:** OpenAPI 3.0 standard at `/v3/api-docs`

### Frontend Stack - Detailed Breakdown

#### React 18
- **Rendering:** Concurrent rendering with Suspense
- **Hooks:** Functional components only, no class components
- **Memory:** Automatic cleanup of event listeners and subscriptions
- **Why:** 
  - Industry standard for UIs
  - Massive ecosystem of libraries
  - Excellent TypeScript support
  - Component reusability

#### Vite 5
- **Build tool:** Replaces Create React App
- **Benefits:**
  - Lightning-fast HMR (Hot Module Replacement): < 50ms
  - Instant server startup
  - Optimized production build with code splitting
  - ESM (ES modules) native
- **Build output:** Minified, tree-shaken, split into ~10 chunks
- **Performance:** 
  - Initial load: ~50KB gzipped (all chunks)
  - First page: ~2 seconds on 3G

#### Tailwind CSS v3
- **Why:** Utility-first CSS, no custom CSS needed
- **Bundle size:** ~15KB gzipped (v3 with PurgeCSS)
- **Customization:** Via `tailwind.config.js`
- **Grid system:** Flexible, responsive, mobile-first

#### Zustand
- **State:** Global auth store
- ```javascript
  create((set) => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    setAuth: (user, accessToken, refreshToken) => set({ user, accessToken, refreshToken }),
    clearAuth: () => set({ user: null, accessToken: null, refreshToken: null })
  }))
```
- **Why:** 
  - Minimal boilerplate vs Redux
  - No provider wrapping needed
  - Easy to use and test
  - Tiny bundle size (~1KB)

#### TanStack Query (React Query) v5
- **Purpose:** Server state management
- **Features:**
  - Automatic caching and synchronization
  - Background refetching
  - Retry logic with exponential backoff
  - Pagination and infinite scroll support
- **Example:**
  ```javascript
  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.getProducts(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3
  })
```

#### React Router v6
- **Routing:** Client-side navigation without page reloads
- **Lazy loading:** Route-based code splitting
- **Protected routes:** Custom ProtectedRoute component with role guards
- **Configuration:**
  ```javascript
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route 
      path="/dashboard" 
      element={<ProtectedRoute><Dashboard /></ProtectedRoute>} 
    />
    <Route 
      path="/reports" 
      element={<ProtectedRoute requiredRole="OWNER"><Reports /></ProtectedRoute>} 
    />
  </Routes>
```

#### Axios
- **HTTP client:** Promise-based, interceptor support
- **Interceptors:**
  - Request: Attach Bearer token to every request
  - Response: Catch 401, silent refresh, retry request
- **Configuration:**
  ```javascript
  const instance = axios.create({
    baseURL: 'http://localhost:8080',
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' }
  })
  
  // Request interceptor
  instance.interceptors.request.use(config => {
    const token = authStore.getState().accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })
  
  // Response interceptor handles 401 refresh
```

### DevOps & Deployment Stack

#### Docker
- **Images:**
  - Base: `openjdk:17-slim` for Spring Boot
  - Base: `node:18-alpine` for React build
  - Base: `nginx:alpine` for React serving
  
- **Build strategy:**
  ```dockerfile
  # Multi-stage build for Spring Boot
  FROM openjdk:17-slim as builder
  COPY . /app
  WORKDIR /app
  RUN mvn clean package -DskipTests
  
  FROM openjdk:17-slim
  COPY --from=builder /app/target/quantpos.jar app.jar
  ENTRYPOINT ["java", "-Xmx512m", "-jar", "app.jar"]
  
  # Multi-stage for React
  FROM node:18-alpine as builder
  WORKDIR /app
  COPY . .
  RUN npm ci && npm run build
  
  FROM nginx:alpine
  COPY --from=builder /app/dist /usr/share/nginx/html
  EXPOSE 80
```

- **Image size:**
  - Spring Boot: ~500MB (openjdk:17-slim + jar)
  - React: ~20MB (nginx:alpine + built app)
  - Redis: ~30MB (redis:7-alpine)
  - PostgreSQL: ~200MB (postgres:15)

#### Docker Compose (Local Development)
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: quantpos_db
      POSTGRES_USER: ${DB_USERNAME}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USERNAME}"]
      interval: 10s
      timeout: 5s
      retries: 5
  
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
  
  spring-app:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      - DB_URL=jdbc:postgresql://postgres:5432/quantpos_db
      - REDIS_HOST=redis
      - SPRING_PROFILES_ACTIVE=dev
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  react-app:
    build: ./frontend
    ports:
      - "5173:5173"
    environment:
      - VITE_API_URL=http://localhost:8080
```

#### AWS Infrastructure

**RDS PostgreSQL:**
- Instance type: `db.t3.micro` (dev) → `db.r6i.xlarge` (prod)
- Storage: 20GB gp3 (dev) → 1TB (prod with autoscaling)
- Multi-AZ: false (dev) → true (prod)
- Backup: 7-day retention (dev) → 30-day (prod)
- Enhanced monitoring: disabled (dev) → enabled (prod)

**EC2 Instances:**
- Dev: `t2.micro` (1 vCPU, 1GB RAM)
- Prod: `t3.medium` → `t3.large` (Auto Scaling Group)
- OS: Ubuntu 22.04 LTS
- Security groups: Port 80 (HTTP), 443 (HTTPS), 8080 (API for debugging)
- EBS volume: 20GB gp3 with snapshots

**Load Balancing:**
- ALB (Application Load Balancer)
- Health checks: `/actuator/health` every 30 seconds
- Auto-scaling: Add instances if CPU > 70% for 2 minutes

**S3:**
- Product images, receipts, reports storage
- Lifecycle policy: Delete old files after 90 days
- Versioning: Enabled
- Server-side encryption: AES-256

**CloudFront:**
- CDN for static assets (React build)
- Edge caching: 1 month for versioned assets
- Cache invalidation: Automatic on deployment

#### GitHub Actions CI/CD

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up JDK 17
        uses: actions/setup-java@v3
        with:
          java-version: '17'
      - name: Run tests
        run: mvn clean test
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker image
        run: |
          docker build -t quantpos:${{ github.sha }} ./backend
          docker tag quantpos:${{ github.sha }} quantpos:latest
      - name: Push to registry
        run: |
          echo "${{ secrets.DOCKER_PASSWORD }}" | docker login -u "${{ secrets.DOCKER_USERNAME }}" --password-stdin
          docker push quantpos:latest

  deploy:
    needs: [test, build]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to AWS
        run: |
          # SSH into EC2 and pull latest image
          ssh -i ${{ secrets.EC2_KEY }} ec2-user@${{ secrets.EC2_HOST }} 'cd /app && docker-compose pull && docker-compose up -d'
```

---

## Database Design & Schema

### Entity Relationship Diagram (ERD)

```
┌─────────────────────────────────────────────────────────────────┐
│                         TENANTS                                  │
├─────────────────────────────────────────────────────────────────┤
│ id: UUID (PK)                                                    │
│ business_name: VARCHAR(255) NOT NULL                            │
│ business_type: ENUM (RETAIL, FNB) NOT NULL                      │
│ phone_number: VARCHAR(20) NOT NULL                              │
│ gstin: VARCHAR(15) NULLABLE                                     │
│ address_street: VARCHAR(255) NOT NULL                           │
│ address_city: VARCHAR(100) NOT NULL                             │
│ address_state: VARCHAR(100) NOT NULL                            │
│ address_pincode: VARCHAR(10) NOT NULL                           │
│ currency: VARCHAR(10) DEFAULT 'INR'                             │
│ timezone: VARCHAR(50) DEFAULT 'Asia/Kolkata'                    │
│ financial_year_start: VARCHAR(10) DEFAULT 'APRIL'               │
│ stripe_customer_id: VARCHAR(255) NULLABLE UNIQUE                │
│ stripe_subscription_id: VARCHAR(255) NULLABLE                   │
│ subscription_status: ENUM (ACTIVE, INACTIVE, PAST_DUE, ...)    │
│ terminal_limit: INTEGER DEFAULT 0                               │
│ is_active: BOOLEAN DEFAULT true                                 │
│ created_at: TIMESTAMP DEFAULT NOW()                             │
│ updated_at: TIMESTAMP DEFAULT NOW()                             │
└──────────────────────────────────────────────────────────────────┘
          ▲
          │ 1:N
          │
┌──────────┴──────────────────────────────────────────────────────┐
│                          USERS                                   │
├─────────────────────────────────────────────────────────────────┤
│ id: UUID (PK)                                                    │
│ tenant_id: UUID (FK → tenants.id ON DELETE CASCADE)             │
│ full_name: VARCHAR(255) NOT NULL                                │
│ email: VARCHAR(255) NOT NULL UNIQUE                             │
│ password_hash: VARCHAR(255) NOT NULL (BCrypt)                   │
│ role: ENUM (SUPER_ADMIN, OWNER, MANAGER, CASHIER) NOT NULL    │
│ is_email_verified: BOOLEAN DEFAULT false                        │
│ is_active: BOOLEAN DEFAULT true                                 │
│ last_login_at: TIMESTAMP NULLABLE                               │
│ created_at: TIMESTAMP DEFAULT NOW()                             │
│ updated_at: TIMESTAMP DEFAULT NOW()                             │
│                                                                  │
│ INDICES:                                                         │
│   - idx_users_tenant_id (tenant_id)  [multi-tenant filtering]  │
│   - idx_users_email (email)           [login lookup]            │
│   - idx_users_tenant_email (tenant_id, email) [composite]       │
└──────────────────────────────────────────────────────────────────┘
          ▲
          │ 1:N (each tenant has multiple users)
          │
          └─────────────────────────────────────────┐
                                                    │
                                    ┌───────────────▼──────────────┐
                                    │      PRODUCTS                │
                                    ├─────────────────────────────┤
                                    │ id: UUID (PK)               │
                                    │ tenant_id: UUID (FK) ◄──────┼─ TENANT ISOLATION
                                    │ category_id: UUID (FK)      │
                                    │ name: VARCHAR(255)          │
                                    │ sku: VARCHAR(50)            │
                                    │ barcode: VARCHAR(255)       │
                                    │ unit_price: DECIMAL(10,2)   │
                                    │ cost_price: DECIMAL(10,2)   │
                                    │ business_type: ENUM         │
                                    │ is_active: BOOLEAN          │
                                    │ created_at: TIMESTAMP       │
                                    │                             │
                                    │ INDICES:                    │
                                    │   - idx_products_tenant_sku │
                                    └─────────────────────────────┘
                                              ▲
                                              │ 1:N
                                              │
                                    ┌─────────┴──────────────────┐
                                    │  INVENTORY                 │
                                    ├────────────────────────────┤
                                    │ id: UUID (PK)              │
                                    │ product_id: UUID (FK)      │
                                    │ tenant_id: UUID (FK)       │
                                    │ qty_on_hand: INTEGER       │
                                    │ qty_reserved: INTEGER      │
                                    │ low_stock_threshold: INT   │
                                    │ last_updated: TIMESTAMP    │
                                    └────────────────────────────┘
                                              ▲
                                              │
                                    ┌─────────┴──────────────────┐
                                    │ SALES                      │
                                    ├────────────────────────────┤
                                    │ id: UUID (PK)              │
                                    │ tenant_id: UUID (FK)       │
                                    │ terminal_id: UUID (FK)     │
                                    │ cashier_id: UUID (FK)      │
                                    │ total: DECIMAL(10,2)       │
                                    │ discount: DECIMAL(10,2)    │
                                    │ tax: DECIMAL(10,2)         │
                                    │ payment_method: VARCHAR    │
                                    │ status: ENUM (COMPLETED...) │
                                    │ created_at: TIMESTAMP      │
                                    │                            │
                                    │ INDICES:                   │
                                    │   - idx_sales_tenant_date  │
                                    │   - idx_sales_cashier      │
                                    └────────────────────────────┘
                                              ▲
                                              │ 1:N
                                              │
                                    ┌─────────┴──────────────────┐
                                    │ SALE_ITEMS                 │
                                    ├────────────────────────────┤
                                    │ id: UUID (PK)              │
                                    │ sale_id: UUID (FK)         │
                                    │ product_id: UUID (FK)      │
                                    │ product_name: VARCHAR (snap)
                                    │ unit_price: DECIMAL (snap) │
                                    │ quantity: INTEGER          │
                                    │ line_total: DECIMAL        │
                                    └────────────────────────────┘
```

### Phase 1 Tables (Authentication & Multi-Tenancy)

#### TENANTS Table

```sql
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name VARCHAR(255) NOT NULL,
  business_type VARCHAR(20) NOT NULL CHECK (business_type IN ('RETAIL', 'FNB')),
  phone_number VARCHAR(20) NOT NULL,
  gstin VARCHAR(15),
  address_street VARCHAR(255) NOT NULL,
  address_city VARCHAR(100) NOT NULL,
  address_state VARCHAR(100) NOT NULL,
  address_pincode VARCHAR(10) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
  financial_year_start VARCHAR(10) NOT NULL DEFAULT 'APRIL',
  stripe_customer_id VARCHAR(255) UNIQUE,
  stripe_subscription_id VARCHAR(255),
  subscription_status VARCHAR(20) NOT NULL DEFAULT 'INACTIVE' 
    CHECK (subscription_status IN ('ACTIVE', 'INACTIVE', 'PAST_DUE', 'CANCELLED')),
  terminal_limit INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tenants_stripe_customer ON tenants(stripe_customer_id);
CREATE INDEX idx_tenants_is_active ON tenants(is_active);
```

**Why these fields:**
- `business_type`: Determines UI variant (RETAIL vs F&B)
- `timezone`: For scheduling tasks, reporting periods
- `stripe_customer_id`: Links to Stripe for billing
- `terminal_limit`: Enforces subscription tier

#### USERS Table

```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL 
    CHECK (role IN ('SUPER_ADMIN', 'OWNER', 'MANAGER', 'CASHIER')),
  is_email_verified BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tenant_email ON users(tenant_id, email);
```

**Why these indexes:**
- `idx_users_tenant_id`: Every query filters by tenant, needs fast lookup
- `idx_users_email`: Login query uses email
- `idx_users_tenant_email`: Composite for checking tenant+email uniqueness

#### AUDIT_LOGS Table (Optional but recommended)

```sql
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL, -- LOGIN, REGISTER, UPDATE_PROFILE, DELETE_USER
  resource_type VARCHAR(50) NOT NULL, -- USER, PRODUCT, SALE, etc.
  resource_id UUID,
  old_values JSONB, -- For updates, what changed
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

**Purpose:** Compliance, security investigation, user activity tracking

---

### Phase 2 Tables (Stripe Billing)

#### SUBSCRIPTIONS Table

```sql
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR(255) NOT NULL UNIQUE,
  stripe_customer_id VARCHAR(255) NOT NULL,
  stripe_price_id VARCHAR(255) NOT NULL,
  plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('STARTER', 'GROWTH', 'ENTERPRISE')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('ACTIVE', 'PAST_DUE', 'CANCELLED')),
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancellation_date TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_tenant ON subscriptions(tenant_id);
```

#### INVOICES Table

```sql
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  stripe_invoice_id VARCHAR(255) NOT NULL UNIQUE,
  stripe_subscription_id VARCHAR(255),
  amount_due DECIMAL(10, 2) NOT NULL,
  amount_paid DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) NOT NULL,
  due_date TIMESTAMP,
  paid_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoices_tenant ON invoices(tenant_id);
```

---

### Phase 3-10 Tables (Future Phases)

Will document in respective phase sections.

---

## API Architecture & Specifications

### REST API Design Principles

1. **Resource-oriented:** Each endpoint represents a resource
2. **HTTP methods:** GET (read), POST (create), PUT (update), DELETE (remove)
3. **Status codes:**
   - 200 OK: Successful GET/PUT/PATCH
   - 201 Created: Successful POST
   - 204 No Content: Successful DELETE
   - 400 Bad Request: Client error (validation)
   - 401 Unauthorized: Missing/invalid auth
   - 403 Forbidden: Insufficient permissions
   - 404 Not Found: Resource doesn't exist
   - 409 Conflict: Duplicate email, etc.
   - 500 Internal Server Error: Server bug
   - 503 Service Unavailable: External API down

4. **Request/Response format:** JSON
5. **Pagination:** Offset-based with `?page=0&size=20`
6. **Filtering:** Query parameters like `?status=ACTIVE&startDate=2024-01-01`
7. **Sorting:** `?sort=created_at,desc` (Spring Data convention)

### Standard Response Envelope

**Success (2xx):**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* actual payload */ },
  "error": null,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Error (4xx/5xx):**
```json
{
  "success": false,
  "message": "User-friendly error message",
  "data": null,
  "error": {
    "code": "VALIDATION_FAILED",
    "details": "Email field is required"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Phase 1 API Endpoints

#### Authentication Endpoints

**POST /api/auth/register**
- **Purpose:** Create new tenant + owner user
- **Auth:** None (public)
- **Request:**
  ```json
  {
    "businessName": "Sharma General Store",
    "businessType": "RETAIL",
    "ownerFullName": "Sharma",
    "email": "sharma@example.com",
    "password": "SecurePass123!",
    "phoneNumber": "9876543210",
    "gstin": null,
    "addressStreet": "123 Market St",
    "addressCity": "Mumbai",
    "addressState": "Maharashtra",
    "addressPincode": "400001"
  }
  ```
- **Validation:**
  - Email: Not exists in database (checked before creating)
  - Phone: Regex `^[0-9]{10}$`
  - Password: Min 8 chars, must have uppercase, lowercase, number, special char
  - BusinessName: Max 255 chars
  - Pincode: Exactly 6 digits
  - GSTIN (if provided): Matches GST format `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$`

- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Registration successful. Check your email.",
    "data": null,
    "error": null
  }
  ```

- **Side effects:**
  - Creates `tenants` row
  - Creates `users` row (owner with role=OWNER, is_email_verified=false)
  - Generates verification token (UUID)
  - Stores in Redis: `email_verify:{token}` → userId (24hr TTL)
  - Sends email via Brevo SMTP
  - Logs action to `audit_logs`

- **Error cases:**
  - Email exists: 409 Conflict
  - Invalid format: 400 Bad Request
  - Server error: 500

---

**GET /api/auth/verify-email**
- **Purpose:** Activate email and account
- **Auth:** None
- **Query params:** `token={UUID}`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Email verified successfully.",
    "data": null
  }
  ```
- **Side effects:**
  - Validates token exists in Redis
  - Sets `users.is_email_verified = true`
  - Deletes token from Redis (single-use)
  - Sends welcome email
  - Logs to audit_logs

- **Error cases:**
  - Token not found: 400 "Link expired"
  - Token already used: 400 "Link already used"

---

**POST /api/auth/login**
- **Purpose:** Authenticate user and issue tokens
- **Auth:** None
- **Request:**
  ```json
  {
    "email": "sharma@example.com",
    "password": "SecurePass123!"
  }
  ```
- **Validation:**
  - Email format valid
  - Password not empty

- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "user": {
        "id": "user-uuid",
        "email": "sharma@example.com",
        "fullName": "Sharma",
        "role": "OWNER",
        "tenantId": "tenant-uuid",
        "businessName": "Sharma General Store"
      }
    }
  }
  ```

- **Business logic:**
  ```java
  User user = userRepository.findByEmail(email)
    .orElseThrow(() -> new InvalidCredentialsException())
  
  if (!user.isEmailVerified()) throw new EmailNotVerifiedException()
  if (!user.isActive()) throw new AccountInactiveException()
  if (!user.getTenant().isActive()) throw new TenantInactiveException()
  if (!passwordEncoder.matches(password, user.getPasswordHash())) 
    throw new InvalidCredentialsException()
  
  user.setLastLoginAt(now())
  userRepository.save(user)
  
  String accessToken = jwtProvider.generateAccessToken(user)
  String refreshToken = tokenService.generateRefreshToken(user)
  
  return new AuthResponse(accessToken, refreshToken, userInfo)
  ```

- **Error cases:**
  - Invalid credentials (same message for both email/password): 401
  - Email not verified: 403
  - Account inactive: 403
  - Tenant inactive: 403

---

**POST /api/auth/refresh**
- **Purpose:** Get new access token using refresh token
- **Auth:** None (public, refresh tokens are one-time-use)
- **Request:**
  ```json
  {
    "refreshToken": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "eyJ...",
      "refreshToken": "new-uuid-token"
    }
  }
  ```

- **Business logic:**
  ```java
  Optional<UUID> userId = tokenService.validateRefreshToken(token)
  if (userId.isEmpty()) throw new TokenExpiredException()
  
  User user = userRepository.findById(userId.get())
    .orElseThrow(() -> new UserNotFoundException())
  
  if (!user.isActive()) throw new AccountInactiveException()
  
  String newAccessToken = jwtProvider.generateAccessToken(user)
  String newRefreshToken = tokenService.rotateRefreshToken(token, user)
  
  return new AuthResponse(newAccessToken, newRefreshToken, null)
  ```

- **Rotation logic:**
  - Delete old token from Redis
  - Generate new UUID
  - Save to Redis with 7-day TTL
  - Return new token

- **Error cases:**
  - Token invalid/expired: 401

---

**POST /api/auth/logout**
- **Purpose:** Invalidate refresh token
- **Auth:** Required (Bearer token)
- **Request:**
  ```json
  {
    "refreshToken": "..."
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```
- **Side effects:**
  - Delete from Redis: `refresh_token:{token}`
  - Next API call with old access token will fail at expiry
  - User forced to login

---

**POST /api/auth/forgot-password**
- **Purpose:** Send password reset email
- **Auth:** None (public)
- **Request:**
  ```json
  {
    "email": "sharma@example.com"
  }
  ```
- **Response (200 OK - always):**
  ```json
  {
    "success": true,
    "message": "If an account exists with this email, a password reset link has been sent."
  }
  ```

- **Business logic (email enumeration prevention):**
  ```java
  Optional<User> optionalUser = userRepository.findByEmail(email)
  
  if (optionalUser.isPresent()) {
    User user = optionalUser.get()
    String token = tokenService.generatePasswordResetToken(user)
    emailService.sendPasswordResetEmail(user.getEmail(), user.getFullName(), token)
  }
  // Return same success message regardless
  ```

- **Side effects:**
  - If email exists: generates token, stores in Redis (1hr TTL), sends email
  - If email doesn't exist: no action (prevents enumeration)
  - Always returns 200 OK with generic message

---

**POST /api/auth/reset-password**
- **Purpose:** Reset password using one-time token
- **Auth:** None
- **Request:**
  ```json
  {
    "token": "uuid-from-email",
    "newPassword": "NewSecurePass456!"
  }
  ```
- **Validation:**
  - New password strength same as registration
  - Token not expired
  - Token valid format

- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Password reset successfully. Please log in."
  }
  ```

- **Side effects:**
  - Validates token in Redis
  - Deletes token from Redis (single-use)
  - Updates user.password_hash with BCrypt(newPassword)
  - Invalidates ALL refresh tokens for this user (force logout)
  - Sends confirmation email
  - Logs to audit_logs

---

**GET /api/auth/me**
- **Purpose:** Get current authenticated user info
- **Auth:** Required (Bearer token)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "user-uuid",
        "email": "sharma@example.com",
        "fullName": "Sharma",
        "role": "OWNER",
        "isActive": true,
        "lastLoginAt": "2024-01-15T10:30:00Z",
        "createdAt": "2024-01-01T08:00:00Z"
      },
      "tenant": {
        "id": "tenant-uuid",
        "businessName": "Sharma General Store",
        "businessType": "RETAIL",
        "phoneNumber": "9876543210",
        "currency": "INR",
        "timezone": "Asia/Kolkata",
        "subscriptionStatus": "ACTIVE"
      }
    }
  }
  ```

- **Business logic:**
  - Extract userId from JWT (from SecurityContext)
  - Extract tenantId from JWT
  - Load user and tenant from database
  - Return combined response

---

**PUT /api/auth/change-password**
- **Purpose:** Change password for authenticated user
- **Auth:** Required
- **Request:**
  ```json
  {
    "currentPassword": "OldPass123!",
    "newPassword": "NewPass456!"
  }
  ```

- **Validation:**
  - Current password matches existing hash
  - New password different from current
  - New password meets strength requirements

- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Password changed successfully."
  }
  ```

- **Side effects:**
  - Validates current password
  - Updates password_hash
  - Invalidates all refresh tokens for user
  - Sends email: "Your password has been changed"
  - Logs to audit_logs

- **Error cases:**
  - Wrong current password: 400
  - New password too weak: 400

---

#### Tenant Endpoints

**GET /api/tenant/profile**
- **Purpose:** Get business profile
- **Auth:** Required (OWNER, MANAGER)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "tenant-uuid",
      "businessName": "Sharma General Store",
      "businessType": "RETAIL",
      "phoneNumber": "9876543210",
      "gstin": null,
      "address": {
        "street": "123 Market St",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400001"
      },
      "currency": "INR",
      "timezone": "Asia/Kolkata",
      "subscriptionStatus": "ACTIVE",
      "terminalLimit": 1,
      "createdAt": "2024-01-01T08:00:00Z"
    }
  }
  ```

- **Business logic:**
  - Extract tenantId from JWT
  - Load tenant from database (filtered by tenantId automatically)
  - Return tenant details

---

**PUT /api/tenant/profile**
- **Purpose:** Update business profile
- **Auth:** Required (OWNER only)
- **Request:**
  ```json
  {
    "businessName": "Sharma General Store",
    "phoneNumber": "9876543210",
    "gstin": "22AABCT1234H1Z0",
    "addressStreet": "123 Market St",
    "addressCity": "Mumbai",
    "addressState": "Maharashtra",
    "addressPincode": "400001",
    "timezone": "Asia/Kolkata"
  }
  ```

- **Validation:**
  - Same validations as registration (name length, phone format, etc.)
  - Cannot change businessType or subscription fields

- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": { /* updated tenant */ }
  }
  ```

---

#### Admin Endpoints (SUPER_ADMIN only)

**GET /api/admin/tenants**
- **Purpose:** List all tenants (pagination)
- **Auth:** Required (SUPER_ADMIN)
- **Query params:** `?page=0&size=20&status=ACTIVE&sort=created_at,desc`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "content": [ /* tenant list */ ],
      "totalElements": 150,
      "totalPages": 8,
      "currentPage": 0,
      "size": 20
    }
  }
  ```

---

**GET /api/admin/tenants/{id}**
- **Purpose:** Get single tenant details
- **Auth:** Required (SUPER_ADMIN)
- **Response (200 OK):** Single tenant object

---

**PUT /api/admin/tenants/{id}/status**
- **Purpose:** Activate/deactivate tenant
- **Auth:** Required (SUPER_ADMIN)
- **Request:**
  ```json
  {
    "isActive": false,
    "reason": "Payment fraud detected"
  }
  ```
- **Response (200 OK):** Updated tenant object
- **Side effects:**
  - Sets tenant.is_active
  - Sends email to tenant owner
  - Logs to audit_logs with reason

---

### API Performance Specifications

| Endpoint | Target p95 | Target p99 | Caching | Rate Limit |
|----------|-----------|-----------|---------|-----------|
| POST /login | 1000ms | 2000ms | None | 10/min per IP |
| POST /register | 2000ms | 5000ms | None | 5/min per IP |
| GET /products | 200ms | 500ms | 5 min | 100/min per user |
| POST /sales | 500ms | 1000ms | None | 100/min per user |
| GET /reports | 1000ms | 2000ms | 15 min | 50/min per user |
| GET /auth/me | 50ms | 100ms | 1 min | 1000/min per user |

---

## Security Architecture

### Authentication Flow (Detailed)

```
Client Request
    │
    ├─ Header: Authorization: Bearer {JWT}
    │
    ▼
JwtFilter (Spring Security)
    │
    ├─ Extract token from Authorization header
    ├─ Call JwtProvider.validateToken(token)
    │   ├─ Verify signature: HMACSHA256 matches
    │   ├─ Check expiry: iat and exp claims valid
    │   └─ Return boolean
    │
    ├─ If invalid: Chain continues without auth (no 401 yet)
    ├─ If valid: Extract claims
    │   ├─ tenantId
    │   ├─ userId (sub)
    │   ├─ role
    │   └─ email
    │
    ├─ Load UserDetails from database (using userId)
    ├─ Create UsernamePasswordAuthenticationToken
    │   └─ Principal: user, Credentials: null, Authorities: [ROLE_OWNER]
    │
    ├─ Set SecurityContext with token
    ├─ TenantContext.setTenantId(tenantId) ◄── Multi-tenancy key
    │
    ▼
Controller Method
    │
    ├─ @PreAuthorize("hasRole('OWNER')")
    │   ├─ Check if authenticated
    │   ├─ Check if authority contains ROLE_OWNER
    │   ├─ If not: throw AccessDeniedException → 403
    │
    ├─ Extract tenantId from SecurityContext
    ├─ Or use TenantContext.getTenantId()
    │
    ▼
Service Layer
    │
    ├─ ProductService.getProducts(tenantId)
    │
    ▼
Repository
    │
    ├─ Hibernate Filter active
    ├─ Append: WHERE tenant_id = {TenantContext.getTenantId()}
    ├─ Query executes
    │
    ▼
Finally Block
    │
    ├─ TenantContext.clear()
    │
    ▼
Response
    │
    └─ Returns filtered data
```

### Authorization Matrix

```
@PreAuthorize("hasRole('OWNER')")           // Only OWNER
@PreAuthorize("hasRole('OWNER', 'MANAGER')")   // OWNER or MANAGER
@PreAuthorize("hasRole('OWNER') and ...")   // OWNER AND other conditions
```

### Password Security

**BCrypt Configuration:**
```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(12);
}
```

**Strength 12 calculation:**
- Cost factor: 2^12 = 4096 iterations
- Single hash time: ~1 second on modern CPU
- Brute force cost: For 100 billion guesses: 100B × 1s ≈ 3,170 years

**Password requirements:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 digit
- At least 1 special character (!@#$%^&*)

**Validation regex:**
```regex
^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$
```

### JWT Security

**Token structure:**
```
Header.Payload.Signature
```

**Header:**
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload:**
```json
{
  "sub": "user-uuid",
  "tenantId": "tenant-uuid",
  "role": "OWNER",
  "email": "user@example.com",
  "businessName": "...",
  "iat": 1705318200,
  "exp": 1705319100
}
```

**Signature verification:**
```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  JWT_SECRET  // Must be 256-bit minimum
)
```

**Secret generation:**
```bash
# Generate 256-bit (32 bytes) random secret
openssl rand -base64 32
# Output: wN8zV5+3xY2qL9pK0rJ8sT6uW4aB7cD9eF1gH2iJ3kL4=
```

### Refresh Token Rotation (Prevents Hijacking)

**First login:**
```
1. Issue access token (15 min) and refresh token (7 days)
2. Store refresh token in Redis: refresh_token:{token} → userId
3. Client receives both tokens
```

**Token expires (after 15 minutes):**
```
1. Client calls POST /api/auth/refresh with refresh token
2. Backend validates token exists in Redis
3. Backend DELETES old token from Redis
4. Backend generates NEW refresh token
5. Backend stores NEW token in Redis
6. Backend returns NEW access token and NEW refresh token
7. Client updates both tokens
```

**Attacker tries to replay old refresh token:**
```
1. Attacker calls POST /api/auth/refresh with stolen old token
2. Backend checks Redis: refresh_token:{oldToken} NOT FOUND
3. Backend returns 401 Unauthorized
4. Attacker cannot get new tokens
5. Legitimate user still has new token, continues working
```

**Benefits:**
- Each token is valid only once
- Replay attacks detected immediately
- Legitimate user continues working without interruption

### Data Encryption

**At rest (PostgreSQL):**
- Database encryption: TDE (Transparent Data Encryption) on AWS RDS
- Connection: SSL/TLS 1.2+ required
- Passwords: BCrypt hashed (never plaintext)
- Sensitive fields: Consider application-level encryption for:
  - GSTIN (PAN-like data)
  - Bank details (if stored)

**In transit:**
- HTTPS/TLS 1.2+
- HSTS header: `Strict-Transport-Security: max-age=31536000`
- Certificate: Let's Encrypt or AWS Certificate Manager
- All cookies: `Secure; HttpOnly; SameSite=Strict`

**JSON Web Token:**
- Signed with HS256
- Not encrypted (anyone can decode payload)
- Sensitive data never stored in token
- Token expiry limits exposure window

### CORS Configuration

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins("http://localhost:5173", "https://quantpos.com")
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .allowedHeaders("Authorization", "Content-Type")
            .allowCredentials(false)  // JWT is stateless, no cookies
            .maxAge(3600);
    }
}
```

### Rate Limiting

**Authentication endpoints (prevent brute force):**
```
POST /api/auth/login → 10 requests/minute per IP
POST /api/auth/register → 5 requests/minute per IP
POST /api/auth/forgot-password → 5 requests/minute per IP
```

**Implementation:**
```java
@Bean
public RateLimitInterceptor rateLimitInterceptor() {
    return new RateLimitInterceptor(redisTemplate);
}

// In interceptor
public boolean preHandle(HttpServletRequest request, ...) {
    String key = "rate_limit:" + clientIP + ":" + endpoint;
    Long count = redisTemplate.opsForValue().increment(key);
    
    if (count == 1) {
        redisTemplate.expire(key, 1, TimeUnit.MINUTES);
    }
    
    if (count > limit) {
        response.setStatus(429); // Too Many Requests
        return false;
    }
    return true;
}
```

### SQL Injection Prevention

**Never write native SQL:**
```java
// BAD ❌
String query = "SELECT * FROM users WHERE email = '" + email + "'";

// GOOD ✅
Query query = em.createQuery("SELECT u FROM User u WHERE u.email = ?1");
query.setParameter(1, email);
```

**Use parameterized queries:**
```java
// JPA
userRepository.findByEmail(email);

// Generated SQL: SELECT * FROM users WHERE email = ?1
// Parameters: [email]
```

### Audit Logging

**What to log:**
```
- All authentication attempts (success/failure)
- All permission checks (especially denials)
- All data modifications (create/update/delete)
- All file uploads/downloads
- All external API calls
- All errors and exceptions
- All security-relevant events
```

**Log structure:**
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "severity": "INFO",
  "eventType": "USER_LOGIN",
  "userId": "user-uuid",
  "tenantId": "tenant-uuid",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "result": "SUCCESS",
  "details": "User logged in successfully"
}
```

**Storage:**
- Application logs: CloudWatch Logs
- Audit trail: Elasticsearch
- Long-term archive: S3 Glacier

---

## Frontend Architecture

### Component Hierarchy

```
App.jsx
├─ Router (React Router v6)
│  │
│  ├─ Route: /login → Login.jsx
│  ├─ Route: /register → Register.jsx
│  ├─ Route: /verify-email → VerifyEmail.jsx
│  ├─ Route: /forgot-password → ForgotPassword.jsx
│  ├─ Route: /reset-password → ResetPassword.jsx
│  │
│  ├─ Route: /dashboard (Protected)
│  │  └─ ProtectedRoute (checks auth)
│  │     └─ Dashboard.jsx
│  │        ├─ Header.jsx
│  │        │  ├─ Logo
│  │        │  ├─ Navigation
│  │        │  └─ UserMenu
│  │        │
│  │        ├─ Sidebar.jsx
│  │        │  └─ NavLinks (filtered by role)
│  │        │
│  │        ├─ MainContent
│  │        │  ├─ KPI Cards
│  │        │  ├─ Charts
│  │        │  └─ Tables
│  │        │
│  │        └─ Footer
│  │
│  ├─ Route: /pos (Protected, OWNER/MANAGER/CASHIER)
│  │  └─ POSTerminal.jsx
│  │     ├─ ProductGrid
│  │     ├─ SearchBar
│  │     └─ Cart.jsx
│  │
│  ├─ Route: /inventory (Protected, OWNER/MANAGER)
│  │  └─ Inventory.jsx
│  │
│  ├─ Route: /reports (Protected, OWNER/MANAGER)
│  │  └─ Reports.jsx
│  │
│  └─ Route: /settings (Protected, OWNER)
│     └─ Settings.jsx
│        ├─ Profile
│        ├─ Team
│        ├─ Billing
│        └─ General
```

### State Management Architecture

```
Zustand authStore
├─ user: { id, email, fullName, role, tenantId }
├─ accessToken: "eyJ..."
├─ refreshToken: "uuid..."
├─ setAuth(user, accessToken, refreshToken)
├─ clearAuth()
└─ updateAccessToken(newToken)

React Query (TanStack Query)
├─ useQuery('products', () => api.getProducts())
│  ├─ data: [...]
│  ├─ isLoading: boolean
│  ├─ error: Error | null
│  └─ refetch()
│
├─ useMutation(api.createProduct)
│  ├─ mutate()
│  ├─ isLoading: boolean
│  └─ onSuccess()
│
└─ QueryClient
   ├─ Cache key: 'products'
   ├─ Stale time: 5 minutes
   ├─ Cache time: 10 minutes
   └─ Retry logic: exponential backoff
```

### Axios Interceptor Pattern

```javascript
// Request interceptor
instance.interceptors.request.use(
  config => {
    const token = authStore.getState().accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// Response interceptor
instance.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config
    
    // Handle 401 - token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        const refreshToken = authStore.getState().refreshToken
        const response = await instance.post('/api/auth/refresh', { refreshToken })
        
        const { accessToken, refreshToken: newRefreshToken } = response.data.data
        authStore.getState().updateAccessToken(accessToken)
        authStore.getState().setAuth(...newTokens)
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return instance(originalRequest)
      } catch (refreshError) {
        // Refresh failed, logout user
        authStore.getState().clearAuth()
        navigate('/login')
        return Promise.reject(refreshError)
      }
    }
    
    return Promise.reject(error)
  }
)
```

### React Query Cache Management

```javascript
// Login mutation
const { mutate: login } = useMutation(
  (credentials) => api.post('/auth/login', credentials),
  {
    onSuccess: (data) => {
      // Update auth store
      authStore.getState().setAuth(data.user, data.accessToken, data.refreshToken)
      
      // Invalidate all queries (start fresh)
      queryClient.invalidateQueries()
      
      // Redirect
      navigate('/dashboard')
    },
    onError: (error) => {
      // Show error toast
      showError(error.response.data.error.details)
    }
  }
)

// Product fetch query
const { data: products, isLoading } = useQuery(
  ['products'],
  () => api.getProducts(),
  {
    staleTime: 5 * 60 * 1000,      // 5 minutes
    cacheTime: 10 * 60 * 1000,     // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: !!authStore.getState().accessToken  // Don't fetch if not authenticated
  }
)
```

### Protected Route Component

```javascript
function ProtectedRoute({ children, requiredRole = null }) {
  const { user, accessToken } = authStore()
  const navigate = useNavigate()
  
  useEffect(() => {
    if (!accessToken) {
      navigate('/login')
      return
    }
    
    if (requiredRole && user?.role !== requiredRole) {
      navigate('/unauthorized')
      return
    }
  }, [accessToken, user, requiredRole, navigate])
  
  if (!accessToken) return <Loading />
  
  return children
}
```

### Form Validation Pattern

```javascript
function RegisterForm() {
  const [formData, setFormData] = useState({
    businessName: '',
    email: '',
    password: '',
    confirmPassword: '',
    // ...
  })
  const [errors, setErrors] = useState({})
  
  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.businessName) newErrors.businessName = 'Required'
    if (!formData.email || !/^[^@]+@[^@]+\.[^@]+$/.test(formData.email)) 
      newErrors.email = 'Invalid email'
    if (formData.password.length < 8) 
      newErrors.password = 'Minimum 8 characters'
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = 'Passwords must match'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    // Call API
    await api.post('/api/auth/register', formData)
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.businessName}
        onChange={(e) => setFormData({...formData, businessName: e.target.value})}
      />
      {errors.businessName && <span className="error">{errors.businessName}</span>}
      
      {/* More fields... */}
      
      <button type="submit">Register</button>
    </form>
  )
}
```

---

## Multi-Tenancy Implementation

### Tenant Isolation Guarantee

**Layer 1: Database Level (Constraints)**
```sql
-- Every business table has tenant_id FK
ALTER TABLE products ADD CONSTRAINT fk_products_tenant
  FOREIGN KEY (tenant_id) REFERENCES tenants(id);

-- Index for fast filtering
CREATE INDEX idx_products_tenant ON products(tenant_id);
```

**Layer 2: Application Level (Hibernate Filter)**
```java
@Entity
@FilterDef(
  name = "tenantFilter",
  parameters = @ParamDef(name = "tenantId", type = "UUID")
)
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
public class Product {
  @Id private UUID id;
  @Column(name = "tenant_id", nullable = false)
  private UUID tenantId;
  // ... other fields
}
```

**Layer 3: ThreadLocal Storage (Request Context)**
```java
public class TenantContext {
  private static final ThreadLocal<UUID> tenant = new ThreadLocal<>();
  
  public static void setTenantId(UUID id) {
    tenant.set(id);
  }
  
  public static UUID getTenantId() {
    return tenant.get();
  }
  
  public static void clear() {
    tenant.remove();
  }
}
```

**Layer 4: JWT Claim Extraction**
```java
@Component
public class JwtFilter extends OncePerRequestFilter {
  
  @Override
  protected void doFilterInternal(HttpServletRequest request, 
                                  HttpServletResponse response,
                                  FilterChain filterChain) 
      throws ServletException, IOException {
    
    try {
      // Extract JWT from Authorization header
      String authHeader = request.getHeader("Authorization");
      if (authHeader != null && authHeader.startsWith("Bearer ")) {
        String token = authHeader.substring(7);
        
        // Validate and extract claims
        if (jwtProvider.validateToken(token)) {
          UUID tenantId = jwtProvider.extractTenantId(token);
          UUID userId = jwtProvider.extractUserId(token);
          String role = jwtProvider.extractRole(token);
          
          // Set tenant context
          TenantContext.setTenantId(tenantId);
          
          // Set Spring Security context
          UsernamePasswordAuthenticationToken auth = 
            new UsernamePasswordAuthenticationToken(userId, null, 
              Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role)));
          SecurityContextHolder.getContext().setAuthentication(auth);
        }
      }
      
      filterChain.doFilter(request, response);
    } finally {
      // CRITICAL: Clean up ThreadLocal to prevent memory leaks
      TenantContext.clear();
      SecurityContextHolder.clearContext();
    }
  }
}
```

### Multi-Tenancy in Repository Layer

```java
@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {
  
  // Spring Data auto-applies tenant filter
  List<Product> findAll();
  // Generated SQL: SELECT * FROM products WHERE tenant_id = :tenantId
  
  // Manual queries MUST explicitly filter
  @Query("""
    SELECT p FROM Product p 
    WHERE p.id = ?1 AND p.tenantId = ?2
  """)
  Optional<Product> findById(UUID id, UUID tenantId);
  
  // Wrong - this would allow cross-tenant access (code review catches this)
  // @Query("SELECT p FROM Product p WHERE p.id = ?1")
  // Optional<Product> findByIdUnsafe(UUID id);
}
```

### Tenant Data Isolation Tests

```java
@SpringBootTest
@ActiveProfiles("test")
public class MultiTenancyTest {
  
  @Test
  public void testTenantDataIsolation() {
    // Setup: Create two tenants
    Tenant tenant1 = createTenant("Business 1");
    Tenant tenant2 = createTenant("Business 2");
    
    // Create products for each tenant
    Product product1 = createProduct(tenant1, "Product 1");
    Product product2 = createProduct(tenant2, "Product 2");
    
    // Test: Login as tenant1 user
    String token1 = login(tenant1.getOwner());
    setAuthContext(token1, tenant1.getId());
    
    // Verify: Can only see tenant1 products
    List<Product> products = productRepository.findAll();
    assertEquals(1, products.size());
    assertEquals(product1.getId(), products.get(0).getId());
    
    // Test: Try to access tenant2's product with tenant1's token
    Optional<Product> product = productRepository.findById(product2.getId());
    assertTrue(product.isEmpty()); // Hibernate filter prevented access
    
    // Test: Login as tenant2 user
    String token2 = login(tenant2.getOwner());
    setAuthContext(token2, tenant2.getId());
    
    // Verify: Can only see tenant2 products
    products = productRepository.findAll();
    assertEquals(1, products.size());
    assertEquals(product2.getId(), products.get(0).getId());
  }
  
  @Test
  public void testSQLInjectionPrevention() {
    // Attempt: Use SQL injection to see other tenant's data
    String injection = "' OR '1'='1";
    String maliciousEmail = "user@example.com" + injection;
    
    Optional<User> user = userRepository.findByEmail(maliciousEmail);
    assertTrue(user.isEmpty()); // Parameter binding prevents injection
  }
}
```

---

## Performance & Scalability

### Performance Targets

| Metric | Target | Measurement |
|--------|--------|-----------|
| Login response | < 1000ms (p95) | API endpoint latency |
| API response | < 500ms (p95) | API endpoint latency |
| Database query | < 100ms (p95) | Query execution time |
| Page load | < 2 seconds | Frontend bundle + API calls |
| Token refresh | < 100ms | Silent refresh latency |
| Email send | < 5 seconds | From request to SMTP |

### Database Indexing Strategy

**Mandatory indexes (Phase 1):**
```sql
-- Tenant filtering (every table)
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_products_tenant_id ON products(tenant_id);
CREATE INDEX idx_sales_tenant_id ON sales(tenant_id);

-- Authentication
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tenant_email ON users(tenant_id, email);

-- Foreign keys
CREATE INDEX idx_users_tenant ON users(tenant_id);
```

**Optional indexes (Phase 3+):**
```sql
-- Sales reporting
CREATE INDEX idx_sales_tenant_created ON sales(tenant_id, created_at DESC);
CREATE INDEX idx_sales_terminal ON sales(terminal_id);

-- Inventory searches
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_barcode ON products(barcode);

-- Reporting
CREATE INDEX idx_sales_items_sale_id ON sale_items(sale_id);
```

**Index design principles:**
- Always include tenant_id as first column (since all queries filter by it)
- Order by high cardinality columns first
- Composite indexes for common query patterns
- Monitor slow queries and add indexes proactively

### Caching Strategy

**Redis cache layers:**

1. **Session/Token cache:**
   ```
   refresh_token:{token} → userId (TTL: 7 days)
   email_verify:{token} → userId (TTL: 24 hours)
   password_reset:{token} → userId (TTL: 1 hour)
   ```

2. **User cache (optional):**
   ```
   user:{userId} → User object (TTL: 1 hour)
   Invalidate on: login, password change, role change
   ```

3. **Tenant cache (optional):**
   ```
   tenant:{tenantId} → Tenant object (TTL: 6 hours)
   Invalidate on: profile update, subscription change
   ```

4. **Rate limit cache:**
   ```
   rate_limit:{userId}:{endpoint} → count (TTL: 1 minute)
   Increment on each request, auto-expire
   ```

**Hibernate L2 cache (optional):**
```yaml
spring:
  jpa:
    properties:
      hibernate:
        cache:
          use_second_level_cache: true
          region:
            factory_class: org.hibernate.cache.jcache.JCacheRegionFactory
```

### Query Optimization

**N+1 Problem Prevention:**
```java
// WRONG ❌
List<Sales> sales = saleRepository.findAll(); // 1 query
for (Sale sale : sales) {
  System.out.println(sale.getCashier().getFullName()); // N queries (1 per sale)
}

// RIGHT ✅
List<Sales> sales = saleRepository.findAllWithCashier(); // 1 query with JOIN
for (Sale sale : sales) {
  System.out.println(sale.getCashier().getFullName()); // Already loaded
}

@Query("""
  SELECT s FROM Sale s 
  JOIN FETCH s.cashier 
  WHERE s.tenantId = ?1
""")
List<Sale> findAllWithCashier(UUID tenantId);
```

**Lazy loading vs Eager loading:**
- Default: Lazy loading (don't load related entities until accessed)
- Problem: Lazy loading after session close throws exception
- Solution: Use `@NamedEntityGraph` or `JOIN FETCH` in queries

**Pagination for large result sets:**
```java
// WRONG ❌
List<Sale> allSales = saleRepository.findAll(); // Loads 100,000 records into memory

// RIGHT ✅
Page<Sale> salesPage = saleRepository.findAll(
  PageRequest.of(0, 20, Sort.by("created_at").descending())
);
// Loads only 20 records, client gets total count for pagination

// Response
{
  "content": [/* 20 sales */],
  "totalElements": 100000,
  "totalPages": 5000,
  "currentPage": 0,
  "size": 20
}
```

### Scalability Architecture

**Current (Phase 1):**
```
Client → ALB → EC2 instance (t3.micro) → RDS PostgreSQL (db.t3.micro)
```

**Phase 2-3 (as load grows):**
```
Client → ALB → EC2 Auto Scaling Group (t3.small-medium)
              → RDS PostgreSQL (db.r6i.xlarge with read replicas)
              → Redis Cluster (for session/cache scaling)
              → CloudFront (CDN for static assets)
```

**Phase 4+ (10,000+ users):**
```
Client → CloudFront (CDN) → ALB → Auto Scaling (t3.medium instances)
         ├─ Horizontal: Add more EC2 instances
         ├─ Vertical: Upgrade to t4.large instances
         └─ Database:
            ├─ RDS replicas for reporting queries
            ├─ Read-only replicas in different regions
            └─ Elasticsearch for analytics
```

### Load Test Scenario

```
Tool: Apache JMeter / Gatling
Scenario: 1000 concurrent users, 5-minute test

1. User registers (1 request)
2. User verifies email (1 request)
3. User logs in (1 request)
4. User views products (1 request every 10 seconds)
5. User creates sale (1 request every 30 seconds)
6. User views reports (1 request every 60 seconds)

Expected metrics:
- Login response time: median 500ms, p95 1000ms, p99 2000ms
- API response time: median 200ms, p95 500ms, p99 1000ms
- Error rate: < 0.1%
- Server can handle 1000 concurrent users with 2 EC2 t3.small instances
```

---

## Deployment & Infrastructure

### Local Development (Docker Compose)

**Services:**
```yaml
postgres: PostgreSQL 15 on port 5432
redis: Redis 7 on port 6379
spring-app: Spring Boot on port 8080
react-app: Vite dev server on port 5173
```

**Startup:** `docker compose up --build`  
**Cleanup:** `docker compose down -v` (removes volumes)

### AWS Production Deployment

#### Network Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   AWS Region (us-east-1)                 │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │              VPC (10.0.0.0/16)                   │   │
│  │                                                  │   │
│  │  Public Subnet (10.0.1.0/24)                    │   │
│  │  ├─ ALB (Application Load Balancer)             │   │
│  │  └─ NAT Gateway (for RDS connections)           │   │
│  │                                                  │   │
│  │  Private Subnet (10.0.2.0/24)                   │   │
│  │  ├─ EC2 Auto Scaling Group                      │   │
│  │  │  ├─ Instance 1 (t3.medium)                   │   │
│  │  │  ├─ Instance 2 (t3.medium)                   │   │
│  │  │  └─ Instance 3 (t3.medium) [Auto-adds if CPU > 70%]
│  │  └─ ElastiCache (Redis)                         │   │
│  │                                                  │   │
│  │  Database Subnet (10.0.3.0/24)                  │   │
│  │  └─ RDS PostgreSQL Multi-AZ                     │   │
│  │     ├─ Primary (db.r6i.xlarge)                  │   │
│  │     └─ Standby (us-east-1b) [Auto-failover]    │   │
│  │                                                  │   │
│  └─────────────────────────────────────────────────┘   │
│                         ↕                              │
│                    S3 (Static assets)                   │
│                    CloudFront (CDN)                     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

#### RDS PostgreSQL Configuration

```
Instance class: db.r6i.xlarge
  - 4 vCPUs
  - 32 GB RAM
  - Network optimized

Storage: 500 GB gp3 (provisioned)
  - IOPS: 3000
  - Throughput: 125 MB/s
  - Auto-scaling: Up to 2 TB

High availability: Multi-AZ
  - Primary: us-east-1a
  - Standby: us-east-1b (synchronous replication)
  - Failover time: ~60 seconds

Backup:
  - Retention: 30 days
  - Backup window: 03:00-04:00 UTC
  - Automated snapshots: Daily

Monitoring:
  - CloudWatch metrics: CPU, memory, connections
  - Enhanced monitoring: Real-time OS metrics
  - Performance Insights: Query-level analysis

Security:
  - Security groups: Only allow EC2 instances
  - Encryption: KMS key for EBS
  - No public accessibility
```

#### EC2 Auto Scaling Group

```
Instance type: t3.medium
  - 2 vCPUs
  - 4 GB RAM
  - $0.0416/hour (on-demand)

Launch template:
  - AMI: Ubuntu 22.04 LTS
  - Root volume: 20 GB gp3
  - IAM role: Allows S3 access, CloudWatch Logs
  - User data script: Pulls Docker image, starts containers

Auto Scaling policy:
  Target tracking scaling:
    - Metric: Average CPU utilization
    - Target: 70%
    - Scale up: When CPU > 70% for 2 minutes
    - Scale down: When CPU < 30% for 5 minutes
  
  Min instances: 2 (always available)
  Max instances: 10 (cost control)
  Desired: 2 (default)

Health checks:
  - Type: ELB
  - Check interval: 30 seconds
  - Unhealthy threshold: 2 failures
  - Action: Replace unhealthy instance

Lifecycle hooks:
  - On instance termination: Drain connections (30-second grace period)
```

#### Load Balancer Configuration

```
Type: Application Load Balancer (ALB)
Listening on: Port 80 (HTTP) and 443 (HTTPS)

HTTP listener (port 80):
  - Redirect all traffic to HTTPS

HTTPS listener (port 443):
  - Certificate: AWS Certificate Manager (free)
  - Protocol: TLS 1.2+
  - Cipher suites: Modern ciphers only (AES-GCM)
  - Target group: EC2 instances on port 8080

Routing rules:
  - /api/* → Spring Boot instances (8080)
  - /* → S3 + CloudFront (static assets)

Health check:
  - Path: /actuator/health
  - Protocol: HTTPS
  - Interval: 30 seconds
  - Timeout: 5 seconds
  - Healthy threshold: 2 checks
  - Unhealthy threshold: 2 checks
  - Matcher: 200

Cross-zone load balancing: Enabled
Connection draining: 30 seconds
Sticky sessions: Disabled (JWT is stateless)
```

#### ElastiCache Redis Configuration

```
Engine: Redis 7.0
Node type: cache.t3.medium
  - 1 vCPU
  - 1 GB memory
  - Sufficient for tokens + cache

Cluster mode: Disabled
Replication: Single-AZ with automatic failover disabled
  (OK for cache/token store, not critical data)

Eviction policy: allkeys-lru
  - When memory full: Remove least recently used key

Parameter group:
  maxmemory-policy: allkeys-lru
  timeout: 0 (no connection timeout)
  tcp-keepalive: 300

Backup:
  - Snapshots: Not enabled (cache is ephemeral)
  - If needed: Can be enabled for production

Security:
  - Security group: Allow EC2 instances on port 6379
  - No public accessibility
  - No authentication (assume VPC is secure)
  - Encryption in transit: Disabled (for now, can enable)
```

#### S3 + CloudFront for Static Assets

```
S3 bucket: quantpos-assets
  - Region: us-east-1
  - Versioning: Enabled
  - Server-side encryption: AES-256
  - Block public access: Enabled
  - Files: React bundle (dist/), images, uploads

CloudFront distribution:
  - Origin: S3 bucket
  - Behavior 1 (static assets):
    - Path: /dist/*
    - Viewer protocol: HTTPS only
    - Cache TTL: 1 year (versioned filenames)
    - Compress: Enabled (gzip, brotli)
  
  - Behavior 2 (API calls):
    - Path: /api/*
    - Origin: ALB
    - Viewer protocol: HTTPS only
    - Cache TTL: 0 (no caching for API)
    - Pass authentication headers: Yes

  - Default behavior:
    - Origin: S3
    - Cache TTL: 1 hour (index.html)
    - Compress: Enabled

  - Price class: 100 (US, Europe, Asia)
  - WAF: Optional (DDoS protection)
```

#### CI/CD Pipeline (GitHub Actions)

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup JDK 17
        uses: actions/setup-java@v3
        with:
          java-version: '17'
      - name: Run tests
        run: mvn clean test
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker image
        run: docker build -t ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.us-east-1.amazonaws.com/quantpos:${{ github.sha }} ./backend
      - name: Push to ECR
        run: |
          aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.us-east-1.amazonaws.com
          docker push ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.us-east-1.amazonaws.com/quantpos:${{ github.sha }}

  build-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build React app
        run: cd frontend && npm ci && npm run build
      - name: Upload to S3
        run: aws s3 sync frontend/dist s3://quantpos-assets/ --delete
      - name: Invalidate CloudFront
        run: aws cloudfront create-invalidation --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} --paths "/*"

  deploy:
    needs: [build-backend, build-frontend]
    runs-on: ubuntu-latest
    steps:
      - name: Update ECS Task Definition
        run: |
          aws ecs update-service \
            --cluster quantpos-prod \
            --service quantpos-api \
            --force-new-deployment
      - name: Wait for deployment
        run: aws ecs wait services-stable --cluster quantpos-prod --services quantpos-api
      - name: Smoke tests
        run: curl -f https://api.quantpos.com/actuator/health || exit 1
```

---

## Disaster Recovery & Backup

### RTO & RPO Targets

| Scenario | RTO | RPO | Strategy |
|----------|-----|-----|----------|
| Database disk failure | 1 minute | 0 minutes | RDS Multi-AZ automatic failover |
| Region outage | 1 hour | 5 minutes | Cross-region RDS replica + restore |
| Data corruption | 1 hour | 1 hour | Daily automated snapshots, restore from snapshot |
| Ransomware attack | 4 hours | 24 hours | Snapshots with encryption, point-in-time recovery |
| Complete loss | 24 hours | 1 day | S3 cross-region replication, backup in another region |

### Backup Strategy

**Database backups:**
```
Automated:
- Daily snapshots at 03:00 UTC
- 30-day retention
- Stored in S3 (encrypted)
- Cross-region replication to us-west-2

Manual:
- Before major deployments: On-demand snapshot
- Stored with naming: quantpos-backup-2024-01-15-before-deployment

Recovery:
- Point-in-time restore: Any time in last 35 days
- Restore to new RDS instance, test, then cut over
```

**Application data in S3:**
```
Product images:
- Lifecycle policy: Delete after 90 days (configurable)
- Versioning: Enabled
- Cross-region replication: Yes

Receipts/reports:
- Archive to Glacier after 90 days
- 7-year retention for compliance
- Encryption: KMS key
```

**Redis (tokens & cache):**
```
- Backup: Not necessary (cache is ephemeral)
- If needed: Manual snapshots before major changes
- Recovery: Restart Redis, tokens expire normally
```

### Disaster Recovery Procedures

**Database failure recovery:**
```
1. RDS detects primary unavailable
2. Automatic failover triggered (~60 seconds)
3. DNS updated to standby endpoint
4. Application retries connections
5. No manual action required
```

**Corrupted data recovery:**
```
1. Restore from most recent snapshot
   - Choose snapshot from before corruption detected
   - Create new RDS instance from snapshot
2. Verify data integrity
3. Run data validation queries
4. Cut over DNS to new instance
5. Monitor for 30 minutes
6. Keep old instance for 7 days before deletion
```

**Regional outage recovery:**
```
1. If AWS region completely unavailable
2. Promote cross-region read replica to primary
   - Has < 5 minute RPO (replication lag)
3. Update application endpoints (via Route 53)
4. Update DNS records
5. Restore S3 data from cross-region replication
```

---

## Monitoring & Observability

### Metrics & Alerting

**Application metrics (CloudWatch):**
```
HTTP Requests:
- Count: Total requests
- Latency: p50, p95, p99, p999
- Error rate: 4xx, 5xx
- By endpoint: /api/login, /api/products, etc.

Authentication:
- Login success/failure rate
- Token generation latency
- Refresh token usage

Database:
- Connection count
- Query latency: p50, p95, p99
- Slow queries (> 100ms)
- Row counts by table

Redis:
- Keys count
- Memory usage
- Evictions (tokens being expired)
- Connection count
- Command latency
```

**Business metrics:**
```
Users:
- Daily active users (DAU)
- Monthly active users (MAU)
- New signups
- Churn rate

Transactions:
- Sales count (daily)
- Revenue (daily)
- Average order value

Errors:
- API errors by type
- Database errors
- Third-party failures (Stripe, Brevo)
```

**Alert thresholds:**
```
CRITICAL (page on-call):
- Database CPU > 90% for 5 minutes
- Database connections > 80 of 100
- API error rate > 1% for 5 minutes
- API latency p99 > 5 seconds
- Disk usage > 90%

HIGH (email alert):
- Database CPU > 75% for 10 minutes
- API error rate > 0.5% for 10 minutes
- API latency p95 > 1 second
- Redis memory > 80%

MEDIUM (Slack notification):
- Slow query (> 1 second)
- Failed Stripe webhook
- Failed email send
```

### Logging Strategy

**Log levels:**
```
ERROR:   System failures, uncaught exceptions
WARN:    Unexpected behavior, degraded service
INFO:    Important business events (login, sale)
DEBUG:   Detailed application flow (not in prod)
TRACE:   Every method entry/exit (not in prod)
```

**Log structure (JSON):**
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "logger": "com.quantpos.auth.service.AuthService",
  "message": "User login successful",
  "userId": "user-uuid",
  "tenantId": "tenant-uuid",
  "ipAddress": "192.168.1.100",
  "requestId": "req-12345",
  "duration_ms": 342,
  "service": "quantpos-api",
  "version": "1.0.0"
}
```

**Log aggregation:**
```
Tool: CloudWatch Logs Insights
Retention: 30 days (prod), 7 days (staging)

Queries:
- Find all errors for tenant: fields @message | filter tenantId = "..."
- Find slow queries: fields @message, @duration | filter @duration > 1000
- Error rate per hour: stats count() by bin(1h)
- API latency percentiles: stats pct(@duration, 50), pct(@duration, 95), pct(@duration, 99)
```

### Tracing & Distributed Tracing

**Request ID propagation:**
```
1. User makes request → ALB generates X-Request-ID header
2. ALB passes to Spring Boot
3. Spring Boot includes in all logs
4. Spring Boot passes to external APIs (Stripe, Brevo)
5. All logs linked by request ID
6. Can trace single user action across services

Implementation:
@Bean
public FilterRegistrationBean<LoggingFilter> loggingFilterBean() {
  return new FilterRegistrationBean<>(new LoggingFilter());
}

public class LoggingFilter extends OncePerRequestFilter {
  @Override
  protected void doFilterInternal(...) {
    String requestId = request.getHeader("X-Request-ID");
    if (requestId == null) {
      requestId = UUID.randomUUID().toString();
    }
    MDC.put("requestId", requestId);
    // ...
  }
}
```

---

## Testing Strategy

### Unit Testing (Spring Boot)

**Framework:** JUnit 5 + Mockito

**Test structure:**
```java
@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {
  
  @Mock
  private UserRepository userRepository;
  
  @Mock
  private PasswordEncoder passwordEncoder;
  
  @InjectMocks
  private AuthService authService;
  
  @Test
  public void login_successfulWithValidCredentials() {
    // Arrange
    User user = new User(...);
    when(userRepository.findByEmail("test@example.com"))
      .thenReturn(Optional.of(user));
    when(passwordEncoder.matches("password", user.getPasswordHash()))
      .thenReturn(true);
    
    // Act
    AuthResponse response = authService.login("test@example.com", "password");
    
    // Assert
    assertNotNull(response.getAccessToken());
    assertNotNull(response.getRefreshToken());
    assertEquals("test@example.com", response.getUser().getEmail());
  }
}
```

**Coverage targets:**
- Services: 85%+ (business logic)
- Controllers: 70%+ (endpoint coverage)
- Repositories: 60%+ (mostly auto-generated)
- Utils: 90%+ (critical code)

### Integration Testing

**Framework:** Spring Boot Test + TestContainers

```java
@SpringBootTest(webEnvironment = RANDOM_PORT)
@ActiveProfiles("test")
public class AuthControllerIntegrationTest {
  
  @Autowired
  private TestRestTemplate restTemplate;
  
  @Autowired
  private UserRepository userRepository;
  
  @Container
  static PostgreSQLContainer<?> postgres = 
    new PostgreSQLContainer<>("postgres:15");
  
  @Test
  public void registerAndLogin_fullFlow() {
    // Register
    RegisterRequest req = new RegisterRequest(...);
    HttpEntity<RegisterRequest> entity = new HttpEntity<>(req);
    
    ResponseEntity<ApiResponse<?>> response = 
      restTemplate.postForEntity("/api/auth/register", entity, ApiResponse.class);
    
    assertEquals(HttpStatus.OK, response.getStatusCode());
    assertTrue(response.getBody().isSuccess());
    
    // Verify user created
    Optional<User> user = userRepository.findByEmail(req.getEmail());
    assertTrue(user.isPresent());
    assertFalse(user.get().isEmailVerified());
  }
}
```

### E2E Testing (Frontend)

**Framework:** Playwright / Cypress

```javascript
describe('Full Registration & Login Flow', () => {
  test('User can register, verify email, and login', async ({ page }) => {
    // Navigate to register
    await page.goto('http://localhost:5173/register')
    
    // Fill registration form
    await page.fill('[name="businessName"]', 'Test Store')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'SecurePass123!')
    // ... fill other fields
    
    // Submit
    await page.click('button[type="submit"]')
    
    // Wait for success message
    await page.waitForSelector('text=Check your email')
    
    // Verify email (in real test, extract link from test email)
    // ...
    
    // Navigate to login
    await page.goto('http://localhost:5173/login')
    
    // Login
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'SecurePass123!')
    await page.click('button[type="submit"]')
    
    // Verify redirected to dashboard
    await page.waitForURL('http://localhost:5173/dashboard')
  })
})
```

---

## Phase-by-Phase Technical Specifications

### Phase 1: Authentication & Multi-Tenancy (Complete)

**Technical deliverables:**
- ✅ JwtProvider with HS256 signing
- ✅ JwtFilter for every request
- ✅ TenantContext ThreadLocal isolation
- ✅ Hibernate tenant filter
- ✅ Password hashing with BCrypt-12
- ✅ Refresh token rotation in Redis
- ✅ Email verification flow via Brevo
- ✅ Password reset with one-time tokens

**Database:**
- ✅ tenants table (multi-tenancy root)
- ✅ users table (tenant-scoped)
- ✅ audit_logs table (optional but recommended)

**API endpoints (9 total):**
- ✅ POST /api/auth/register
- ✅ GET /api/auth/verify-email
- ✅ POST /api/auth/login
- ✅ POST /api/auth/refresh
- ✅ POST /api/auth/logout
- ✅ GET /api/auth/me
- ✅ PUT /api/auth/change-password
- ✅ POST /api/auth/forgot-password
- ✅ POST /api/auth/reset-password

**Performance:**
- Login: < 1000ms p95 ✅
- Refresh: < 100ms ✅
- Database query: < 100ms ✅

**Security:**
- JWT signature verification ✅
- BCrypt password hashing ✅
- Email enumeration prevention ✅
- Token rotation ✅
- Rate limiting ✅
- CORS configured ✅

**Testing:**
- Unit tests: 85%+ coverage ✅
- Integration tests: Auth flow ✅
- E2E tests: Register → Verify → Login ✅

---

### Phase 2: Stripe Subscription Billing

**Technical specs:**
- Stripe Java SDK integration
- Checkout Session creation (REST)
- Webhook listener for 5+ event types
- Subscription status enforcement
- Terminal limit enforcement in POS
- **Resilient Checkout Recovery:** Automatically intercepts Stripe `resource_missing` errors (e.g., when a Stripe Customer ID is manually deleted in Stripe but still referenced in our DB), provisions a new Customer ID, updates the `tenants` table, and seamlessly retries the checkout session creation without throwing an error to the client.
- **Frontend State Sync:** React/Zustand state synchronization strategy calling `GET /api/auth/me` on `DashboardLayout` mount to immediately resolve the "Inactive" banner when returning from a successful Stripe checkout.

**Database:**
- subscriptions table
- invoices table
- payment_events (for idempotency)

**API endpoints (4 total):**
- POST /api/billing/create-checkout-session
- POST /api/billing/create-portal-session
- POST /api/webhooks/stripe (webhook endpoint)
- GET /api/billing/current-subscription

**Stripe webhook events:**
- checkout.session.completed
- invoice.payment_succeeded
- invoice.payment_failed
- customer.subscription.updated
- customer.subscription.deleted

**Performance:**
- Checkout URL generation: < 500ms
- Webhook processing: < 1000ms
- Subscription status check: < 100ms (cache 1 hour)

**Security:**
- Stripe signature verification (MUST)
- Webhook idempotency (handle duplicates)
- No sensitive data in logs

---

### Phase 3: Inventory Management (Active Development)

**Pricing Architecture (Integer/Paise Strategy):**
To completely eliminate floating-point precision errors (e.g., 0.1 + 0.2 = 0.30000000000000004), all financial values are stored as `BIGINT` in their smallest currency unit (Paise for INR, Cents for USD).
- Backend DB: `price_paise` = 4500 (represents ₹45.00)
- The frontend formats this for display by dividing by 100.
- POS calculations happen on the integer values before final display formatting.

**Product Types Architecture:**
- **STANDARD:** Items with integer `stock_quantity`.
- **LOOSE:** Items with decimal `stock_quantity` (e.g., 1.500 kg). Trigger a quantity input modal on the POS frontend. Base price is stored in `price_per_unit_paise`.

**Database tables:**
- categories
- products (featuring `product_type`, `unit_type`, `price_paise`, `hsn_code`, `gst_rate`)
- hsn_gst_rates (tax rules dictionary)
- inventory
- inventory_transactions

**API endpoints (15+ total):**
- CRUD for categories, products
- Inventory adjustment endpoints
- Low-stock alert queries

**AI integration:**
- Analysis of inventory patterns for Phase 6

---

### Phases 4-10 (Future)

(Detailed specifications in dedicated sections for each phase)

---

## Development Workflow & CI/CD

### Git Workflow

```
main (production, always stable)
  └── pull requests from release/develop
  └── Only merge via code review + passing CI/CD

develop (staging, latest features)
  └── pull requests from feature branches
  └── Requires: 1 approval, all tests passing

feature/auth (individual feature)
  └── Branch from: develop
  └── Contains: Single feature (e.g., JWT implementation)
  └── Naming: feature/user-auth, feature/stripe-billing, etc.

hotfix/urgent-bug (emergency)
  └── Branch from: main
  └── Merged back to: main + develop
  └── Naming: hotfix/security-issue, hotfix/critical-bug
```

### Code Review Checklist

```
Security:
  - [ ] No hardcoded secrets (passwords, API keys)
  - [ ] Input validation present
  - [ ] Tenant_id filtering on all queries
  - [ ] No SQL injection vulnerabilities
  - [ ] No XSS vulnerabilities (output encoding)

Performance:
  - [ ] No N+1 queries
  - [ ] Indexes present on foreign keys
  - [ ] Pagination for large result sets
  - [ ] No synchronous external API calls

Testing:
  - [ ] Unit tests written
  - [ ] Integration tests for endpoints
  - [ ] Edge cases tested (null, empty, invalid)

Code quality:
  - [ ] Follows Java/JavaScript style guide
  - [ ] No code duplication
  - [ ] Constants instead of magic numbers
  - [ ] Meaningful variable names
  - [ ] Comments for complex logic

Documentation:
  - [ ] API endpoint documented
  - [ ] Complex logic explained
  - [ ] Breaking changes noted
```

---

## Known Limitations & Future Considerations

### Phase 1 Limitations

1. **Refresh token storage**
   - Current: Redis with TTL
   - Limitation: If Redis restarted, tokens invalid
   - Future: Add database backup for persistent tokens
   
2. **Email verification**
   - Current: Brevo SMTP (rate limit: 300/day free)
   - Limitation: Cannot scale beyond 300 registrations/day
   - Future: Add SQS queue for email batching

3. **Password reset flow**
   - Current: 1-hour token expiry
   - Limitation: Fixed timeout
   - Future: User-configurable timeout

### Scaling Considerations

**When to upgrade database:**
- Connections nearing 80: Add read replicas
- Query latency p95 > 500ms: Increase instance size
- Disk 80%: Enable autoscaling

**When to add caching:**
- API latency p95 > 500ms: Add Redis caching
- Database CPU > 70%: Query optimization + caching
- Specific slow endpoints: Profile first, then cache

**When to split services:**
- Single EC2 instance insufficient: Add load balancer
- Database bottleneck: Add read replicas
- Multiple independent services: Consider microservices

### Breaking Changes (For Resume)

**v1 → v2 migration** (hypothetical):
- JWT format unchanged (backward compatible)
- API response format guaranteed stable
- Database migration via Flyway (versioned)
- Deprecation warnings (2 versions before removal)

---

**Document Version:** 1.0  
**Last Updated:** January 2024  
**Next Review:** April 2024  
**Technical Lead:** Development Team  
**Approvals:** CTO, DevOps Lead