# QuantPOS

**A modern, multi-tenant POS platform built for India's retail and F&B businesses.**

QuantPOS is a cloud-native point-of-sale system designed from the ground up for Indian merchants. Native support for loose/bulk product selling by weight, GST compliance, local payment integrations, and weighing scale barcode decoding—all in one platform.

---

## ✨ Key Features

### Core POS
- **Multi-terminal support** – Scale from 1 to unlimited terminals per subscription tier
- **Loose/bulk products** – Sell by weight with label printing for pre-packed items
- **Real-time inventory** – Track stock across all terminals instantly
- **Receipt management** – Customer email/SMS delivery with multiple receipt templates
- **Session management** – Secure per-terminal operations with role-based access

### Payments & Billing
- **Stripe integration** – Seamless subscription and terminal add-on purchasing
- **14-day trial** – Customers test-drive the platform risk-free
- **Pro-rated billing** – Fair charges for mid-cycle terminal changes
- **Webhook-driven** – Idempotent event processing for reliability

### Inventory (Phase 3)
- **Three barcode strategies** – Manufacturer EAN-13, QuantPOS Code 128 (`QP|` prefix), and GS1 weight-embedded scale barcodes (India `20` prefix standard)
- **Dual-mode scanning** – Hardware USB/Bluetooth scanners + camera-based ZXing barcode recognition
- **Weighing scale integration** – Decode barcode slips from standard retail scales (no direct communication needed)
- **HSN-based GST** – Automatic lookup with manual override; CGST/SGST split; paise-based integer math
- **Audit trail** – Full transaction history with reason codes, gated by subscription tier

### Enterprise Ready
- **Multi-tenancy** – Shared-schema architecture with row-level isolation
- **RBAC** – Granular permissions for owners, managers, cashiers, and admins
- **Audit logging** – Complete event trail for compliance and debugging
- **Redis caching** – Fast barcode and configuration lookup
- **Monitoring** – Prometheus + Grafana for ops visibility

---

## 🛠 Tech Stack

### Backend
- **Runtime** – Java 21 with Spring Boot 3.3.4
- **Database** – PostgreSQL with Flyway migrations
- **ORM** – Hibernate (custom filter-based multitenancy)
- **Auth** – JJWT 0.12.6 for stateless JWT tokens
- **Payments** – Stripe Java SDK 24.3.0
- **Caching** – Redis for session tokens, barcode lookup, and filters
- **Logging** – SLF4J with structured logging (MDC for request tracking)

### Frontend
- **Framework** – React 18.3.1 with Vite
- **State** – Zustand for lightweight global state
- **Data fetching** – TanStack Query 5.56.2 (caching & sync)
- **Styling** – Tailwind CSS 4.5.5
- **Routing** – React Router DOM with protected routes
- **Build** – Vite for fast HMR and production optimization

### Infrastructure
- **Containerization** – Docker Compose for local dev and cloud deployment
- **Monitoring** – Prometheus (metrics) + Grafana (dashboards)
- **Payments** – Stripe (webhooks, subscriptions, checkout, billing portal)

---

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- Java 21+ (for local backend development)
- Node.js 18+ (for frontend development)
- PostgreSQL 15+ (if running outside Docker)
- Redis 7+ (if running outside Docker)

### Quick Start with Docker Compose

```bash
# Clone the repository
git clone https://github.com/yourusername/quantpos.git
cd quantpos

# Start all services
docker-compose up -d

# Backend runs on http://localhost:8080
# Frontend (Vite dev server) runs on http://localhost:5173
# Grafana dashboard at http://localhost:3000 (admin/admin)
```

### Local Development (Backend)

```bash
cd backend

# Set environment variables (see .env.example)
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/quantpos_db
export SPRING_REDIS_HOST=localhost
export JWT_SECRET=your-secret-key
export STRIPE_API_KEY=sk_test_...

# Build and run
mvn clean spring-boot:run
```

### Local Development (Frontend)

```bash
cd frontend

# Install dependencies
npm install

# Start dev server with HMR
npm run dev

# Build for production
npm run build
```

---

## 📐 Architecture

### Multi-Tenancy Model
QuantPOS uses a **shared-schema, row-level isolation** approach:

- **Tenant context** – Set per request in `JwtFilter` via ThreadLocal
- **Hibernate filters** – `@FilterDef` on User entity enforces `tenant_id` predicate
- **Row-level security** – Every query automatically scoped to the requesting tenant
- **Super admin bypass** – `SUPER_ADMIN` role circumvents the filter for ops/debugging

### Database Schema
- **Tenants** – Organization records with GST details and financial year start
- **Users** – Login credentials, 2FA state, role assignments (filtered by tenant)
- **Subscriptions** – Stripe subscription links with terminal count limits
- **Products** – Both STANDARD and LOOSE types with variants
- **Inventory** – Stock levels, barcode mappings, transaction audit trail
- **Sales** – Point-of-sale transactions with per-item product snapshots (for compliance)
- **Roles & Permissions** – RBAC matrix with team invitations
- **Audit Logs** – Complete event history for all mutations

See [`src/main/resources/db/migration/`](backend/src/main/resources/db/migration/) for all 13 Flyway migrations.

### Authentication Flow
1. User submits email + password
2. System validates credentials and sends 6-digit OTP
3. User enters OTP in email input screen (6 boxes)
4. System issues JWT + refresh token
5. JWT refreshes via HTTP-only refresh token with replay detection
6. Session invalidation via Redis `invalidate_before` timestamp

---

## 📦 Project Structure

```
quantpos/
├── backend/
│   ├── src/main/java/com/quantpos/
│   │   ├── auth/          # Login, OTP, JWT, 2FA
│   │   ├── billing/       # Stripe webhooks, subscriptions
│   │   ├── product/       # Product & inventory models
│   │   ├── sales/         # POS and receipt logic
│   │   ├── tenant/        # Multi-tenancy context & filtering
│   │   ├── user/          # User & RBAC
│   │   └── common/        # Exception handling, filters, config
│   ├── src/main/resources/
│   │   ├── db/migration/  # 13 Flyway migrations (V1–V13)
│   │   ├── application.yml
│   │   └── application-local.yml
│   ├── pom.xml
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Route pages (Dashboard, POS, Inventory, etc.)
│   │   ├── hooks/         # useAuth, useQuery, useCart, etc.
│   │   ├── store/         # Zustand stores (auth, pos, cart)
│   │   ├── api/           # Fetch utilities & endpoints
│   │   ├── styles/        # Global Tailwind config
│   │   └── App.jsx        # Main router
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml
├── .env.example
└── README.md (this file)
```

---

## 🔄 Development Workflow

### Phase-Based Roadmap
QuantPOS is built in 10 phases, each with full test coverage and sign-off before advancing.

- **Phase 1** ✅ Auth & OTP (complete)
- **Phase 2** 🔄 Stripe Billing (in progress)
- **Phase 3** 📋 Inventory Management (architecture finalized, not yet coded)
- **Phases 4–10** – Reporting, Analytics, AI Restocking, Loyalty, Suppliers, etc.

### Code Style & Conventions
- **Backend** – Java with Spring conventions; `@Component`, `@Service`, `@Repository` for DI
- **Frontend** – Functional React with hooks; Tailwind utility classes; Zustand for state
- **Naming** – English, camelCase for variables/methods, PascalCase for classes
- **Database** – snake_case table/column names, UUID primary keys, JSONB for flexible data

### Testing
- **Backend** – JUnit 5 + Mockito for unit tests; testcontainers for integration tests
- **Frontend** – Vitest + React Testing Library for component tests
- **Manual** – Postman collection for API endpoints; Stripe webhook testing with CLI

### Before You Push
1. Run tests locally: `mvn test` (backend) and `npm test` (frontend)
2. Check linting: `npm run lint` (frontend)
3. Create a feature branch: `git checkout -b feature/your-feature`
4. Commit with clear messages: `git commit -m "feat: add loose product weight input"`
5. Open a pull request with a link to the related GitHub issue

---

## 🔐 Security & Compliance

### Authentication
- JWT tokens with 1-hour expiry
- Refresh tokens stored in HTTP-only cookies
- Replay attack detection via `invalidate_before` timestamp
- Rate limiting on login and OTP endpoints (5 attempts, then 1-hour lockout)

### Data Protection
- Encrypted password hashing (bcrypt)
- Tenant-scoped row-level security at the database level
- All financial amounts stored as integers (paise, not rupees) to avoid floating-point errors
- Audit logs for all mutations (user, timestamp, change summary)

### Indian Compliance
- **GST** – HSN-based product classification; CGST/SGST split calculation
- **Financial Year** – Configurable per tenant (default: April 1 – March 31)
- **PAN/GSTIN** – Captured in tenant setup for reporting

---

## 🌐 Deployment

### Docker Compose (Local/Staging)
```bash
docker-compose -f docker-compose.yml up -d
```

### Cloud Deployment (AWS/GCP/Azure)
1. Build backend image: `docker build -t quantpos-backend:latest ./backend`
2. Build frontend image: `docker build -t quantpos-frontend:latest ./frontend`
3. Push to your container registry
4. Deploy via Kubernetes, ECS, App Engine, or similar
5. Set environment variables for production (DB, Redis, Stripe keys, JWT secret)

### Environment Variables
See `.env.example` for all required variables:
```bash
# Database
SPRING_DATASOURCE_URL=jdbc:postgresql://prod-db:5432/quantpos_db
SPRING_DATASOURCE_USERNAME=quantpos_user
SPRING_DATASOURCE_PASSWORD=<secure-password>

# Redis
SPRING_REDIS_HOST=prod-redis
SPRING_REDIS_PORT=6379

# Auth & Security
JWT_SECRET=<long-random-key>
JWT_EXPIRATION_MS=3600000

# Stripe
STRIPE_API_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_live_...

# Frontend
VITE_API_URL=https://api.quantpos.in
```

---

## 📊 Monitoring

### Prometheus Metrics
QuantPOS exposes metrics at `http://localhost:8080/actuator/prometheus`:
- JVM heap, GC, thread pool
- HTTP request latency, error rates
- Database connection pool usage
- Redis cache hit/miss ratios
- Custom business metrics (transactions/min, avg cart value, etc.)

### Grafana Dashboards
Pre-built dashboards in `monitoring/grafana/dashboards/`:
- **System Health** – JVM, CPU, memory, disk
- **Business Metrics** – Revenue, transactions, avg ticket
- **Errors & Alerts** – Failed requests, DB timeouts, payment failures

Access Grafana at `http://localhost:3000` (default: admin/admin).

---

## 🐛 Known Issues & Roadmap

### Current Phase 2 Gaps
- ❌ Checkout session creation endpoint not yet implemented
- ❌ Billing portal endpoint missing
- ❌ Frontend billing/subscription pages show placeholder
- ❌ `PaymentEvent.amount_cents` DB constraint will fail on zero initialization (needs fix)
- ❌ `Subscription` Java entity/repo/service not yet created

### Planned Improvements (Phases 3–10)
- Low-stock & out-of-stock alerts
- AI-driven restocking recommendations
- Multi-location inventory sync
- Loyalty program & customer analytics
- Supplier PO & purchase order management
- Tax filing automation
- Mobile app (React Native)

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repo** and create a feature branch
2. **Check existing issues** – look for `good-first-issue` or `help-wanted` labels
3. **Follow the code style** – use the conventions above
4. **Write tests** – aim for >80% coverage on new code
5. **Document changes** – update this README if adding features or changing architecture
6. **Open a PR** – describe your changes and link any related issues

### Reporting Issues
- Use clear, descriptive titles
- Include steps to reproduce
- Attach logs, screenshots, or curl commands for API issues
- Tag with `bug`, `feature`, or `question`

---

## 📚 Documentation

- **[App Flow & User Journeys](docs/APP_FLOW.md)** – End-to-end flows (login, POS, inventory)
- **[Technical Requirements Document (TRD)](docs/TRD.md)** – Detailed architecture & database schema
- **[Product Requirements Document (PRD)](docs/PRD.md)** – Feature specifications & acceptance criteria
- **[API Reference](docs/API.md)** – Endpoint documentation with curl examples
- **[Database Migrations](backend/src/main/resources/db/migration/)** – Flyway migration history

---

## 📞 Support

- **Issues & Bugs** – GitHub Issues (preferred)
- **Discussions** – GitHub Discussions for questions & feature ideas
- **Email** – support@quantpos.in
- **Documentation** – Check the `/docs` folder first

---

## 📜 License

QuantPOS is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

## 🎯 Why QuantPOS?

Built by an Indian developer for Indian merchants. QuantPOS eliminates the friction of traditional POS:

- **GST is baked in**, not bolted on
- **Loose products** (dal, rice, spices) work natively
- **Weighing scales** integrate without custom hardware
- **Multi-terminal** scaling without re-architecture
- **Stripe payments** ready for Indian merchants
- **Open source** – extend it for your unique business

Start free, upgrade as you grow.

---

**Questions? Open an issue or start a discussion. Happy selling! 🚀**
