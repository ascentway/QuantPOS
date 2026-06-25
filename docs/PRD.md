# QuantPOS  Product Requirements Document (PRD)

**Version:** 1.0  
**Date:** January 2024  
**Status:** Active Development (Phase 1 Complete)  
**Product Manager:** Development Team  
**Target Release:** Q2 2024

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Product Vision & Goals](#product-vision--goals)
3. [Market & User Analysis](#market--user-analysis)
4. [Product Overview](#product-overview)
5. [Feature Specifications by Phase](#feature-specifications-by-phase)
6. [User Stories & Acceptance Criteria](#user-stories--acceptance-criteria)
7. [Technical Requirements](#technical-requirements)
8. [Non-Functional Requirements](#non-functional-requirements)
9. [Constraints & Assumptions](#constraints--assumptions)
10. [Success Metrics & KPIs](#success-metrics--kpis)
11. [Roadmap & Timeline](#roadmap--timeline)
12. [Appendix](#appendix)

---

## Executive Summary

### Problem Statement

Small to medium-sized independent retail stores and food & beverage establishments face significant operational challenges:

- **No unified system**  Inventory, sales, and accounting scattered across multiple disconnected tools
- **High upfront cost**  Traditional POS systems require expensive hardware and on-premise infrastructure
- **Manual inventory management**  Labor-intensive stock tracking and restocking decisions based on gut feeling
- **No data-driven insights**  Lack of analytics makes it hard to understand business trends and customer behavior
- **Limited scalability**  Growing businesses quickly outgrow their systems, requiring expensive migrations
- **Cash flow inefficiency**  No real-time visibility into sales, inventory value, and revenue trends

### Solution

**QuantPOS** is a cloud-based, multi-tenant SaaS platform that provides:

- **Unified business management**  Single dashboard for sales, inventory, and analytics
- **Zero hardware investment**  Works on any browser, smartphone, or tablet
- **AI-powered inventory optimization**  Predictive restocking based on sales patterns
- **Real-time analytics**  Instant insights into revenue, product performance, and inventory health
- **Flexible scaling**  Pay per POS terminal, scale up or down anytime
- **Enterprise-grade security**  Complete data isolation between businesses, encryption at rest and in transit

### Target Market

**Primary:** Independent retail stores, quick-service restaurants, cafes, bakeries, grocery stores across India and globally  
**Secondary:** Multi-location chains wanting a cloud-native alternative to legacy POS systems  
**Tertiary:** Retailers migrating from spreadsheet-based inventory management

### Business Model

**Subscription SaaS (Recurring Revenue)**
- Tiered pricing based on number of POS terminals
- Monthly or annual payment via Stripe
- Free trial available for first 14 days
- No long-term contracts, cancel anytime

### Success Criteria (Year 1)

- 500+ businesses using the platform
- 50,000+ transactions per month
- 95%+ uptime and system reliability
- NPS (Net Promoter Score) ≥ 50
- Customer retention rate ≥ 85%
- Monthly recurring revenue (MRR) ≥ $50,000

---

## Product Vision & Goals

### Vision Statement

*"Empower independent businesses worldwide with enterprise-grade commerce and operations tools, accessible from any device, at a fraction of traditional costs."*

### Long-term Goals (18-24 months)

1. **Become the #1 cloud POS platform for SMBs in India and Southeast Asia**
   - 10,000+ businesses
   - Recognized as the standard for modern retail

2. **Enable business growth through intelligent automation**
   - AI handles routine inventory decisions
   - Owners focus on growth and customer experience
   - Reduce inventory carrying costs by 15-20% on average

3. **Build a thriving app ecosystem**
   - Third-party integrations (accounting, loyalty, CRM)
   - App marketplace with approved partners
   - Revenue sharing model for developers

4. **Expand internationally**
   - Launch in Southeast Asia (Thailand, Vietnam, Philippines)
   - Localization for regional compliance (GST, local payment methods)
   - Multi-language support (English, Hindi, Thai, Vietnamese)

### Product Goals (Year 1)

| Goal | Target | Metric |
|------|--------|--------|
| Acquisition | 500 businesses | Cumulative signups |
| Activation | 80% of signups complete setup | Activation rate |
| Adoption | 100+ sales per business/month | Avg. transactions |
| Retention | 85% after 12 months | Churn rate ≤15% |
| Revenue | $50K MRR | Recurring revenue |
| Satisfaction | NPS ≥ 50 | Customer feedback |
| Reliability | 99.9% uptime | System availability |

---

## Market & User Analysis

### Market Size & Opportunity

**Total Addressable Market (TAM):**
- India: 7+ million retail businesses
- Global: 40+ million small retail businesses
- Average POS system cost: $500-2000/year per business
- Potential market value: $20+ billion annually

**Serviceable Addressable Market (SAM):**
- Retail and F&B businesses in Tier 1-2 Indian cities
- 500,000+ potential customers
- Target market value: $500+ million

**Serviceable Obtainable Market (SOM):**
- Year 1: 500 businesses × $300 avg. annual value = $150K
- Year 3: 5,000 businesses × $400 avg. annual value = $2M
- Year 5: 20,000 businesses × $500 avg. annual value = $10M

### User Personas

#### Persona 1: "Sharma Ji"  Store Owner (Primary)

**Demographics:**
- Age: 35-55 years
- Education: High school to college
- Tech savviness: Medium (WhatsApp, basic email)
- Location: Tier 1-2 Indian cities

**Goals:**
- Grow business profitably
- Reduce stock outs and overstocking
- Understand which products sell best
- Manage staff effectively
- Save time on manual accounting

**Pain Points:**
- Manual inventory counts are time-consuming
- Cannot see real-time sales data
- Loses sales due to stockouts
- Overstocks on slow-moving items
- Difficulty tracking cashier accuracy
- Overwhelmed by accounting paperwork

**Technology Level:**
- Uses smartphone daily
- Comfortable with apps
- May struggle with complex software
- Prefers call/WhatsApp support over tickets

**Success Criteria:**
- Implements system within 1 week
- Uses dashboard daily
- Sees inventory optimization within 30 days
- Stays as a customer for 24+ months

---

#### Persona 2: "Ravi"  Store Manager

**Demographics:**
- Age: 25-35 years
- Education: College educated
- Tech savviness: High (comfortable with software)
- Location: Same as store owner

**Goals:**
- Efficiently manage daily operations
- Monitor staff and terminals
- Access reports when needed
- Streamline inventory checks

**Pain Points:**
- Cannot see full picture of sales in real-time
- Manual inventory reconciliation is tedious
- No insight into staff performance
- Cannot respond quickly to stock shortages

**Technology Level:**
- Uses multiple apps and software
- Comfortable learning new tools
- Prefers self-service knowledge base
- Wants mobile access to critical functions

**Success Criteria:**
- Completes training within 2 hours
- Uses system 3+ times daily
- Reduces inventory discrepancies by 50%
- Recommends system to other managers

---

#### Persona 3: "Priya"  Cashier/POS Operator

**Demographics:**
- Age: 18-30 years
- Education: High school to college
- Tech savviness: High (smartphone native)
- Location: Store location

**Goals:**
- Process sales quickly and accurately
- Understand cart totals at a glance
- Apply discounts and payments without confusion
- Stay focused on customer service

**Pain Points:**
- Slow/clunky POS interfaces
- Confusing discount and tax calculations
- Cannot find products easily
- Complicated refund/return processes

**Technology Level:**
- Smartphone expert
- Expects intuitive interfaces
- Learns quickly from UI examples
- Prefers in-person training

**Success Criteria:**
- Processes sales 20% faster than old system
- Zero transaction errors after 1 week
- Positive feedback from customers
- Stays in role for 12+ months

---

### User Journey Map

```
PHASE 1: AWARENESS & CONSIDERATION
  ↓
Sharma reads about QuantPOS on Facebook/Google
  ↓
Clicks ad or searches "cloud POS for retail"
  ↓
Lands on landing page, reads features and pricing
  ↓
Impressed by easy setup and affordability vs competitors
  ↓
Clicks "Get Started Free"

PHASE 2: REGISTRATION & ONBOARDING
  ↓
Fills registration form (5 minutes)
  ↓
Receives verification email, clicks link
  ↓
Selects subscription plan (1 terminal = $9/month)
  ↓
Redirected to Stripe checkout, completes payment
  ↓
Subscription activated, dashboard opens
  ↓
Guided tour shows main features (product catalog, POS, reports)

PHASE 3: SETUP
  ↓
Adds first 5-10 products (names, prices, quantities)
  ↓
Invites Ravi (manager) to team
  ↓
Tests first sale with dummy transaction
  ↓
Prints test receipt to verify

PHASE 4: ACTIVE USE
  ↓
Priya starts using POS terminal for real sales
  ↓
Ravi checks dashboard each morning for overnight sales
  ↓
Sharma reviews weekly sales report
  ↓
AI agent generates restocking suggestions (day 7)
  ↓
Sharma orders inventory based on AI recommendations

PHASE 5: OPTIMIZATION
  ↓
Sees 15% reduction in stockouts
  ↓
Sees 10% improvement in sales accuracy
  ↓
Saves 5 hours/week on inventory counting
  ↓
Upgrades to 3 terminals to expand to 2 locations
  ↓
Renews subscription (churned customers drop here)

PHASE 6: ADVOCACY
  ↓
Sharma recommends to fellow store owners
  ↓
Leaves positive review on Google/Facebook
  ↓
Stays as long-term customer (target: 24+ months)
```

---

## Product Overview

### Core Value Propositions

| Value | Benefit | Proof |
|-------|---------|-------|
| **Simplicity** | Setup in minutes, no IT team needed | Free trial, no credit card required initially |
| **Affordability** | $9/month per terminal vs $500-2000/year for hardware | Transparent pricing, pay-as-you-grow model |
| **Intelligence** | AI predicts what to order, reduces stockouts by 40% | Proprietary demand forecasting engine |
| **Real-time visibility** | Know sales numbers instantly, not at end of day | Live dashboard, instant reporting |
| **Reliability** | 99.9% uptime SLA, data backed up every hour | AWS infrastructure, redundant systems |
| **Security** | Bank-level encryption, complete data isolation | SOC 2 compliant, annual security audits |

### Key Features Overview

| Feature | Phase | Category | User Benefit |
|---------|-------|----------|---|
| Secure Authentication | 1 | Foundation | Only you see your data |
| Multi-tenant Architecture | 1 | Foundation | Cost-efficient, reliable infrastructure |
| Role-based Access | 1 | Security | Different permissions for different staff |
| Email Verification | 1 | Security | Prevents account takeover |
| Password Reset | 1 | UX | Self-service account recovery |
| Stripe Billing | 2 | Monetization | Automatic recurring billing |
| Subscription Management | 2 | SaaS | Upgrade/downgrade anytime |
| Billing Portal | 2 | UX | Self-serve invoice and payment history |
| Product Catalog | 3 | Operations | Centralized product database |
| Inventory Tracking | 3 | Operations | Real-time stock levels |
| Low Stock Alerts | 3 | Operations | Notification when items run low |
| POS Terminal | 4 | Core | Fast, intuitive checkout |
| Sales Dashboard | 5 | Analytics | Understand what's selling |
| AI Restocking Agent | 6 | Intelligence | Automatic purchase order generation |
| Team Management | 7 | Scaling | Invite staff with specific permissions |
| Mobile Support | 9 | Expansion | Use on any device |
| Multi-location | 7+ | Scaling | Manage multiple stores from one account |
| Integrations | 10 | Ecosystem | Connect accounting, loyalty, etc. |

---

## Feature Specifications by Phase

### Phase 1: Authentication & Multi-Tenancy ✅ COMPLETE

**Duration:** 4 weeks  
**Status:** Complete and tested  
**Owner:** Backend Team

#### Feature 1.1: User Registration

**Description:** New businesses sign up and create an owner account.

**User Story:**
```
As a retail business owner,
I want to sign up for QuantPOS with my business details,
So that I can start managing my store immediately.
```

**Requirements:**

1. **Registration Form**
   - Business name (required, max 255 chars)
   - Business type (required, Retail or F&B dropdown)
   - Owner full name (required)
   - Email (required, must be unique globally)
   - Phone number (required, 10-digit format)
   - Password (required, min 8 chars, must include uppercase, number, special char)
   - Address (required, split into street, city, state, pincode)
   - GSTIN (optional, validated if provided)

2. **Validation Rules**
   - Email uniqueness enforced at database level
   - Phone number format: Indian format 10 digits
   - Password strength: minimum 8 characters, must contain at least:
     - 1 uppercase letter
     - 1 lowercase letter
     - 1 number
     - 1 special character
   - Address fields must not be empty
   - GSTIN format (if provided): Must match GST registration format

3. **Success Flow**
   - Tenant created in database (INACTIVE status initially)
   - Owner user created (email_verified = false)
   - Email verification token generated and stored in Redis (24hr TTL)
   - Verification email sent via Brevo SMTP
   - User redirected to "Check your email" page
   - Response: `{ success: true, message: "Registration successful. Check your email." }`

4. **Error Handling**
   - Duplicate email: `{ success: false, error: "Email already registered" }`
   - Invalid format: `{ success: false, error: "Validation failed: [field errors]" }`
   - Server error: `{ success: false, error: "Something went wrong. Please try again." }`

**Acceptance Criteria:**
- [ ] User can register with all required fields
- [ ] Email verification token sent within 5 seconds
- [ ] Duplicate email prevented with clear error message
- [ ] Password strength validated client and server side
- [ ] Tenant and User created atomically (both succeed or both fail)
- [ ] Response time < 2 seconds for successful registration
- [ ] Form accessible on mobile and desktop

---

#### Feature 1.2: Email Verification

**Description:** User verifies email address via link in verification email.

**User Story:**
```
As a new user,
I want to verify my email address,
So that I can confirm account ownership and complete setup.
```

**Requirements:**

1. **Verification Email**
   - Subject: "Verify your email  QuantPOS"
   - Body: Plain text with verification link
   - Link format: `https://QuantPOS.com/verify-email?token={UUID}`
   - Expires: 24 hours after generation
   - Sender: "QuantPOS <acc72c001@smtp-brevo.com>"

2. **Verification Flow**
   - User clicks link in email
   - Frontend extracts token from URL query parameter
   - Calls `GET /api/auth/verify-email?token={token}`
   - Backend validates token in Redis
   - If valid: token deleted from Redis, `user.is_email_verified = true`
   - User receives welcome email
   - Frontend shows: "Email verified! You can now log in."

3. **Error Cases**
   - Token expired: "Link expired. Click here to resend."
   - Token already used: "Link already used. Click here to resend."
   - Invalid token: "Invalid verification link. Click here to resend."

4. **Resend Verification Email**
   - Frontend provides "Resend verification email" button on verify page
   - Calls `POST /api/auth/resend-verification-email`
   - Generates new token, invalidates old token
   - Sends new email, user can click new link

**Acceptance Criteria:**
- [ ] Email arrives within 5 seconds of registration
- [ ] Link works for exactly 24 hours
- [ ] Link works only once (single-use)
- [ ] Successful verification allows login
- [ ] Resend generates fresh token and email
- [ ] User cannot use platform features until verified
- [ ] Token not visible in URL after verification

---

#### Feature 1.3: User Login

**Description:** Registered users log in with email and password.

**User Story:**
```
As a registered user,
I want to log in with my email and password,
So that I can access my business dashboard and manage operations.
```

**Requirements:**

1. **Login Form**
   - Email field (required, validated format)
   - Password field (required, masked input)
   - "Remember me" checkbox (optional, for future implementation)
   - "Forgot password?" link
   - "Sign up" link for new users

2. **Login Validation**
   - Email exists in database
   - Email is verified (is_email_verified = true)
   - Account is active (is_active = true)
   - Tenant is active (is_active = true)
   - Password matches BCrypt hash
   - If subscription is INACTIVE, still allow login but show banner: "Activate your subscription to start using POS terminal"

3. **Success Flow**
   - Update `user.last_login_at = now()`
   - Generate access token (JWT, 15 minutes, HS256)
   - Generate refresh token (UUID, stored in Redis, 7 days)
   - Return both tokens + user info in response
   - Frontend stores access token in memory, refresh token in memory (NOT localStorage)
   - Redirect to dashboard

4. **Response Format**
   ```json
   {
     "success": true,
     "message": "Login successful",
     "data": {
       "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
       "refreshToken": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
       "user": {
         "id": "user-uuid",
         "email": "owner@business.com",
         "fullName": "Sharma",
         "role": "OWNER",
         "tenantId": "tenant-uuid",
         "businessName": "Sharma Store"
       }
     }
   }
   ```

5. **Error Handling**
   - Invalid credentials: "Email or password is incorrect" (same message for both cases, prevents email enumeration)
   - Email not verified: "Please verify your email before logging in"
   - Account inactive: "Your account has been deactivated. Contact support."
   - Tenant inactive: "Your business account has been suspended."
   - Response time: < 1 second

**Acceptance Criteria:**
- [ ] User can log in with correct credentials
- [ ] Error messages do not reveal if email exists (security)
- [ ] Unverified emails cannot log in
- [ ] Inactive accounts cannot log in
- [ ] Access token expires in exactly 15 minutes
- [ ] Refresh token valid for 7 days
- [ ] last_login_at timestamp updated on each successful login
- [ ] Login works on mobile and desktop

---

#### Feature 1.4: JWT Token Management

**Description:** Secure token-based authentication with automatic silent refresh.

**User Story:**
```
As a user,
I want my session to remain active without re-entering credentials,
So that I have a seamless experience even if my access token expires.
```

**Requirements:**

1. **Access Token (JWT)**
   - Algorithm: HS256
   - Lifespan: 15 minutes
   - Payload:
     ```json
     {
       "sub": "user-uuid",
       "tenantId": "tenant-uuid",
       "role": "OWNER|MANAGER|CASHIER|SUPER_ADMIN",
       "email": "user@example.com",
       "businessName": "Business Name",
       "iat": 1705318200,
       "exp": 1705319100
     }
     ```
   - Signature verification: HMACSHA256(payload, JWT_SECRET)
   - Stored: Frontend memory only (never localStorage)
   - Sent: Every API request in `Authorization: Bearer {token}` header

2. **Refresh Token**
   - Format: Random UUID string
   - Lifespan: 7 days
   - Storage: Redis with key pattern `refresh_token:{token}` and value `{userId}`
   - TTL: 604800 seconds (7 days)
   - Single-use: Old token deleted when used to get new token
   - Rotation: Every refresh generates new token, invalidates old token

3. **Silent Token Refresh**
   - Axios interceptor catches 401 responses
   - Calls `POST /api/auth/refresh` with refresh token
   - Backend validates refresh token in Redis
   - If valid: generates new access token and new refresh token
   - Updates store with new tokens
   - Retries original request with new access token
   - If invalid: deletes from store, redirects to login

4. **Token Verification Flow**
   - Every protected endpoint checks JWT signature
   - If signature invalid: 401 "Invalid token"
   - If expired: 401 "Token expired"
   - If tenantId cannot be extracted: 401 "Unauthorized"
   - If role insufficient for endpoint: 403 "Forbidden"

5. **Token Endpoint Response**
   ```json
   {
     "success": true,
     "data": {
       "accessToken": "new-jwt-token",
       "refreshToken": "new-uuid-token"
     }
   }
   ```

**Acceptance Criteria:**
- [ ] Access token signed with HS256
- [ ] Signature verified on every protected request
- [ ] Refresh token rotated on each use
- [ ] Old refresh token invalidated after rotation
- [ ] Silent refresh works without user intervention
- [ ] Refresh response is < 100ms
- [ ] Tokens cannot be used after logout
- [ ] Token claims extracted correctly for tenantId and role

---

#### Feature 1.5: Password Management

**Description:** Users can change password and reset forgotten passwords.

**User Story (Change Password):**
```
As a logged-in user,
I want to change my password,
So that I can keep my account secure.
```

**Requirements:**

1. **Change Password Flow (Authenticated)**
   - Endpoint: `PUT /api/auth/change-password`
   - Auth required: Yes (must be logged in)
   - Request body:
     ```json
     {
       "currentPassword": "oldPassword123!",
       "newPassword": "newPassword456!"
     }
     ```
   - Validation:
     - Current password must match BCrypt hash in database
     - New password must meet strength requirements (8+ chars, upper, lower, number, special)
     - New password cannot be same as old password
   - Success: 
     - Update `user.password_hash` with BCrypt of new password
     - **Invalidate all refresh tokens for this user** (force all sessions to log out)
     - Send "Password changed" email
     - Return: `{ success: true, message: "Password changed successfully. Please log in again." }`
   - Error:
     - Wrong current password: "Current password is incorrect"

2. **Forgot Password Flow (Unauthenticated)**
   - Endpoint: `POST /api/auth/forgot-password`
   - Auth required: No
   - Request body: `{ "email": "user@example.com" }`
   - **Always return same success message regardless of email existence** (prevent enumeration):
     ```json
     {
       "success": true,
       "message": "If an account exists with this email, a reset link has been sent."
     }
     ```
   - If email exists:
     - Generate password reset token (UUID)
     - Store in Redis: `password_reset:{token}` → `{userId}`
     - TTL: 3600 seconds (1 hour)
     - Send reset email with link: `https://QuantPOS.com/reset-password?token={token}`
   - If email doesn't exist: No action, same success message returned
   - Email template:
     ```
     Subject: Reset your QuantPOS password
     Body: Click link below to reset password (expires in 1 hour)
     [Reset Password Link]
     ```

3. **Reset Password Flow**
   - User clicks link from email
   - Frontend extracts token from URL
   - Page shows: "Enter your new password"
   - User submits new password
   - Endpoint: `POST /api/auth/reset-password`
   - Request body:
     ```json
     {
       "token": "uuid-from-email",
       "newPassword": "newPassword123!"
     }
     ```
   - Validation:
     - Token exists in Redis and not expired
     - New password meets strength requirements
   - Success:
     - Token deleted from Redis (single-use)
     - Update `user.password_hash`
     - Invalidate all refresh tokens for user
     - Return: `{ success: true, message: "Password reset successfully. Please log in." }`
   - Error:
     - Invalid token: "Reset link is invalid or has expired"
     - Expired token: "Reset link has expired. Request a new one."

**Acceptance Criteria:**
- [ ] Current password must be correct to change password
- [ ] New password validated for strength
- [ ] Password changed invalidates all sessions
- [ ] Reset email sent within 5 seconds
- [ ] Reset link works for 1 hour exactly
- [ ] Reset token is single-use (cannot be reused)
- [ ] Both flows return success messages regardless of email existence
- [ ] Reset password available on public pages (no login needed)

---

#### Feature 1.6: Multi-Tenancy Isolation

**Description:** Complete data isolation between businesses at the database and application layer.

**Technical Requirements:**

1. **Database Level**
   - Every business table has `tenant_id UUID FK` column
   - Foreign key constraint: `REFERENCES tenants(id) ON DELETE CASCADE`
   - Index on `tenant_id` for fast filtering
   - No table contains data from multiple tenants in the same row

2. **Application Layer (Hibernate Filter)**
   - TenantContext ThreadLocal stores current `tenantId` per request
   - JwtFilter extracts tenantId from JWT and sets TenantContext
   - Hibernate filter automatically appends `WHERE tenant_id = ?` to all queries
   - Manual queries must include tenant filter or code review catches it
   - After response, TenantContext cleared to prevent memory leaks

3. **Enforcement Rules**
   - No query returns data without tenant filter
   - No API endpoint returns another tenant's data
   - No user can see data from tenant they don't belong to
   - Service layer NEVER accepts tenant_id from request body (always from JWT)

4. **Test Case: Data Isolation**
   ```
   Setup:
     - Tenant A registered with user_a@tenant-a.com
     - Tenant B registered with user_b@tenant-b.com
   
   Test 1: Login as Tenant A
     - GET /api/tenant/profile → returns only Tenant A data ✓
   
   Test 2: Login as Tenant B
     - GET /api/tenant/profile → returns only Tenant B data ✓
   
   Test 3: Tenant A tries to access Tenant B
     - Manually call API with Tenant A token
     - GET /api/admin/tenants/tenant-b-id → 403 Forbidden ✓
   
   Test 4: Shared database verification
     - Both tenants in same PostgreSQL database
     - But queries return different rows based on tenant_id
   ```

**Acceptance Criteria:**
- [ ] Every business table has tenant_id column with index
- [ ] Hibernate filter active and testable
- [ ] TenantContext thread-safe
- [ ] No cross-tenant data leakage in any scenario
- [ ] Deleted business cascade deletes all related data
- [ ] Manual SQL queries caught in code review

---

#### Feature 1.7: Role-Based Access Control (RBAC)

**Description:** Four distinct roles with granular permission enforcement.

**Requirements:**

1. **Role Definitions**
   
   **SUPER_ADMIN**
   - Access: Platform-wide admin functions
   - Permissions:
     - View all tenants
     - View all users
     - Deactivate/reactivate tenants
     - Manage subscription status
     - View system health and logs
   - Cannot: Access business data (sales, products, etc.)
   - UI: Hidden "Admin Console" panel

   **OWNER**
   - Access: Everything related to their business
   - Permissions:
     - View/edit business profile
     - Manage team members (invite/remove)
     - View all reports and analytics
     - Manage product catalog
     - View all sales and transactions
     - Access billing and subscription management
     - Configure POS terminals
     - Trigger AI restocking agent
   - Cannot: Nothing (full access to business data)
   - UI: Full dashboard with all menus

   **MANAGER**
   - Access: Day-to-day operations
   - Permissions:
     - View business profile (read-only)
     - View reports and analytics
     - Manage inventory (add stock, adjust quantities)
     - View all sales
     - Operate POS terminal
     - Trigger AI restocking agent
   - Cannot: Edit business settings, manage users, access billing
   - UI: Dashboard minus Settings and Billing tabs

   **CASHIER**
   - Access: Only POS terminal
   - Permissions:
     - Operate POS terminal (create sales)
     - View product list
     - View own transactions
   - Cannot: View reports, access settings, manage inventory, manage users
   - UI: Only POS Terminal page (full screen optimized for counter use)

2. **Permission Enforcement Mechanism**
   - Method-level with `@PreAuthorize("hasRole('OWNER')")`
   - Example:
     ```java
     @PutMapping("/profile")
     @PreAuthorize("hasRole('OWNER')")
     public ResponseEntity<ApiResponse<TenantDto>> updateProfile(...) {
       // Only OWNER can reach this code
     }
     ```
   - All protected endpoints checked before controller method executes
   - 403 Forbidden returned if role insufficient

3. **Permission Matrix**
   | Action | SUPER_ADMIN | OWNER | MANAGER | CASHIER |
   |--------|:-:|:-:|:-:|:-:|
   | View own profile | ✓ | ✓ | ✓ | ✓ |
   | Change own password | ✓ | ✓ | ✓ | ✓ |
   | View business profile | ✗ | ✓ | ✓ | ✗ |
   | Edit business profile | ✗ | ✓ | ✗ | ✗ |
   | Manage team members | ✗ | ✓ | ✗ | ✗ |
   | View reports | ✗ | ✓ | ✓ | ✗ |
   | Manage inventory | ✗ | ✓ | ✓ | ✗ |
   | View sales | ✗ | ✓ | ✓ | ✓* |
   | Operate POS | ✗ | ✓ | ✓ | ✓ |
   | Access billing | ✗ | ✓ | ✗ | ✗ |
   | View all tenants | ✓ | ✗ | ✗ | ✗ |
   
   *Cashier can only see their own sales

4. **Frontend Role-Based UI**
   - Routes protected via RoleGuard component
   - Insufficient role redirects to 403 page
   - Menu items hidden based on role
   - Frontend guarding is UX only  backend is real security

**Acceptance Criteria:**
- [ ] Each role can only access assigned features
- [ ] Non-owner cannot edit business settings
- [ ] Cashier cannot see reports or team management
- [ ] SUPER_ADMIN cannot see business data
- [ ] Permission check happens before code execution
- [ ] 403 returned on insufficient permissions
- [ ] Permissions tested in integration tests

---

#### Feature 1.8: User Profile & Account Settings

**Description:** Users can view and manage their personal account information.

**User Story:**
```
As a user,
I want to view and update my personal profile,
So that my account information is accurate and current.
```

**Requirements:**

1. **View Profile Endpoint**
   - Endpoint: `GET /api/auth/me`
   - Auth required: Yes
   - Returns:
     ```json
     {
       "success": true,
       "data": {
         "user": {
           "id": "user-uuid",
           "email": "owner@business.com",
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
           "gstin": null,
           "address": {
             "street": "123 Market St",
             "city": "Mumbai",
             "state": "Maharashtra",
             "pincode": "400001"
           },
           "currency": "INR",
           "timezone": "Asia/Kolkata",
           "subscriptionStatus": "ACTIVE"
         }
       }
     }
     ```

2. **Profile UI Components**
   - Display user email (read-only)
   - Display full name (read-only on this page, editable in owner settings)
   - Display role badge (OWNER, MANAGER, CASHIER)
   - Display last login timestamp
   - Display account creation date
   - Change password button → opens change password form
   - Logout button

3. **Security Notes**
   - Email cannot be changed (prevent fraud)
   - Full name is not editable from profile page
   - Only user's own data visible (no editing other users' profiles)

**Acceptance Criteria:**
- [ ] User can view their profile
- [ ] All required fields displayed
- [ ] Email shown as read-only
- [ ] Last login timestamp accurate
- [ ] Change password accessible from profile page
- [ ] User can only view their own profile (not others')

---

### Phase 2: Stripe Subscription Billing 🔄 IN PROGRESS

**Duration:** 4 weeks  
**Status:** Planning & Development  
**Owner:** Backend & Frontend Team

#### Feature 2.1: Subscription Plans

**Description:** Three tiered subscription plans for different business sizes.

**Requirements:**

1. **Plan Tiers**
   
   **Starter Plan**
   - Price: $9.00/month (or ₹750/month for India)
   - Terminals included: 1
   - Features: All Phase 1 + 3 + 4 features
   - Ideal for: Single-location small stores
   - Stripe Product ID: `prod_xxxx`
   - Price ID: `price_xxxx`

   **Growth Plan**
   - Price: $19.00/month (or ₹1500/month)
   - Terminals included: 3
   - Features: Everything in Starter + priority support
   - Ideal for: Expanding stores, 3 locations
   - Stripe Product ID: `prod_yyyy`
   - Price ID: `price_yyyy`

   **Enterprise Plan**
   - Price: $49.00/month (or ₹4000/month)
   - Terminals included: 10
   - Features: Everything + dedicated account manager
   - Ideal for: Chains, large stores, 10+ locations
   - Stripe Product ID: `prod_zzzz`
   - Price ID: `price_zzzz`

2. **Plan Selection UI**
   - Three price cards on pricing page
   - Display: Plan name, price, terminals included, features list
   - "Select Plan" button per card
   - Shows current plan with checkmark if subscribed
   - Comparison table showing feature differences

3. **Database Storage**
   - Plans stored as constants in code (not in database)
   - Stripe Product and Price IDs in .env file
   - Terminal limits in .env: `STRIPE_TERMINALS_STARTER=1`, etc.

**Acceptance Criteria:**
- [ ] Three plans visible on pricing page
- [ ] Pricing accurate per currency/region
- [ ] Plan features clearly documented
- [ ] Current plan highlighted on selection page
- [ ] Plans cannot be edited from UI (admin-only)

---

#### Feature 2.2: Checkout Session

**Description:** User initiates Stripe Checkout to purchase a subscription plan.

**User Story:**
```
As a business owner,
I want to subscribe to a plan and pay,
So that I can start using POS terminals and unlock features.
```

**Requirements:**

1. **Checkout Initiation**
   - Endpoint: `POST /api/billing/create-checkout-session`
   - Auth required: Yes, OWNER role
   - Request body:
     ```json
     {
       "priceId": "price_xxxx"
     }
     ```

2. **Checkout Session Flow**
   - Backend receives priceId
   - Validates priceId matches one of three allowed plans
   - Creates Stripe customer if not exists
   - Creates Stripe checkout session with:
     - Line item: priceId
     - Customer ID: stripe_customer_id from tenant
     - Success URL: `https://QuantPOS.com/billing/success?session_id={CHECKOUT_SESSION_ID}`
     - Cancel URL: `https://QuantPOS.com/billing/cancel`
     - Metadata: `{ tenantId: "...", priceId: "..." }`
     - Billing address required: true
   - Returns session ID and Stripe-hosted checkout URL
   - Response:
     ```json
     {
       "success": true,
       "data": {
         "sessionId": "cs_xxxx",
         "checkoutUrl": "https://checkout.stripe.com/..."
       }
     }
     ```

3. **Frontend Checkout Flow**
   - User clicks "Select Plan"
   - Calls backend to get checkout URL
   - Redirects to Stripe Checkout (hosted page)
   - User enters card details and billing address
   - Payment processed
   - Redirects back to success URL

4. **Stripe Hosted Checkout**
   - No custom payment form (use Stripe Hosted Checkout)
   - Secure, PCI-compliant, Stripe-managed
   - Supports all major payment methods
   - Mobile-responsive

5. **Success & Cancel Pages**
   - Success page: "Payment successful! Your subscription is now active."
     - Show next steps (add products, invite team, etc.)
     - Button to go to dashboard
   - Cancel page: "Subscription cancelled. Try again or contact support."
     - Stripe customer still created (for future reactivation)
     - User can return to plans page

**Resilient Checkout Mechanism:**
- If Stripe `resource_missing` occurs (e.g., a customer record was manually deleted in the Stripe Dashboard, but the ID remains in our database), the backend automatically traps the error.
- It provisions a new Stripe Customer ID on-the-fly, updates the `tenants` table, and immediately retries session creation without failing the user request.
- When Stripe redirects the user back (`?checkout=success`), the frontend dashboard instantly and silently re-syncs the `user` object to hide the inactive banner, providing a seamless user experience.

**Acceptance Criteria:**
- [ ] Checkout URL generated correctly
- [ ] User redirected to Stripe-hosted checkout
- [ ] Payment processed successfully in test mode
- [ ] Metadata passed to Stripe for later webhook matching
- [ ] Success page shows after payment
- [ ] Cancel URL works and returns to plans page
- [ ] Works on mobile and desktop

---

#### Feature 2.3: Subscription Webhooks

**Description:** Stripe sends webhook events to update subscription status in real-time.

**Technical Requirement:**

1. **Webhook Endpoint**
   - Endpoint: `POST /api/webhooks/stripe`
   - Public (no auth required)
   - Signature verification: MUST verify `Stripe-Signature` header
   - Idempotent: Same webhook received twice = processed once

2. **Events Handled**

   **checkout.session.completed**
   - When: User completes Stripe checkout
   - Action:
     ```
     Get checkout session details from Stripe
     Find tenant by Stripe customer ID (from metadata)
     Get plan details: map priceId to terminal_limit
     Update tenant:
       - stripe_subscription_id = subscription_id from session
       - subscription_status = ACTIVE
       - terminal_limit = 1/3/10 (based on plan)
       - updated_at = now()
     Send success email to owner
     ```
   - Response: 200 OK (webhook must return 200 within 5 seconds)

   **invoice.payment_succeeded**
   - When: Recurring invoice paid successfully
   - Action:
     ```
     Get invoice details
     Find tenant by customer ID
     Update tenant:
       - subscription_status = ACTIVE
     Log successful payment
     ```

   **invoice.payment_failed**
   - When: Recurring invoice payment fails
   - Action:
     ```
     Get invoice details
     Find tenant by customer ID
     Update tenant:
       - subscription_status = PAST_DUE
     Send urgent email: "Payment failed. Update your billing method."
     POS terminals still work (grace period)
     ```

   **customer.subscription.deleted**
   - When: Subscription cancelled (by user or after non-payment)
   - Action:
     ```
     Find tenant by customer ID
     Update tenant:
       - subscription_status = CANCELLED
       - terminal_limit = 0
     Lock all terminals (POS cannot be opened)
     Send email: "Your subscription has been cancelled."
     Retain all data (do not delete)
     ```

   **customer.subscription.updated**
   - When: Subscription plan changed
   - Action:
     ```
     Get new subscription details
     Find tenant by customer ID
     Update terminal_limit based on new price
     Send email: "Your plan has been updated to..."
     ```

3. **Webhook Signature Verification**
   - Every webhook request must have `Stripe-Signature` header
   - Signature calculated: `HMAC(timestamp.payload, webhook_secret)`
   - Verify timestamp not older than 5 minutes (replay attack prevention)
   - Reject if signature invalid (return 403)

4. **Error Handling**
   - If webhook processing fails: retry later (Stripe will retry for 3 days)
   - Log all webhook events to database for audit trail
   - Create AlertEvent if processing fails (for admin monitoring)

5. **Testing Webhooks**
   - Local development: Stripe CLI forwards webhooks to localhost
   - Integration tests: Mock Stripe webhook payloads
   - Production: Stripe dashboard webhook delivery logs show success/failure

**Acceptance Criteria:**
- [ ] All five events handled correctly
- [ ] Signature verification prevents spoofed webhooks
- [ ] Tenant status updated immediately on webhook
- [ ] Webhook processed within 1 second
- [ ] Idempotent: duplicate webhook = no duplicate updates
- [ ] All webhooks logged for audit trail
- [ ] Integration tests for each event type

---

#### Feature 2.4: Stripe Billing Portal

**Description:** Self-serve access to invoices, payment methods, and subscription management.

**User Story:**
```
As a business owner,
I want to manage my subscription, billing methods, and view invoices,
So that I have control over my account without contacting support.
```

**Requirements:**

1. **Billing Portal Endpoint**
   - Endpoint: `POST /api/billing/create-portal-session`
   - Auth required: Yes, OWNER role
   - Creates Stripe Billing Portal session
   - Returns portal URL
   - Response:
     ```json
     {
       "success": true,
       "data": {
         "portalUrl": "https://billing.stripe.com/..."
       }
     }
     ```

2. **Portal Features (Stripe-managed)**
   - View subscription details
   - Update payment method
   - View billing history and invoices
   - Download invoices as PDF
   - Change billing email
   - Cancel subscription (without contacting support)
   - Upgrade or downgrade plan (if allowed)

3. **Billing Dashboard (QuantPOS UI)**
   - Billing tab in settings
   - Display:
     - Current plan name and price
     - Terminals included
     - Current billing period (Jan 15 - Feb 15)
     - Next billing date
     - Payment method (last 4 digits of card)
   - Buttons:
     - "Manage Billing" → opens Stripe portal
     - "Upgrade Plan" → shows plan selection
     - "Cancel Subscription" → confirmation → cancels

4. **Integration with Subscription Status**
   - ACTIVE: Full feature access, terminals unlocked
   - PAST_DUE: Features work, warning banner shown
   - CANCELLED: All features locked, upgrade prompt shown
   - INACTIVE (before first payment): Features limited, upgrade prompt shown

**Acceptance Criteria:**
- [ ] Portal URL generated correctly
- [ ] User redirected to Stripe-managed portal
- [ ] Portal shows subscription and payment details
- [ ] User can change payment method from portal
- [ ] User can download invoices from portal
- [ ] User can cancel subscription from portal (confirmed with webhook)
- [ ] Billing dashboard shows current subscription status

---

### Phase 3: Inventory Management (Active Development)

**Duration:** 3 weeks  
**Status:** In Progress (Database schemas defined)

**Core Feature: Product Types**
- **STANDARD:** Items sold in fixed quantities (e.g., 1 bottle of soda, 1 packet of chips). Stored with integer stock count.
- **LOOSE:** Items sold by weight or volume (e.g., Sugar per kg, Oil per litre). Stored with decimal stock count and fractional prices. Requires POS terminal to prompt cashier for measured quantity.

**Core Feature: Barcode Strategies**
To accommodate different retail setups, the system supports three barcode scenarios:
- **Scenario A (Standard):** Product has a manufacturer barcode. Scanned directly at POS.
- **Scenario B (Pre-weighed Loose):** Loose products are pre-weighed and labeled with a QuantPOS-generated barcode containing weight and price info.
- **Scenario C (In-store Un-barcoded):** Standard products without manufacturer barcodes get assigned a unique, in-store generated barcode printed on shelf labels.

**Features:**
- Product catalog with Standard vs Loose pricing structures
- Real-time stock tracking with decimal precision for loose goods
- Intelligent financial storage using `paise/cents` to eliminate rounding errors
- Dynamic quantity input prompts at POS for un-barcoded loose items

---

### Phase 4: POS Terminal (Future)

**Duration:** 4 weeks  
**Status:** Design phase

**Features:**
- Cashier-facing checkout interface
- Product search and filtering
- Shopping cart with line items
- Discount and tax calculations
- Payment method selection
- Receipt generation and printing

---

### Phase 5-10: Future Phases

(Detailed specifications in future versions of this PRD)

---

## User Stories & Acceptance Criteria

### Story 1: Register and Verify Email

**As a** retail store owner  
**I want to** sign up for QuantPOS with my business details  
**So that** I can start managing my store online  

**Given:** I'm on the registration page  
**When:** I fill in all required fields (business name, type, owner name, email, password, address, phone)  
**Then:** I should see a success message saying "Check your email to verify your account"  
**And:** I should receive a verification email within 5 seconds  

**Given:** I received the verification email  
**When:** I click the verification link  
**Then:** My account should be activated  
**And:** I should be redirected to the login page  

**Acceptance Criteria:**
- [ ] Form validates required fields on submit
- [ ] Password meets strength requirements (8+ chars, upper, lower, number, special)
- [ ] Email uniqueness enforced globally
- [ ] Phone number format validated
- [ ] Address fields properly stored (street, city, state, pincode)
- [ ] Verification email sent within 5 seconds
- [ ] Link expires after 24 hours
- [ ] Link works only once
- [ ] User cannot login until email verified

---

### Story 2: Silent Token Refresh

**As a** user  
**I want to** stay logged in even when my access token expires  
**So that** I don't have to re-enter my credentials frequently  

**Given:** My access token is about to expire  
**When:** I make an API request  
**Then:** If the token is expired, my session should be automatically refreshed  
**And:** My request should complete successfully  
**And:** I should not see any logout or re-login prompt  

**Acceptance Criteria:**
- [ ] Axios interceptor detects 401 responses
- [ ] Refresh endpoint called automatically
- [ ] New access token obtained and stored
- [ ] Original request retried with new token
- [ ] Process transparent to user (no UI interruption)
- [ ] Refresh completes in < 100ms
- [ ] Multiple simultaneous requests queued during refresh

---

### Story 3: Subscribe to Plan

**As a** business owner  
**I want to** select a subscription plan and pay  
**So that** I can unlock features and start using POS terminals  

**Given:** I'm logged in and viewing the pricing page  
**When:** I click "Select Plan" for the Growth plan ($19/month, 3 terminals)  
**Then:** I should be redirected to Stripe Checkout  

**Given:** I'm on Stripe Checkout  
**When:** I enter my card details and billing address  
**Then:** Payment should be processed  
**And:** I should be redirected to a success page  
**And:** My subscription status should be ACTIVE  

**Acceptance Criteria:**
- [ ] Three plans visible with accurate pricing and details
- [ ] "Select Plan" button initiates checkout session
- [ ] Stripe Checkout page loads correctly
- [ ] Payment processed in test mode (card: 4242 4242 4242 4242)
- [ ] Success page shows after payment completes
- [ ] Webhook updates tenant subscription status to ACTIVE
- [ ] Terminal limit set correctly (1/3/10)
- [ ] Business owner receives confirmation email

---

## Technical Requirements

### Performance Requirements

| Metric | Target | Rationale |
|--------|--------|-----------|
| Login response time | < 1 second | User expects instant feedback |
| API response time | < 500ms (p95) | Smooth UI interactions |
| Page load time | < 2 seconds | Retail staff in hurry |
| Database query time | < 100ms | Avoid slow UI from backend |
| Token refresh time | < 100ms | Silent, should not be noticed |
| Email send time | < 5 seconds | User checking inbox immediately |

### Scalability Requirements

| Metric | Target | Timeline |
|--------|--------|----------|
| Concurrent users | 1,000 | Day 1 |
| Daily API requests | 1,000,000 | Month 12 |
| Monthly transactions | 500,000 | Month 6 |
| Database size | 100 GB | Month 24 |

### Availability Requirements

- **Uptime SLA:** 99.9% (43 minutes downtime per month)
- **RTO (Recovery Time Objective):** < 15 minutes
- **RPO (Recovery Point Objective):** < 1 hour
- **Backup frequency:** Every hour
- **Disaster recovery:** Multi-region capability

### Security Requirements

- **Data encryption:** AES-256 at rest, TLS 1.2+ in transit
- **Password hashing:** BCrypt with strength 12
- **JWT signing:** HS256 with 256-bit secret minimum
- **CORS:** Restricted to frontend URL only
- **SQL injection prevention:** Parameterized queries
- **XSS prevention:** Output encoding, CSP headers
- **CSRF prevention:** Token-based (JWT, no cookies)
- **Rate limiting:** 100 requests/minute per IP, 10 requests/minute per user for auth
- **Audit logging:** All transactions logged with timestamp, user, action
- **Data isolation:** Tenant_id enforced at database and application layer
- **PII handling:** Passwords never logged, sensitive data encrypted in logs

### Browser Support

- Chrome: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Edge: Latest 2 versions
- Mobile browsers: Safari iOS 14+, Chrome Android 90+

### Mobile Responsiveness

- Responsive design: All pages work on 320px+ width
- Touch-friendly: Buttons ≥ 44px for touch targets
- Fast mobile: Optimized images, lazy loading
- Mobile POS: Full-screen terminal mode for cashiers

---

## Non-Functional Requirements

### Maintainability

- Code follows Java/React best practices
- Consistent naming conventions
- Comprehensive code comments for complex logic
- No magic numbers (use constants)
- Dependency injection throughout
- Separation of concerns (controller, service, repository)

### Testability

- Unit test coverage: ≥ 80% for services
- Integration test coverage: ≥ 60% for APIs
- All public methods testable
- Mocking framework: Mockito
- Test framework: JUnit 5

### Reliability

- Graceful error handling: No unhandled exceptions
- Retry logic for external APIs (Stripe, Brevo)
- Circuit breaker for failing external services
- Health checks: `/actuator/health` endpoint
- Monitoring: CloudWatch, DataDog, or New Relic

### Usability

- Intuitive UI: Minimal learning curve
- Clear error messages: Tell user what went wrong and how to fix
- Loading states: Show progress during long operations
- Confirmation dialogs: Before destructive actions
- Keyboard shortcuts: Power users can work faster
- Accessibility: WCAG 2.1 AA compliance

### Documentation

- README with quick start guide
- Architecture document explaining design decisions
- API documentation via Swagger/OpenAPI
- Deployment guide for AWS
- Troubleshooting guide for common issues
- Developer onboarding guide

---

## Constraints & Assumptions

### Technical Constraints

- **Backend:** Must use Spring Boot 3.x (Java 17+)
- **Frontend:** Must use React 18+
- **Database:** PostgreSQL only (no MySQL, no NoSQL)
- **Cache:** Redis only (no Memcached)
- **Deployment:** Docker containerized
- **Cloud:** AWS preferred (RDS, EC2, ECS)
- **Payment:** Stripe (no PayPal, no direct bank transfers initially)
- **Email:** Brevo SMTP (no SendGrid initially)

### Business Constraints

- **Budget:** Limited to $200/month AWS free tier
- **Team size:** Solo developer initially
- **Timeline:** Must launch MVP (Phase 1-2) in 12 weeks
- **Market:** India-first, global expansion in year 2

### Assumptions

- **User assumptions:**
  - Users have internet connectivity
  - Users have a modern web browser
  - Retail owners speak Hindi or English
  - Cashiers comfortable with touchscreen devices
  - Owners have email and phone number

- **Technical assumptions:**
  - PostgreSQL always available
  - Redis always available
  - Stripe API always available (< 5s latency)
  - Brevo SMTP always available

- **Business assumptions:**
  - Businesses renew subscription annually
  - Churn rate ≤ 15% after 12 months
  - Average business has 1-3 terminals
  - Market willing to pay $9-49/month for POS

---

## Success Metrics & KPIs

### User Acquisition Metrics

| Metric | Target | Month 3 | Month 6 | Month 12 |
|--------|--------|---------|---------|----------|
| New signups | - | 50 | 150 | 500 |
| Free trial starts | - | 45 | 135 | 450 |
| Paid subscriptions | - | 25 | 75 | 300 |
| Cost per acquisition (CAC) | < $20 | $30 | $20 | $15 |

### User Activation Metrics

| Metric | Target | Definition |
|--------|--------|-----------|
| Email verification rate | ≥ 80% | % of signups that verify email |
| First login rate | ≥ 70% | % of verified users that log in |
| Product added rate | ≥ 60% | % of activated users that add ≥ 1 product |
| First sale rate | ≥ 50% | % of activated users that process ≥ 1 sale |

### Engagement Metrics

| Metric | Target | Definition |
|--------|--------|-----------|
| Daily active users | - | Users who log in daily |
| Monthly active users | ≥ 70% of paid users | Users who log in ≥ 1x per month |
| Average session duration | ≥ 15 minutes | Avg time spent per login |
| Features used per user | ≥ 5 | Avg number of features used |
| API calls per user/day | ≥ 50 | Engagement proxy metric |

### Retention Metrics

| Metric | Target | Definition |
|--------|--------|-----------|
| Day 7 retention | ≥ 60% | % of users active on day 7 |
| Day 30 retention | ≥ 50% | % of users active on day 30 |
| 3-month retention | ≥ 40% | % of users still subscribed at 3 months |
| 12-month retention | ≥ 85% | % of users still subscribed at 12 months |
| Churn rate | ≤ 15% | % of users churning per month |

### Revenue Metrics

| Metric | Target | Month 3 | Month 6 | Month 12 |
|--------|--------|---------|---------|----------|
| Monthly recurring revenue (MRR) | - | $2,500 | $10,000 | $50,000 |
| Annual run rate (ARR) | $50,000 | $30,000 | $120,000 | $600,000 |
| Average revenue per user (ARPU) | - | $100 | $133 | $167 |
| Customer lifetime value (CLV) | > $500 | - | - | $2,000 |
| CAC payback period | < 6 months | - | - | 3 months |

### Product Quality Metrics

| Metric | Target | Measurement |
|--------|--------|-----------|
| System uptime | 99.9% | CloudWatch monitoring |
| Error rate | < 0.1% | API error logs |
| Test coverage | ≥ 80% | Code coverage tools |
| Page load time (p95) | < 2 seconds | WebPageTest, Lighthouse |
| API response time (p95) | < 500ms | APM tool |
| Database query time (p95) | < 100ms | Query logs |

### Customer Satisfaction Metrics

| Metric | Target | Measurement |
|--------|--------|-----------|
| Net Promoter Score (NPS) | ≥ 50 | Quarterly survey |
| Customer satisfaction (CSAT) | ≥ 80% | Post-interaction survey |
| Support ticket resolution time | < 24 hours | Help desk tracking |
| First response time | < 2 hours | Help desk tracking |

---

## Roadmap & Timeline

### Phase 1: Authentication & Multi-Tenancy (Week 1-4) ✅
- Complete auth flow (register, verify, login, refresh)
- JWT and refresh token implementation
- Multi-tenancy isolation with Hibernate filter
- Role-based access control
- **Deliverable:** Secured, isolated platform ready for features

### Phase 2: Stripe Billing (Week 5-8) 🔄
- Stripe integration and checkout
- Webhook handling for subscriptions
- Subscription status enforcement
- Terminal limit enforcement
- **Deliverable:** Self-serve billing, revenue-generating platform

### Phase 3: Inventory Management (Week 9-11)
- Product catalog with variants
- Stock tracking and adjustments
- Low-stock alerts
- Inventory transaction audit trail
- **Deliverable:** Complete inventory system

### Phase 4: POS Terminal (Week 12-15)
- Cashier-facing checkout interface
- Shopping cart and line items
- Payment methods and receipts
- Inventory auto-decrement
- **Deliverable:** Functional POS system, real transactions

### Phase 5: Dashboard & Reports (Week 16-18)
- Sales analytics and charts
- Product performance tracking
- Inventory health dashboard
- Date filtering and exports
- **Deliverable:** Data-driven insights for owners

### Phase 6: AI Restocking Agent (Week 19-21)
- OpenAI integration for demand forecasting
- Sales history analysis
- Purchase order generation
- Scheduled and manual triggers
- **Deliverable:** Intelligent inventory automation

### Phase 7: User Management (Week 22-24)
- Team member invitations
- Granular permissions
- Session management
- Activity audit logs
- **Deliverable:** Multi-user business management

### Phase 8: Cloud Deployment (Week 25-27)
- AWS infrastructure (RDS, EC2)
- GitHub Actions CI/CD
- SSL/TLS certificates
- Monitoring and alerting
- **Deliverable:** Production-ready cloud platform

### Phase 9: Mobile App (Month 9-12)
- React Native mobile app
- Offline-first capability
- Real-time inventory sync
- Push notifications
- **Deliverable:** Mobile-first experience for cashiers

### Phase 10: Expansion (Month 13-18)
- Multi-language support
- Regional compliance (tax, payment gateways)
- App marketplace
- Analytics for multi-location chains
- **Deliverable:** Global SaaS platform

---

## Appendix

### A. Glossary

| Term | Definition |
|------|-----------|
| **Tenant** | A business/organization using the platform |
| **User** | A person who logs into the platform |
| **Terminal** | A POS checkout station (hardware/browser-based) |
| **Subscription** | Recurring billing agreement for a plan |
| **Churn** | User cancels subscription and leaves platform |
| **CAC** | Cost to acquire a new customer |
| **CLV** | Total profit from a customer over relationship lifetime |
| **NPS** | Score measuring customer willingness to recommend (0-100) |
| **MRR** | Predictable recurring revenue per month |
| **ARR** | MRR × 12, annual recurring revenue |
| **ARPU** | Total MRR divided by number of customers |
| **SLA** | Service level agreement, uptime guarantee |
| **RTO** | Time allowed to restore service after outage |
| **RPO** | Maximum data loss acceptable after failure |

### B. Competitive Analysis

| Feature | QuantPOS | Square | Toast | Vend |
|---------|----------|--------|-------|------|
| Setup time | < 5 min | < 20 min | < 30 min | < 20 min |
| Monthly cost | $9-49 | $50-300 | $500+ | $99+ |
| Inventory tracking | ✓ | ✓ | ✓ | ✓ |
| AI recommendations | ✓ | ✗ | ✗ | ✗ |
| Multi-tenancy | ✓ | ✓ | ✗ | ✗ |
| India support | ✓ | Limited | Limited | Limited |
| Mobile app | In progress | ✓ | ✓ | ✓ |
| Pricing model | Per terminal | Usage-based | Monthly flat | Monthly flat |

### C. Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Stripe unavailable | Low | Critical | Fallback to manual billing, retry logic |
| Data breach | Low | Critical | Encryption, regular audits, insurance |
| High churn (>30%) | Medium | High | Focus on activation, customer support |
| Slow adoption | Medium | Medium | Marketing, referral program |
| AWS cost overruns | Medium | Medium | Reserved instances, auto-scaling limits |
| Competition | Medium | Medium | Focus on SMBs, India market first |
| Regulatory changes | Low | Medium | Legal review, compliance team |

### D. Success Stories (Projected - Year 1)

**"Sharma General Store"**
- Before: 2 hours daily inventory counting, frequent stockouts, ~₹50K monthly revenue
- After QuantPOS: 15 minutes inventory counting (Ravi does it), 0 stockouts, ₹65K monthly revenue
- Outcome: 30% revenue increase, 2 hours saved daily, upgraded to 3 terminals after 3 months

**"Patel Café"**
- Before: Manual receipt book, no sales tracking, 3 staff but no way to measure performance
- After QuantPOS: Real-time sales dashboard, cashier performance visible, inventory down 5%
- Outcome: 20% reduction in waste, improved staff accountability, planning 2 more locations

---

**Document Version:** 1.0  
**Last Updated:** January 2024  
**Next Review:** April 2024  
**Owner:** Product Management Team