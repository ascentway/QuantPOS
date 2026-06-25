# QuantPOS  Multi-Tenant POS & Inventory Management SaaS

[![Status](https://img.shields.io/badge/Status-Active%20Development-blue.svg)](#)
[![Java](https://img.shields.io/badge/Java-21-orange.svg)](#)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.4-green.svg)](#)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](#)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791.svg)](#)
[![Redis](https://img.shields.io/badge/Redis-7.4-red.svg)](#)

QuantPOS is an enterprise-grade, production-ready **Multi-Tenant Software-as-a-Service (SaaS)** platform designed for independent retail and food & beverage (F&B) businesses. It enables independent merchants to manage point-of-sale terminals, monitor physical inventory in real-time, handle billing and subscriptions via Stripe, and receive AI-powered inventory replenishment recommendations.

The architecture emphasizes strict row-level tenant data isolation, secure stateless/stateful hybrid authentication (JWT + Redis), and a modular service structure built using industry-standard engineering patterns.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Configuration](#environment-configuration)
  - [Running with Docker Compose](#running-with-docker-compose)
  - [Running Locally for Development](#running-locally-for-development)
- [Project Structure](#project-structure)
- [API Overview](#api-overview)
- [Architecture Decisions](#architecture-decisions)

---

## Overview

QuantPOS provides a modern Point of Sale (POS) and inventory platform where multiple business entities (tenants) share a single database and backend service while remaining completely isolated from each other. 

With QuantPOS, a new business owner can self-register, verify their email, configure their store profile, and immediately start registering POS terminals, tracking items, and running transactions. The platform integrates subscription gating so that businesses are limited to their selected tier's terminal quotas.

---

## Key Features

*   **Self-Service Multi-Tenancy**: Automated business onboarding with transactional boundary guarantees. Each tenant has a isolated data space enforced using Hibernate filters.
*   **Secure Authentication Suite**: Multi-token flow including access tokens (JWT), refresh tokens (stored in Redis for instant invalidation/rotation), and email/reset tokens.
*   **Email Workflows**: Integrates SMTP relays (via Brevo) for verification and password reset flows.
*   **Stripe Gated Subscriptions**: Subscription levels mapping to terminal limits with webhook listeners to dynamically sync subscription state.
*   **POS & Inventory Tracking**: Direct checkout terminal interface with automatic stock reduction, category tagging, low-stock notifications, and a full ledger of inventory changes.
*   **AI Restocking Agent**: Scheduled or on-demand demand-forecasting model powered by OpenAI GPT, detailing stock velocities and warning flags (HIGH/MEDIUM/LOW risk).

---

## Tech Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Backend Core** | Spring Boot 3.3.4, Java 21 | Multi-tenant REST API, Spring Security, Spring Data JPA |
| **Frontend Core** | React 18, Vite | Component-driven SPA with Axios interceptors and global state |
| **Styling** | Vanilla CSS | Premium dark mode, responsive layouts, glassmorphism UI |
| **Relational DB** | PostgreSQL 15 | Active schema migrations managed via Flyway |
| **Caching & Tokens** | Redis 7.4 | Used for refresh token rotation and one-time code blacklisting |
| **Security** | JSON Web Tokens (JJWT) | HS256 Signed access tokens containing tenant boundaries |
| **Email Service** | Brevo SMTP | Automated transactional email template manager |
| **Build & Tooling** | Maven, Docker, npm | Standardized build pipelines and Docker-compose orchestration |

---

## Getting Started

### Prerequisites

*   **Java**: JDK 21
*   **Node.js**: Node 18 or above, npm
*   **Docker**: Docker Desktop (for Postgres/Redis containerization)
*   **Maven**: Maven 3.8+ (optional, wrapped script is provided)

### Environment Configuration

Create a `.env` file in the project root directory. You can copy the template from `.env.example`:

```bash
cp .env.example .env
```

Ensure the following variables are configured before launching:

```env
# Database Settings
DB_URL=jdbc:postgresql://postgres:5432/quantpos
DB_USER=postgres
DB_PASSWORD=your_secure_db_password

# Redis Settings
REDIS_HOST=redis
REDIS_PORT=6379

# JWT Security
JWT_SECRET=your_minimum_32_byte_secret_key_here_for_jwt_signing
JWT_ACCESS_EXPIRY_MS=900000 # 15 minutes
JWT_REFRESH_EXPIRY_DAYS=7

# Email (Brevo) Configuration
BREVO_EMAIL=your_brevo_smtp_account_email
BREVO_SMTP_KEY=your_brevo_smtp_api_key
BREVO_SENDER_NAME=QuantPOS

# Frontend Configurations
APP_BASE_URL=http://localhost:3000
```

### Running with Docker Compose

To boot the entire infrastructure (PostgreSQL, Redis, Backend, Frontend) with a single command:

```bash
docker compose up -d --build
```

Access the applications at:
*   **Frontend Client**: `http://localhost:3000`
*   **Backend Server**: `http://localhost:8080`
*   **Swagger API Docs**: `http://localhost:8080/swagger-ui.html`

### Running Locally for Development

For active development, run the database and cache in Docker, and the application services locally:

1.  **Boot DB & Cache**:
    ```bash
    docker compose up -d db redis
    ```

2.  **Run Backend (Spring Boot)**:
    Navigate to the `backend` directory and run:
    ```bash
    mvn spring-boot:run
    ```

3.  **Run Frontend (React)**:
    Navigate to the `frontend` directory, install dependencies, and start the Vite dev server:
    ```bash
    npm install
    npm run dev
    ```

---

## Project Structure

```text
QuantPOS/
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/quantpos/
│   │   │   │   ├── admin/          # Platform administration
│   │   │   │   ├── auth/           # JWT, login/register flows
│   │   │   │   ├── common/         # API responses & exceptions
│   │   │   │   ├── config/         # Security, Redis, OpenAPI configs
│   │   │   │   ├── multitenancy/   # Tenant context & Hibernate filters
│   │   │   │   └── tenant/         # Tenant entity and controllers
│   │   │   └── resources/
│   │   │       ├── db/migration/   # Flyway migration SQLs
│   │   │       └── application.yml # Spring Boot properties
│   │   └── src/test/               # Unit & Integration Tests
│   └── pom.xml                     # Maven project configuration
├── frontend/
│   ├── src/
│   │   ├── assets/                 # SVGs and static visual resources
│   │   ├── components/             # Reusable UI components
│   │   ├── context/                # Auth & Global context stores
│   │   ├── pages/                  # Route views (Login, Register, Dashboard)
│   │   ├── App.jsx                 # Routing configuration
│   │   └── index.css               # Styling definitions (Harmonious Dark Theme)
│   └── package.json                # NPM configuration
├── docker-compose.yml              # Multi-container orchestrator
└── .env                            # Platform secrets and credentials
```

---

## API Overview

### Authentication Endpoint (`/api/auth`)

| Endpoint | Method | Security | Description |
| :--- | :--- | :--- | :--- |
| `/register` | `POST` | Public | Register a new tenant business and owner user |
| `/verify-email` | `GET` | Public | Verify owner email via one-time UUID token |
| `/login` | `POST` | Public | Log in and receive access token + refresh token |
| `/refresh` | `POST` | Public | Request new access token using valid refresh token |
| `/logout` | `POST` | Public | Invalidate refresh token and clear session |
| `/forgot-password` | `POST` | Public | Trigger password reset verification email |
| `/reset-password` | `POST` | Public | Reset password using one-time token |
| `/me` | `GET` | Authenticated | Retrieve current user profile and business claims |
| `/change-password` | `PUT` | Authenticated | Change password for currently logged-in user |

### Tenant Profile Endpoint (`/api/tenant`)

| Endpoint | Method | Roles Allowed | Description |
| :--- | :--- | :--- | :--- |
| `/profile` | `GET` | `OWNER`, `MANAGER` | Retrieve active tenant profile details |
| `/profile` | `PUT` | `OWNER` | Update business metadata (GSTIN, name, address) |

### Super Admin Endpoint (`/api/admin`)

| Endpoint | Method | Roles Allowed | Description |
| :--- | :--- | :--- | :--- |
| `/tenants` | `GET` | `SUPER_ADMIN` | Paginated listing of all registered tenants |
| `/tenants/{id}` | `GET` | `SUPER_ADMIN` | View detailed tenant metadata |
| `/tenants/{id}/status` | `PUT` | `SUPER_ADMIN` | Suspend or activate a tenant account |

---

## Architecture Decisions

For detailed engineering deep-dives regarding multi-tenancy isolation strategies, token security, error standards, and future roadmaps, please refer to the [ARCHITECTURE.md](ARCHITECTURE.md) document.