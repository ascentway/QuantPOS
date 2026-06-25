# QuantPOS  Complete Backend Database Schema

**Version:** 1.0  
**Database:** PostgreSQL 15  
**Architecture:** Single Shared Database, Tenant-Isolated Rows (Shared Schema)  
**Scope:** All 10 Phases  
**Security Level:** L4 Enterprise Grade

---

## Table of Contents

1. [Schema Architecture Overview](#schema-architecture-overview)
2. [Database Setup](#database-setup)
3. [Enum Types & Custom Types](#enum-types--custom-types)
4. [Phase 1: Authentication & Multi-Tenancy Tables](#phase-1-authentication--multi-tenancy-tables)
5. [Phase 2: Stripe Billing Tables](#phase-2-stripe-billing-tables)
6. [Phase 3: Inventory Management Tables](#phase-3-inventory-management-tables)
7. [Phase 4: POS Terminal Tables](#phase-4-pos-terminal-tables)
8. [Phase 5: Reporting & Analytics Tables](#phase-5-reporting--analytics-tables)
9. [Phase 6: AI Restocking Agent Tables](#phase-6-ai-restocking-agent-tables)
10. [Phase 7: RBAC & User Management Tables](#phase-7-rbac--user-management-tables)
11. [Phases 8-10: Advanced Features](#phases-8-10-advanced-features)
12. [Complete ERD Diagram](#complete-erd-diagram)
13. [Indexes Strategy](#indexes-strategy)
14. [Flyway Migrations](#flyway-migrations)
15. [Sample Data](#sample-data)
16. [Query Performance Guide](#query-performance-guide)

---

## Schema Architecture Overview

### Multi-Tenant Isolation Model

```
┌────────────────────────────────────────────────────┐
│     Single PostgreSQL Instance: quantpos_db        │
├────────────────────────────────────────────────────┤
│                                                    │
│  TENANTS TABLE (Root)                             │
│  ├─ ID: tenant-uuid-001 (Sharma)                  │
│  ├─ ID: tenant-uuid-002 (Ravi)                    │
│  └─ ID: tenant-uuid-003 (Priya)                   │
│                                                    │
│  USERS TABLE (tenant_id filtered)                 │
│  ├─ Sharma's user (tenant_id: 001)                │
│  ├─ Ravi's user (tenant_id: 002)                  │
│  └─ Priya's user (tenant_id: 003)                 │
│                                                    │
│  PRODUCTS TABLE (tenant_id filtered)              │
│  ├─ Sharma's products (tenant_id: 001)            │
│  ├─ Ravi's products (tenant_id: 002)              │
│  └─ Priya's products (tenant_id: 003)             │
│                                                    │
│  SALES TABLE (tenant_id filtered)                 │
│  ├─ Sharma's sales (tenant_id: 001)               │
│  ├─ Ravi's sales (tenant_id: 002)                 │
│  └─ Priya's sales (tenant_id: 003)                │
│                                                    │
│  ... All tables follow same pattern               │
│                                                    │
└────────────────────────────────────────────────────┘

Benefits:
✅ Single backup/restore strategy
✅ Single monitoring setup
✅ Vertical scaling (upgrade RDS)
✅ Simple migrations (one schema)
✅ Cost-efficient (1 DB for 1000s of tenants)
✅ Shopify/Stripe pattern
```

---

## Database Setup

### Initial PostgreSQL Configuration

```sql
-- Create database
CREATE DATABASE quantpos_db
  WITH
    ENCODING = 'UTF8'
    LOCALE = 'en_US.UTF-8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8';

-- Connect to database
\c quantpos_db

-- Create user
CREATE USER quantpos_user WITH PASSWORD 'secure_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE quantpos_db TO quantpos_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO quantpos_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO quantpos_user;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### Connection String
```
jdbc:postgresql://localhost:5432/quantpos_db
Username: quantpos_user
Password: secure_password_here
```

---

## Enum Types & Custom Types

### Create Enum Types (Execute First)

```sql
-- Business types
CREATE TYPE business_type AS ENUM ('RETAIL', 'FNB');

-- Subscription statuses
CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'INACTIVE', 'PAST_DUE', 'CANCELLED');

-- User roles (for RBAC)
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'OWNER', 'MANAGER', 'CASHIER');

-- Product types (including loose products)
CREATE TYPE product_type AS ENUM ('STANDARD', 'LOOSE');

-- Sale statuses
CREATE TYPE sale_status AS ENUM ('COMPLETED', 'REFUNDED', 'CANCELLED', 'PENDING');

-- Payment methods
CREATE TYPE payment_method AS ENUM ('CASH', 'CARD', 'UPI', 'CHEQUE', 'WALLET');

-- Inventory transaction types
CREATE TYPE inventory_transaction_type AS ENUM ('SALE', 'RESTOCK', 'ADJUSTMENT', 'RETURN', 'DAMAGE', 'LOSS');

-- Permission actions
CREATE TYPE permission_action AS ENUM ('VIEW', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT');

-- Audit event types
CREATE TYPE audit_event_type AS ENUM (
  'USER_LOGIN', 'USER_LOGOUT', 'USER_CREATED', 'USER_UPDATED', 'USER_DELETED',
  'SALE_COMPLETED', 'SALE_REFUNDED', 'SALE_CANCELLED',
  'PRODUCT_ADDED', 'PRODUCT_UPDATED', 'PRODUCT_DELETED',
  'INVENTORY_ADJUSTED', 'INVENTORY_COUNTED',
  'SUBSCRIPTION_CREATED', 'SUBSCRIPTION_CANCELLED', 'PAYMENT_PROCESSED',
  'REPORT_GENERATED', 'SETTINGS_CHANGED', 'TEAM_MEMBER_INVITED'
);

-- AI recommendation urgency levels
CREATE TYPE urgency_level AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');
```

---

## Phase 1: Authentication & Multi-Tenancy Tables

### TENANTS Table (Root of Multi-Tenancy)

```sql
CREATE TABLE IF NOT EXISTS tenants (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Business Information
  business_name VARCHAR(255) NOT NULL,
  business_type business_type NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  gstin VARCHAR(15) UNIQUE NULLABLE,
  
  -- Address
  address_street VARCHAR(255) NOT NULL,
  address_city VARCHAR(100) NOT NULL,
  address_state VARCHAR(100) NOT NULL,
  address_pincode VARCHAR(10) NOT NULL,
  
  -- Localization
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
  financial_year_start VARCHAR(10) NOT NULL DEFAULT 'APRIL',
  
  -- Stripe Integration (Phase 2)
  stripe_customer_id VARCHAR(255) UNIQUE NULLABLE,
  stripe_subscription_id VARCHAR(255) NULLABLE,
  subscription_status subscription_status NOT NULL DEFAULT 'INACTIVE',
  terminal_limit INTEGER NOT NULL DEFAULT 0,
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Audit Fields
  created_by_user_id UUID NULLABLE,
  updated_by_user_id UUID NULLABLE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_pincode CHECK (LENGTH(address_pincode) = 6),
  CONSTRAINT valid_phone CHECK (LENGTH(phone_number) = 10),
  CONSTRAINT non_negative_terminal_limit CHECK (terminal_limit >= 0)
);

-- Indexes
CREATE INDEX idx_tenants_is_active ON tenants(is_active);
CREATE INDEX idx_tenants_stripe_customer_id ON tenants(stripe_customer_id);
CREATE INDEX idx_tenants_created_at ON tenants(created_at DESC);

-- Comments (for documentation)
COMMENT ON TABLE tenants IS 'Root table for multi-tenancy. Each business is a separate tenant.';
COMMENT ON COLUMN tenants.id IS 'Unique identifier for business. Used in JWT claims.';
COMMENT ON COLUMN tenants.terminal_limit IS 'Max POS terminals allowed based on subscription plan.';

-- Sample data
INSERT INTO tenants (business_name, business_type, phone_number, address_street, address_city, address_state, address_pincode) VALUES
('Sharma General Store', 'RETAIL', '9876543210', '123 Market St', 'Mumbai', 'Maharashtra', '400001'),
('Ravi Enterprises', 'RETAIL', '8765432109', '456 Main Rd', 'Delhi', 'Delhi', '110001'),
('Priya Cafe', 'FNB', '7654321098', '789 Coffee Lane', 'Bangalore', 'Karnataka', '560001');
```

### USERS Table (With OTP-Based Verification)

```sql
CREATE TABLE IF NOT EXISTS users (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tenant Reference (Multi-tenancy enforced)
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- User Information
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  
  -- Authentication
  password_hash VARCHAR(255) NOT NULL,
  
  -- RBAC (Phase 7)
  role user_role NOT NULL,
  
  -- Email Verification (Phase 1 - OTP based)
  is_email_verified BOOLEAN NOT NULL DEFAULT false,
  email_verified_at TIMESTAMP NULLABLE,
  
  -- Account Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Login Tracking
  last_login_at TIMESTAMP NULLABLE,
  login_attempt_count INTEGER DEFAULT 0,
  is_locked BOOLEAN DEFAULT false,
  locked_until TIMESTAMP NULLABLE,
  
  -- Audit Fields
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  UNIQUE(tenant_id, email)  -- Email unique per tenant (not globally)
);

-- Indexes (Critical for multi-tenancy)
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tenant_email ON users(tenant_id, email);
CREATE INDEX idx_users_is_active ON users(tenant_id, is_active);
CREATE INDEX idx_users_role ON users(tenant_id, role);

-- Comments
COMMENT ON TABLE users IS 'User accounts for businesses. One user per email per tenant.';
COMMENT ON COLUMN users.tenant_id IS 'CRITICAL: Filters data to specific tenant. Every query includes this.';
COMMENT ON COLUMN users.role IS 'OWNER, MANAGER, CASHIER, or SUPER_ADMIN. Used for authorization.';
COMMENT ON COLUMN users.is_email_verified IS 'Must be true to login. Set after OTP verification.';

-- Sample data
INSERT INTO users (tenant_id, full_name, email, password_hash, role, is_email_verified, email_verified_at) VALUES
(
  (SELECT id FROM tenants WHERE business_name = 'Sharma General Store'),
  'Sharma',
  'sharma@example.com',
  '$2a$12$...', -- BCrypt hash
  'OWNER',
  true,
  NOW()
),
(
  (SELECT id FROM tenants WHERE business_name = 'Ravi Enterprises'),
  'Ravi Sharma',
  'ravi@example.com',
  '$2a$12$...',
  'MANAGER',
  true,
  NOW()
);
```

### AUDIT_LOGS Table (Comprehensive Activity Tracking)

```sql
CREATE TABLE IF NOT EXISTS audit_logs (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tenant Reference
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Who did it?
  user_id UUID NULLABLE REFERENCES users(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  user_role user_role,
  
  -- What happened?
  event_type audit_event_type NOT NULL,
  resource_type VARCHAR(50) NOT NULL,  -- 'USER', 'PRODUCT', 'SALE', etc.
  resource_id UUID NULLABLE,
  resource_name VARCHAR(255) NULLABLE,
  
  -- Changes
  action VARCHAR(50),  -- 'CREATE', 'UPDATE', 'DELETE'
  old_values JSONB NULLABLE,  -- Before state
  new_values JSONB NULLABLE,  -- After state
  
  -- Request Context
  ip_address VARCHAR(45),  -- IPv4 or IPv6
  user_agent VARCHAR(500),
  request_id VARCHAR(255),  -- Trace back to original request
  
  -- Status
  status VARCHAR(20),  -- 'SUCCESS', 'FAILED', 'ATTEMPTED'
  error_message VARCHAR(500) NULLABLE,
  
  -- Severity for filtering
  severity VARCHAR(20) DEFAULT 'INFO',  -- INFO, WARNING, ERROR, CRITICAL
  
  -- Timestamp
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Comments
COMMENT ON TABLE audit_logs IS 'Immutable audit trail. Owner can see all activity in store.';
COMMENT ON COLUMN audit_logs.old_values IS 'JSONB format. Stores entire row before update.';
COMMENT ON COLUMN audit_logs.new_values IS 'JSONB format. Stores entire row after update.';
```

---

## Phase 2: Stripe Billing Tables

### SUBSCRIPTIONS Table

```sql
CREATE TABLE IF NOT EXISTS subscriptions (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tenant Reference (one subscription per tenant)
  tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Stripe Integration
  stripe_customer_id VARCHAR(255) NOT NULL,
  stripe_subscription_id VARCHAR(255) NOT NULL UNIQUE,
  stripe_price_id VARCHAR(255) NOT NULL,
  
  -- Plan Details
  plan_type VARCHAR(20) NOT NULL,  -- 'STARTER', 'GROWTH', 'ENTERPRISE'
  plan_name VARCHAR(100),
  monthly_price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  terminal_limit INTEGER NOT NULL,
  
  -- Billing Cycle
  current_period_start DATE NOT NULL,
  current_period_end DATE NOT NULL,
  next_billing_date DATE NULLABLE,
  
  -- Status
  status subscription_status NOT NULL,
  
  -- Cancellation Tracking
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancelled_at TIMESTAMP NULLABLE,
  cancellation_reason VARCHAR(500) NULLABLE,
  
  -- Audit
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_terminal_limit CHECK (terminal_limit > 0),
  CONSTRAINT valid_price CHECK (monthly_price > 0)
);

-- Indexes
CREATE INDEX idx_subscriptions_tenant ON subscriptions(tenant_id);
CREATE INDEX idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_next_billing ON subscriptions(next_billing_date);

-- Comments
COMMENT ON TABLE subscriptions IS 'Stripe subscription details. Tracks plan and billing cycle.';
```

### PAYMENT_EVENTS Table (Webhook Tracking)

```sql
CREATE TABLE IF NOT EXISTS payment_events (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tenant Reference
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Stripe Webhook
  stripe_event_id VARCHAR(255) NOT NULL UNIQUE,
  stripe_event_type VARCHAR(100),  -- checkout.session.completed, invoice.payment_succeeded
  stripe_subscription_id VARCHAR(255) NULLABLE,
  stripe_invoice_id VARCHAR(255) NULLABLE,
  
  -- Payment Details
  amount_cents DECIMAL(12,0) NOT NULL,  -- Store as cents for accuracy
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Status
  status VARCHAR(50),  -- SUCCESS, FAILED, PENDING
  
  -- Webhook Response
  webhook_payload JSONB NOT NULL,  -- Full Stripe response
  processed_at TIMESTAMP,
  
  -- Idempotency (prevent duplicate processing)
  idempotency_key VARCHAR(255) NULLABLE,
  
  -- Timestamp
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_amount CHECK (amount_cents > 0)
);

-- Indexes
CREATE INDEX idx_payment_events_tenant ON payment_events(tenant_id, created_at DESC);
CREATE INDEX idx_payment_events_stripe_id ON payment_events(stripe_event_id);
CREATE INDEX idx_payment_events_status ON payment_events(status);

-- Comments
COMMENT ON TABLE payment_events IS 'All Stripe webhook events for audit trail and idempotency.';
```

### INVOICES Table (Billing History)

```sql
CREATE TABLE IF NOT EXISTS invoices (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tenant Reference
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Stripe Integration
  stripe_invoice_id VARCHAR(255) NOT NULL UNIQUE,
  stripe_subscription_id VARCHAR(255) NULLABLE,
  
  -- Invoice Details
  invoice_number VARCHAR(50),
  amount_due DECIMAL(10,2) NOT NULL,
  amount_paid DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Dates
  invoice_date DATE,
  due_date DATE,
  paid_at TIMESTAMP NULLABLE,
  
  -- Status
  status VARCHAR(50),  -- PAID, FAILED, PENDING, CANCELLED
  
  -- PDF URL (Stripe generates)
  invoice_pdf_url VARCHAR(500) NULLABLE,
  
  -- Timestamp
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_invoices_tenant ON invoices(tenant_id, created_at DESC);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_paid_at ON invoices(paid_at DESC);

-- Comments
COMMENT ON TABLE invoices IS 'Billing history shown to owners. Read-only from Stripe webhooks.';
```

---

## Phase 3: Inventory Management Tables

### CATEGORIES Table

```sql
CREATE TABLE IF NOT EXISTS categories (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tenant Reference
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Category Info
  name VARCHAR(100) NOT NULL,
  description VARCHAR(500),
  
  -- Optional parent category (for nested categories)
  parent_category_id UUID NULLABLE REFERENCES categories(id) ON DELETE SET NULL,
  
  -- Display Order
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(tenant_id, name)  -- Category name unique per tenant
);

-- Indexes
CREATE INDEX idx_categories_tenant ON categories(tenant_id);
CREATE INDEX idx_categories_parent ON categories(parent_category_id);

-- Sample data
INSERT INTO categories (tenant_id, name, description) VALUES
(
  (SELECT id FROM tenants WHERE business_name = 'Sharma General Store'),
  'Groceries',
  'Food items and grocery products'
),
(
  (SELECT id FROM tenants WHERE business_name = 'Sharma General Store'),
  'Daily Essentials',
  'Soap, oil, spices'
);
```

### PRODUCTS Table (With Dynamic Pricing for Loose Products)

```sql
CREATE TABLE IF NOT EXISTS products (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tenant Reference (CRITICAL)
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Category Reference
  category_id UUID NULLABLE REFERENCES categories(id) ON DELETE SET NULL,
  
  -- Basic Info
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) NOT NULL,
  barcode VARCHAR(255) NULLABLE,
  description VARCHAR(500),
  
  -- Product Type (determines pricing logic)
  product_type product_type NOT NULL DEFAULT 'STANDARD',
  -- STANDARD: Fixed quantity (e.g., 1 bottle, 1 packet)
  -- LOOSE: Sold by weight/volume (e.g., sugar per kg, oil per litre)
  
  -- Pricing (Stored in Paise/cents to avoid floating point errors)
  price_paise BIGINT NOT NULL DEFAULT 0,
  cost_paise BIGINT NULLABLE,
  price_per_unit_paise BIGINT NULLABLE, -- Base price for loose calculations
  currency VARCHAR(3) DEFAULT 'INR',
  
  -- Tax and HSN
  hsn_code VARCHAR(10) NULLABLE,
  gst_rate DECIMAL(5,2) DEFAULT 0.00,
  gst_inclusive BOOLEAN DEFAULT true,
  
  -- Measurement & Inventory 
  unit_type VARCHAR(20) DEFAULT 'PIECE', -- 'KG', 'GRAM', 'LITRE', 'ML', 'PIECE'
  stock_quantity DECIMAL(15,3) DEFAULT 0, -- Stored in base units (e.g. grams internally, but displayed as kg)
  minimum_loose_quantity DECIMAL(15,3) NULLABLE, -- Minimum weight to sell
  
  -- Stock Management
  is_trackable BOOLEAN DEFAULT true,  -- If false, no inventory tracking
  reorder_level INTEGER DEFAULT 0,
  reorder_quantity INTEGER DEFAULT 0,
  
  -- Metadata (flexible schema)
  metadata JSONB,  -- {supplier: "...", image_url: "...", tags: [...]}
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_by_user_id UUID NULLABLE REFERENCES users(id) ON DELETE SET NULL,
  updated_by_user_id UUID NULLABLE REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_price CHECK (price_paise >= 0),
  CONSTRAINT valid_cost CHECK (cost_paise IS NULL OR cost_paise >= 0),
  UNIQUE(tenant_id, sku)  -- SKU unique per tenant
);

-- Indexes
CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku ON products(tenant_id, sku);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_is_active ON products(tenant_id, is_active);
CREATE INDEX idx_products_type ON products(tenant_id, product_type);

-- Comments
COMMENT ON COLUMN products.product_type IS 'STANDARD: Fixed qty (bottle). LOOSE: By weight.';
COMMENT ON COLUMN products.price_paise IS 'Price in paise (amount * 100). Prevents floating point errors.';
COMMENT ON COLUMN products.stock_quantity IS 'Stored in base units. Decimals for loose items.';

-- Sample data
INSERT INTO products (
  tenant_id, category_id, name, sku, product_type, price_paise, price_per_unit_paise,
  unit_type, stock_quantity, minimum_loose_quantity, hsn_code, gst_rate
) VALUES
(
  (SELECT id FROM tenants WHERE business_name = 'Sharma General Store'),
  (SELECT id FROM categories WHERE name = 'Groceries' AND tenant_id = (SELECT id FROM tenants WHERE business_name = 'Sharma General Store')),
  'Sugar Loose',
  'SUGAR-LOOSE-KG',
  'LOOSE',
  11200,  -- ₹112.00
  11200,
  'KG',
  150.000, -- 150 kg in stock
  0.100,   -- minimum 100g
  '1701',
  5.00
),
(
  (SELECT id FROM tenants WHERE business_name = 'Sharma General Store'),
  (SELECT id FROM categories WHERE name = 'Groceries' AND tenant_id = (SELECT id FROM tenants WHERE business_name = 'Sharma General Store')),
  'Sugar 5kg Bag',
  'SUGAR-5KG-BAG',
  'STANDARD',
  45000,  -- ₹450.00
  NULL,
  'PIECE',
  25,
  NULL,
  '1701',
  5.00
);

### HSN_GST_RATES Table (Tax Reference)

```sql
CREATE TABLE IF NOT EXISTS hsn_gst_rates (
  hsn_code VARCHAR(10) PRIMARY KEY,
  description VARCHAR(500) NOT NULL,
  gst_rate DECIMAL(5,2) NOT NULL
);

-- Seed with common FMCG/Retail rates
INSERT INTO hsn_gst_rates (hsn_code, description, gst_rate) VALUES
('1701', 'Cane or beet sugar', 5.00),
('0401', 'Milk and cream', 0.00),
('1905', 'Bread, pastry, cakes, biscuits', 18.00);
```

### INVENTORY Table (Current Stock State)

```sql
CREATE TABLE IF NOT EXISTS inventory (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tenant Reference
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Product Reference
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Stock Levels (decimals for loose products)
  qty_on_hand DECIMAL(15,3) NOT NULL DEFAULT 0,  -- Current stock
  qty_reserved DECIMAL(15,3) NOT NULL DEFAULT 0,  -- Pre-ordered/held
  qty_in_transit DECIMAL(15,3) NOT NULL DEFAULT 0,  -- En route from supplier
  
  -- Low Stock Settings
  low_stock_threshold DECIMAL(15,3) NOT NULL DEFAULT 0,
  
  -- Unit info (inherited from product, denormalized for convenience)
  unit VARCHAR(20),  -- kg, liter, piece
  
  -- Last Activity
  last_updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Composite constraint
  CONSTRAINT qty_consistency CHECK (qty_on_hand >= 0 AND qty_reserved >= 0 AND qty_in_transit >= 0),
  UNIQUE(tenant_id, product_id)
);

-- Indexes (Critical for lookup)
CREATE INDEX idx_inventory_tenant_product ON inventory(tenant_id, product_id);
CREATE INDEX idx_inventory_low_stock ON inventory(tenant_id) 
  WHERE qty_on_hand <= low_stock_threshold;
CREATE INDEX idx_inventory_last_updated ON inventory(last_updated_at DESC);

-- Comments
COMMENT ON COLUMN inventory.qty_on_hand IS 'Current stock. Can be decimal for loose products (e.g., 12.457 kg sugar).';
COMMENT ON COLUMN inventory.qty_reserved IS 'Reserved for pending orders. Calculated from open orders.';
```

### INVENTORY_TRANSACTIONS Table (Audit Trail)

```sql
CREATE TABLE IF NOT EXISTS inventory_transactions (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tenant Reference
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Product Reference
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Transaction Type
  transaction_type inventory_transaction_type NOT NULL,
  
  -- Quantity Change (can be positive or negative)
  quantity_change DECIMAL(15,3) NOT NULL,
  unit VARCHAR(20),
  
  -- Context
  reason VARCHAR(500),  -- Why was this adjustment made?
  reference_id UUID NULLABLE,  -- sale_id, purchase_order_id, etc.
  reference_type VARCHAR(50),  -- 'SALE', 'RESTOCK', 'PHYSICAL_COUNT'
  
  -- Who did it?
  created_by_user_id UUID NULLABLE REFERENCES users(id) ON DELETE SET NULL,
  user_name VARCHAR(255),
  
  -- Timestamp
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT non_zero_quantity CHECK (quantity_change != 0)
);

-- Indexes
CREATE INDEX idx_inv_trans_tenant ON inventory_transactions(tenant_id, created_at DESC);
CREATE INDEX idx_inv_trans_product ON inventory_transactions(product_id, created_at DESC);
CREATE INDEX idx_inv_trans_type ON inventory_transactions(transaction_type);
CREATE INDEX idx_inv_trans_reference ON inventory_transactions(reference_type, reference_id);

-- Comments
COMMENT ON TABLE inventory_transactions IS 'Immutable audit trail. Every stock change logged here.';
COMMENT ON COLUMN inventory_transactions.quantity_change IS 'Negative = decrease. Positive = increase.';
```

### PHYSICAL_INVENTORY_COUNTS Table (Discrepancy Detection)

```sql
CREATE TABLE IF NOT EXISTS physical_inventory_counts (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tenant Reference
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Product Reference
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Counts
  system_quantity DECIMAL(15,3) NOT NULL,  -- What system says
  physical_count DECIMAL(15,3) NOT NULL,  -- What manager counted
  discrepancy DECIMAL(15,3),  -- physical - system (can be negative)
  
  -- Details
  count_reason VARCHAR(500),  -- 'Monthly audit', 'Suspected theft', 'Damage discovery'
  performed_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  
  -- Timestamp
  count_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_physical_counts_tenant ON physical_inventory_counts(tenant_id);
CREATE INDEX idx_physical_counts_discrepancy ON physical_inventory_counts(tenant_id)
  WHERE discrepancy != 0;  -- Find issues

-- Comments
COMMENT ON TABLE physical_inventory_counts IS 'Manager manually counts stock. Detected discrepancies vs system.';
```

---

## Phase 4: POS Terminal Tables

### TERMINALS Table

```sql
CREATE TABLE IF NOT EXISTS terminals (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tenant Reference
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Terminal Info
  terminal_name VARCHAR(100) NOT NULL,
  terminal_number INTEGER NOT NULL,  -- 1, 2, 3, etc.
  location VARCHAR(255),  -- "Counter 1", "Front Desk"
  
  -- Hardware Info
  device_id VARCHAR(255) NULLABLE,  -- Browser-based, so optional
  last_ip_address VARCHAR(45),
  last_connected_at TIMESTAMP,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  status VARCHAR(50),  -- ONLINE, OFFLINE, ERROR
  
  -- Audit
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_terminal_number CHECK (terminal_number > 0),
  UNIQUE(tenant_id, terminal_number),
  UNIQUE(tenant_id, terminal_name)
);

-- Indexes
CREATE INDEX idx_terminals_tenant ON terminals(tenant_id);
CREATE INDEX idx_terminals_status ON terminals(tenant_id, status);

-- Comments
COMMENT ON TABLE terminals IS 'POS devices/browsers. Subscription plan limits terminal_count.';
```

### SALES Table (Transactions)

```sql
CREATE TABLE IF NOT EXISTS sales (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tenant Reference (CRITICAL)
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Terminal Reference
  terminal_id UUID NOT NULL REFERENCES terminals(id) ON DELETE RESTRICT,
  
  -- User Reference (Who processed sale)
  cashier_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  cashier_name VARCHAR(255),
  
  -- Sale Amounts
  subtotal DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  discount_reason VARCHAR(255),  -- Loyalty code, damaged item, etc.
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  
  -- Currency
  currency VARCHAR(3) DEFAULT 'INR',
  
  -- Payment
  payment_method payment_method NOT NULL,
  payment_reference VARCHAR(255),  -- Card last 4, UPI ID, etc.
  
  -- Sale Status
  status sale_status DEFAULT 'COMPLETED',
  
  -- Comments
  notes VARCHAR(500),
  
  -- Audit
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_amounts CHECK (subtotal >= 0 AND discount_amount >= 0 AND tax_amount >= 0),
  CONSTRAINT valid_total CHECK (total >= 0),
  CONSTRAINT total_calculation CHECK (total = subtotal - discount_amount + tax_amount OR total = 0)
);

-- Indexes (for reporting)
CREATE INDEX idx_sales_tenant ON sales(tenant_id);
CREATE INDEX idx_sales_tenant_created ON sales(tenant_id, created_at DESC);
CREATE INDEX idx_sales_terminal ON sales(terminal_id);
CREATE INDEX idx_sales_cashier ON sales(cashier_id);
CREATE INDEX idx_sales_payment_method ON sales(payment_method);
CREATE INDEX idx_sales_status ON sales(status);

-- Comments
COMMENT ON TABLE sales IS 'Every transaction from POS terminal. Immutable once created.';
COMMENT ON COLUMN sales.cashier_id IS 'Who processed the sale. Auditable.';
```

### SALE_ITEMS Table (Line Items with Product Snapshots)

```sql
CREATE TABLE IF NOT EXISTS sale_items (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  
  -- Product Reference
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  
  -- Product Snapshot (what was true at sale time)
  product_name VARCHAR(255) NOT NULL,
  product_sku VARCHAR(100),
  product_snapshot JSONB,  -- {category, supplier, image_url, ...}
  
  -- Pricing at time of sale
  unit_price DECIMAL(10,2) NOT NULL,  -- Price per unit
  quantity DECIMAL(10,3) NOT NULL,  -- Can be decimal for loose products (0.457 kg)
  quantity_unit VARCHAR(20),  -- kg, liter, piece
  
  -- Line-level discount
  line_discount DECIMAL(10,2) DEFAULT 0,
  discount_reason VARCHAR(255),  -- Item-specific discount
  
  -- Line-level tax
  line_tax DECIMAL(10,2) DEFAULT 0,
  
  -- Totals
  line_subtotal DECIMAL(10,2),  -- unit_price × quantity
  line_total DECIMAL(10,2),  -- After discount and tax
  
  -- Constraints
  CONSTRAINT valid_quantity CHECK (quantity > 0),
  CONSTRAINT valid_prices CHECK (unit_price >= 0)
);

-- Indexes
CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON sale_items(product_id);

-- Comments
COMMENT ON COLUMN sale_items.product_snapshot IS 'JSONB copy of product state at sale time. Preserves price history.';
COMMENT ON COLUMN sale_items.quantity IS 'Decimal for loose products. E.g., 0.457 for 457g sugar.';
```

### SALE_ADJUSTMENTS Table (Refunds, Exchanges, Late Discounts)

```sql
CREATE TABLE IF NOT EXISTS sale_adjustments (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tenant Reference
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Sale Reference
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  
  -- Adjustment Details
  adjustment_type VARCHAR(50),  -- REFUND, EXCHANGE, LATE_DISCOUNT, RETURN
  amount DECIMAL(10,2) NOT NULL,
  reason VARCHAR(500),  -- Customer complaint, damaged item, etc.
  
  -- Who approved it?
  created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  user_name VARCHAR(255),
  
  -- Timestamp
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_amount CHECK (amount > 0)
);

-- Indexes
CREATE INDEX idx_sale_adjustments_sale ON sale_adjustments(sale_id);
CREATE INDEX idx_sale_adjustments_tenant ON sale_adjustments(tenant_id, created_at DESC);

-- Comments
COMMENT ON TABLE sale_adjustments IS 'Track refunds, exchanges, and late discounts. Keeps original sale intact.';
```

---

## Phase 5: Reporting & Analytics Tables

### HOURLY_SALES_SUMMARY Table (Real-Time Analytics)

```sql
CREATE TABLE IF NOT EXISTS hourly_sales_summary (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tenant Reference
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Time Bucket
  hour_start TIMESTAMP NOT NULL,  -- Start of hour (e.g., 2024-01-15 14:00:00)
  hour_end TIMESTAMP NOT NULL,
  
  -- Aggregated Metrics
  total_revenue DECIMAL(12,2),
  transaction_count INTEGER,
  avg_order_value DECIMAL(10,2),
  
  -- Payment breakdown
  cash_count INTEGER,
  card_count INTEGER,
  upi_count INTEGER,
  
  -- Status breakdown
  completed_count INTEGER,
  refunded_count INTEGER,
  cancelled_count INTEGER,
  
  -- Unique constraint (prevent duplicates)
  UNIQUE(tenant_id, hour_start)
);

-- Indexes
CREATE INDEX idx_hourly_summary_tenant ON hourly_sales_summary(tenant_id, hour_start DESC);

-- Comments
COMMENT ON TABLE hourly_sales_summary IS 'Pre-aggregated hourly data. Refreshed every hour via background job.';
```

### DAILY_SALES_SUMMARY Table (Historical Analytics)

```sql
CREATE TABLE IF NOT EXISTS daily_sales_summary (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tenant Reference
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Date
  sale_date DATE NOT NULL,
  
  -- Aggregated Metrics
  total_revenue DECIMAL(12,2),
  transaction_count INTEGER,
  avg_order_value DECIMAL(10,2),
  
  -- Payment breakdown
  cash_revenue DECIMAL(12,2),
  card_revenue DECIMAL(12,2),
  upi_revenue DECIMAL(12,2),
  
  -- Refund tracking
  refund_count INTEGER,
  refund_amount DECIMAL(12,2),
  
  -- Timestamp
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Unique constraint
  UNIQUE(tenant_id, sale_date)
);

-- Indexes
CREATE INDEX idx_daily_summary_tenant ON daily_sales_summary(tenant_id, sale_date DESC);

-- Comments
COMMENT ON TABLE daily_sales_summary IS 'Pre-aggregated daily data. Refreshed overnight via cron job.';
```

### PRODUCT_SALES_SUMMARY Table (Product Performance)

```sql
CREATE TABLE IF NOT EXISTS product_sales_summary (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tenant Reference
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Product Reference
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Date
  summary_date DATE NOT NULL,
  
  -- Metrics
  total_quantity_sold DECIMAL(15,3),  -- Can be decimal for loose products
  total_revenue DECIMAL(12,2),
  avg_unit_price DECIMAL(10,2),
  transaction_count INTEGER,
  
  -- Timestamp
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Unique constraint
  UNIQUE(tenant_id, product_id, summary_date)
);

-- Indexes
CREATE INDEX idx_product_summary_tenant ON product_sales_summary(tenant_id);
CREATE INDEX idx_product_summary_date ON product_sales_summary(summary_date DESC);

-- Comments
COMMENT ON TABLE product_sales_summary IS 'Top-selling products by date. Used for dashboard charts.';
```

---

## Phase 6: AI Restocking Agent Tables

### PRODUCT_SALES_HISTORY Table (AI Training Data)

```sql
CREATE TABLE IF NOT EXISTS product_sales_history (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tenant Reference
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Product Reference
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Sales Data
  sale_date DATE NOT NULL,
  quantity_sold DECIMAL(15,3),  -- Decimal for loose products
  revenue DECIMAL(12,2),
  
  -- Calculated Metrics
  daily_velocity DECIMAL(10,3),  -- Units sold per day
  
  -- Timestamp
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sales_history_tenant_product ON product_sales_history(tenant_id, product_id, sale_date DESC);
CREATE INDEX idx_sales_history_date_range ON product_sales_history(tenant_id, sale_date DESC);

-- Comments
COMMENT ON TABLE product_sales_history IS 'Historical sales data for AI demand forecasting.';
```

### PURCHASE_ORDER_SUGGESTIONS Table (AI Recommendations)

```sql
CREATE TABLE IF NOT EXISTS purchase_order_suggestions (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tenant Reference
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Product Reference
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_name VARCHAR(255),
  
  -- Current State
  current_stock DECIMAL(15,3),
  
  -- Demand Forecast (from AI)
  predicted_monthly_demand DECIMAL(15,3),
  predicted_monthly_revenue DECIMAL(12,2),
  
  -- Recommendation
  recommended_order_qty DECIMAL(15,3),
  
  -- Urgency Assessment
  urgency urgency_level,  -- CRITICAL, HIGH, MEDIUM, LOW
  
  -- AI Reasoning (why this recommendation)
  ai_analysis JSONB,  -- {reasoning: "...", confidence: 0.95, ...}
  
  -- User Actions
  status VARCHAR(50) DEFAULT 'PENDING',  -- PENDING, ORDERED, SNOOZED, DISMISSED
  
  -- Metadata
  generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Timestamp
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_suggestions_tenant ON purchase_order_suggestions(tenant_id, created_at DESC);
CREATE INDEX idx_suggestions_urgency ON purchase_order_suggestions(urgency);
CREATE INDEX idx_suggestions_status ON purchase_order_suggestions(status);

-- Comments
COMMENT ON TABLE purchase_order_suggestions IS 'AI-generated restocking recommendations. Shows urgency level.';
COMMENT ON COLUMN purchase_order_suggestions.ai_analysis IS 'JSONB with AI reasoning, confidence score, and formula used.';
```

---

## Phase 7: RBAC & User Management Tables

### ROLES Table

```sql
CREATE TABLE IF NOT EXISTS roles (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Role Details
  name user_role NOT NULL UNIQUE,
  description VARCHAR(500),
  
  -- System Level
  is_system_role BOOLEAN DEFAULT false,  -- Cannot be deleted
  
  -- Timestamp
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Sample data (immutable roles)
INSERT INTO roles (name, description, is_system_role) VALUES
('SUPER_ADMIN', 'Platform administrator. Full access to all features and all tenants.', true),
('OWNER', 'Business owner. Full access to their business dashboard and features.', true),
('MANAGER', 'Store manager. Can manage inventory, view reports, manage cashiers.', true),
('CASHIER', 'POS cashier. Can process sales and view their own transactions.', true);
```

### PERMISSIONS Table

```sql
CREATE TABLE IF NOT EXISTS permissions (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Permission Details
  name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(500),
  
  -- Resource
  resource VARCHAR(50),  -- 'sales', 'products', 'users', 'billing', 'reports'
  action permission_action NOT NULL,  -- VIEW, CREATE, UPDATE, DELETE, EXPORT
  
  -- Timestamp
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Sample data
INSERT INTO permissions (name, description, resource, action) VALUES
('view_sales', 'View sales transactions', 'sales', 'VIEW'),
('create_sale', 'Create POS sales', 'sales', 'CREATE'),
('view_inventory', 'View inventory levels', 'products', 'VIEW'),
('edit_inventory', 'Adjust inventory', 'products', 'UPDATE'),
('manage_users', 'Add/remove team members', 'users', 'CREATE'),
('view_billing', 'View subscription and invoices', 'billing', 'VIEW'),
('manage_billing', 'Change subscription plan', 'billing', 'UPDATE'),
('view_reports', 'View analytics and reports', 'reports', 'VIEW'),
('export_reports', 'Download reports as PDF/CSV', 'reports', 'EXPORT'),
('manage_settings', 'Edit business settings', 'settings', 'UPDATE'),
('trigger_ai_agent', 'Generate restocking recommendations', 'ai', 'CREATE'),
('view_audit_logs', 'View activity audit trail', 'audit', 'VIEW'),
('manage_roles', 'Create/edit custom roles', 'roles', 'UPDATE'),
('view_all_tenants', 'View all businesses (admin only)', 'tenants', 'VIEW'),
('deactivate_tenant', 'Suspend business (admin only)', 'tenants', 'UPDATE');
```

### ROLE_PERMISSIONS Table (Junction)

```sql
CREATE TABLE IF NOT EXISTS role_permissions (
  -- Composite Primary Key
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  
  PRIMARY KEY (role_id, permission_id)
);

-- Sample data (define what each role can do)
INSERT INTO role_permissions (role_id, permission_id) VALUES
-- SUPER_ADMIN: Can do everything
((SELECT id FROM roles WHERE name = 'SUPER_ADMIN'), (SELECT id FROM permissions WHERE name = 'view_all_tenants')),
((SELECT id FROM roles WHERE name = 'SUPER_ADMIN'), (SELECT id FROM permissions WHERE name = 'deactivate_tenant')),
-- OWNER: Can manage their business
((SELECT id FROM roles WHERE name = 'OWNER'), (SELECT id FROM permissions WHERE name = 'view_sales')),
((SELECT id FROM roles WHERE name = 'OWNER'), (SELECT id FROM permissions WHERE name = 'create_sale')),
((SELECT id FROM roles WHERE name = 'OWNER'), (SELECT id FROM permissions WHERE name = 'view_inventory')),
((SELECT id FROM roles WHERE name = 'OWNER'), (SELECT id FROM permissions WHERE name = 'edit_inventory')),
((SELECT id FROM roles WHERE name = 'OWNER'), (SELECT id FROM permissions WHERE name = 'manage_users')),
((SELECT id FROM roles WHERE name = 'OWNER'), (SELECT id FROM permissions WHERE name = 'view_billing')),
((SELECT id FROM roles WHERE name = 'OWNER'), (SELECT id FROM permissions WHERE name = 'manage_billing')),
((SELECT id FROM roles WHERE name = 'OWNER'), (SELECT id FROM permissions WHERE name = 'view_reports')),
((SELECT id FROM roles WHERE name = 'OWNER'), (SELECT id FROM permissions WHERE name = 'manage_settings')),
((SELECT id FROM roles WHERE name = 'OWNER'), (SELECT id FROM permissions WHERE name = 'trigger_ai_agent')),
((SELECT id FROM roles WHERE name = 'OWNER'), (SELECT id FROM permissions WHERE name = 'view_audit_logs')),
-- MANAGER: Limited management
((SELECT id FROM roles WHERE name = 'MANAGER'), (SELECT id FROM permissions WHERE name = 'view_sales')),
((SELECT id FROM roles WHERE name = 'MANAGER'), (SELECT id FROM permissions WHERE name = 'view_inventory')),
((SELECT id FROM roles WHERE name = 'MANAGER'), (SELECT id FROM permissions WHERE name = 'edit_inventory')),
((SELECT id FROM roles WHERE name = 'MANAGER'), (SELECT id FROM permissions WHERE name = 'view_reports')),
((SELECT id FROM roles WHERE name = 'MANAGER'), (SELECT id FROM permissions WHERE name = 'trigger_ai_agent')),
-- CASHIER: Only POS
((SELECT id FROM roles WHERE name = 'CASHIER'), (SELECT id FROM permissions WHERE name = 'create_sale')),
((SELECT id FROM roles WHERE name = 'CASHIER'), (SELECT id FROM permissions WHERE name = 'view_sales'));
```

### TEAM_INVITATIONS Table (Invite New Members)

```sql
CREATE TABLE IF NOT EXISTS team_invitations (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tenant Reference
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Invitation Details
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role user_role NOT NULL,
  
  -- Token for OTP verification
  invitation_token VARCHAR(255) UNIQUE,
  
  -- Status
  status VARCHAR(50) DEFAULT 'PENDING',  -- PENDING, ACCEPTED, EXPIRED, CANCELLED
  accepted_at TIMESTAMP NULLABLE,
  
  -- Expiry
  expires_at TIMESTAMP NOT NULL,
  
  -- Who invited?
  invited_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  
  -- Timestamp
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_expiry CHECK (expires_at > created_at),
  UNIQUE(tenant_id, email)  -- One invitation per email per tenant
);

-- Indexes
CREATE INDEX idx_invitations_tenant ON team_invitations(tenant_id);
CREATE INDEX idx_invitations_status ON team_invitations(status);
CREATE INDEX idx_invitations_token ON team_invitations(invitation_token);

-- Comments
COMMENT ON TABLE team_invitations IS 'Pending team member invitations with OTP verification.';
```

---

## Phases 8-10: Advanced Features

### SUPPLIERS Table (Phase 8+)

```sql
CREATE TABLE IF NOT EXISTS suppliers (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tenant Reference
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Supplier Info
  name VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  address VARCHAR(500),
  
  -- Payment Terms
  payment_terms VARCHAR(100),  -- "NET 30", "COD"
  
  -- Metadata
  metadata JSONB,  -- {website: "...", tax_id: "...", ...}
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(tenant_id, name)
);

-- Indexes
CREATE INDEX idx_suppliers_tenant ON suppliers(tenant_id);
```

### PURCHASE_ORDERS Table (Phase 8+)

```sql
CREATE TABLE IF NOT EXISTS purchase_orders (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tenant Reference
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Supplier Reference
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  
  -- PO Details
  po_number VARCHAR(50),
  po_date DATE,
  expected_delivery_date DATE,
  
  -- Amounts
  subtotal DECIMAL(12,2),
  tax DECIMAL(12,2),
  total DECIMAL(12,2),
  
  -- Status
  status VARCHAR(50),  -- DRAFT, SENT, CONFIRMED, PARTIALLY_RECEIVED, RECEIVED, CANCELLED
  
  -- Notes
  notes VARCHAR(500),
  
  -- Audit
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(tenant_id, po_number),
  CONSTRAINT valid_amounts CHECK (subtotal >= 0 AND tax >= 0)
);

-- Indexes
CREATE INDEX idx_purchase_orders_tenant ON purchase_orders(tenant_id);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
```

### LOYALTY_PROGRAMS Table (Phase 10+)

```sql
CREATE TABLE IF NOT EXISTS loyalty_programs (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tenant Reference
  tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Program Details
  program_name VARCHAR(100),
  description VARCHAR(500),
  
  -- Points System
  points_per_rupee DECIMAL(5,2),  -- 1 point per ₹10 = 0.1
  redemption_rate DECIMAL(5,2),  -- 100 points = ₹100 = 1.0
  
  -- Status
  is_active BOOLEAN DEFAULT false,
  
  -- Timestamp
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Comments
COMMENT ON TABLE loyalty_programs IS 'Customer loyalty program configuration.';
```

---

## Complete ERD Diagram

```
MULTI-TENANT CORE
┌─────────────────┐
│    TENANTS      │
│                 │
│ id (PK)         │
│ business_name   │
│ phone           │
│ address         │
│ currency        │
│ timezone        │
│                 │
│ stripe_*        │ ←→ Stripe Integration
│ subscription_*  │
│ terminal_limit  │
│                 │
└────────┬────────┘
         │ 1:N
         │
    ┌────┴─────┬──────────┬────────────┬──────────────┐
    │           │          │            │              │
    ▼           ▼          ▼            ▼              ▼
┌───────┐  ┌────────┐  ┌────────┐  ┌───────┐  ┌──────────┐
│USERS  │  │ROLES   │  │PRODUCTS│  │SALES  │  │TERMINALS │
│       │  │        │  │        │  │       │  │          │
│id(PK) │  │id(PK)  │  │id(PK)  │  │id(PK) │  │id(PK)    │
│t.id✓  │  │name    │  │t.id✓   │  │t.id✓  │  │t.id✓     │
│email  │  │        │  │cat.id  │  │cashier│  │terminal_#│
│role   │  │        │  │sku     │  │items→ │  │location  │
│pwd    │  │        │  │price   │  │amount │  │status    │
│       │  │        │  │type    │  │method │  │          │
└───────┘  └───┬────┘  │basunit │  │       │  └──────────┘
              │        │        │  └───────┘
              │        │        │
              │    ┌───┴────┐   │
              │    │         │   │
              ▼    ▼         ▼   ▼
         ┌─────────────┐  ┌──────────┐
         │ ROLE_       │  │SALE_     │
         │ PERMISSIONS │  │ITEMS     │
         │             │  │(snapshot)│
         │ role_id✓    │  │product_* │
         │ perm_id✓    │  │quantity  │
         └─────────────┘  │price     │
                          └──────────┘

INVENTORY
┌──────────────────┐    ┌──────────────────┐
│   INVENTORY      │    │INVENTORY_        │
│                  │    │TRANSACTIONS      │
│ id (PK)          │    │                  │
│ t.id✓            │    │ id (PK)          │
│ product_id✓      │    │ t.id✓            │
│                  │    │ product_id✓      │
│ qty_on_hand      │    │ qty_change       │
│ qty_reserved     │    │ type             │
│ qty_in_transit   │    │ reason           │
│ low_threshold    │    │ user_id          │
│                  │    │ created_at       │
└──────────────────┘    └──────────────────┘

REPORTING
┌──────────────────────┐
│HOURLY_SALES_SUMMARY  │
│ id (PK)              │
│ t.id✓                │
│ hour_start           │
│ revenue              │
│ transaction_count    │
└──────────────────────┘
         │
         ▼
┌──────────────────────┐
│DAILY_SALES_SUMMARY   │
│ id (PK)              │
│ t.id✓                │
│ sale_date            │
│ revenue              │
│ transaction_count    │
└──────────────────────┘

AUDIT
┌──────────────────────┐
│  AUDIT_LOGS          │
│  id (PK)             │
│  t.id✓               │
│  user_id             │
│  event_type          │
│  resource_*          │
│  old_values (JSONB)  │
│  new_values (JSONB)  │
│  created_at          │
└──────────────────────┘

AI/BILLING
┌─────────────────────────┐    ┌──────────────────────┐
│PURCHASE_ORDER_           │    │SUBSCRIPTIONS         │
│SUGGESTIONS              │    │                      │
│                         │    │ id (PK)              │
│ id (PK)                 │    │ t.id✓ (UNIQUE)       │
│ t.id✓                   │    │ stripe_*             │
│ product_id✓             │    │ plan_type            │
│ current_stock           │    │ status               │
│ predicted_demand        │    │ current_period_*     │
│ recommended_qty         │    │ next_billing_date    │
│ urgency                 │    │                      │
│ ai_analysis (JSONB)     │    └──────────────────────┘
│                         │
└─────────────────────────┘
```

---

## Indexes Strategy

### Critical Indexes (Must Have)

```sql
-- MULTI-TENANCY (Every table needs this)
CREATE INDEX idx_products_tenant_id ON products(tenant_id);
CREATE INDEX idx_sales_tenant_id ON sales(tenant_id);
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_inventory_tenant_id ON inventory(tenant_id);

-- Foreign Key Performance
CREATE INDEX idx_sales_terminal_id ON sales(terminal_id);
CREATE INDEX idx_sale_items_product_id ON sale_items(product_id);
CREATE INDEX idx_products_category_id ON products(category_id);

-- Lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_barcode ON products(barcode);
```

### Performance Indexes (For Queries)

```sql
-- Time-range queries (very common in reports)
CREATE INDEX idx_sales_tenant_created ON sales(tenant_id, created_at DESC);
CREATE INDEX idx_audit_logs_created ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_inventory_trans_created ON inventory_transactions(tenant_id, created_at DESC);

-- Status filtering
CREATE INDEX idx_sales_status ON sales(status) WHERE status != 'COMPLETED';
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);

-- Payment method analysis
CREATE INDEX idx_sales_payment_method ON sales(payment_method);

-- Low stock detection (Partial index - only items below threshold)
CREATE INDEX idx_inventory_low_stock ON inventory(tenant_id)
  WHERE qty_on_hand <= low_stock_threshold;

-- Loose product sales (for demand forecasting)
CREATE INDEX idx_product_sales_history_date_range ON product_sales_history(tenant_id, sale_date DESC);
```

### Index Maintenance

```sql
-- Check index size
SELECT schemaname, tablename, indexname, pg_size_pretty(pg_relation_size(indexrelid))
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Find unused indexes
SELECT schemaname, tablename, indexname
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;

-- Reindex if fragmentation detected
REINDEX INDEX idx_sales_tenant_created;
```

---

## Flyway Migrations

### V1__Phase_1_Auth_And_MultiTenancy.sql

```sql
-- Create Enum Types
CREATE TYPE business_type AS ENUM ('RETAIL', 'FNB');
CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'INACTIVE', 'PAST_DUE', 'CANCELLED');
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'OWNER', 'MANAGER', 'CASHIER');
CREATE TYPE audit_event_type AS ENUM (
  'USER_LOGIN', 'USER_LOGOUT', 'USER_CREATED', 'USER_UPDATED', 'USER_DELETED',
  'SALE_COMPLETED', 'SALE_REFUNDED', 'SALE_CANCELLED',
  'PRODUCT_ADDED', 'PRODUCT_UPDATED', 'PRODUCT_DELETED',
  'INVENTORY_ADJUSTED', 'INVENTORY_COUNTED',
  'SUBSCRIPTION_CREATED', 'SUBSCRIPTION_CANCELLED', 'PAYMENT_PROCESSED',
  'REPORT_GENERATED', 'SETTINGS_CHANGED', 'TEAM_MEMBER_INVITED'
);

-- TENANTS Table
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name VARCHAR(255) NOT NULL,
  business_type business_type NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  gstin VARCHAR(15) UNIQUE,
  address_street VARCHAR(255) NOT NULL,
  address_city VARCHAR(100) NOT NULL,
  address_state VARCHAR(100) NOT NULL,
  address_pincode VARCHAR(10) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
  financial_year_start VARCHAR(10) NOT NULL DEFAULT 'APRIL',
  stripe_customer_id VARCHAR(255) UNIQUE,
  stripe_subscription_id VARCHAR(255),
  subscription_status subscription_status NOT NULL DEFAULT 'INACTIVE',
  terminal_limit INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by_user_id UUID,
  updated_by_user_id UUID,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_pincode CHECK (LENGTH(address_pincode) = 6),
  CONSTRAINT valid_phone CHECK (LENGTH(phone_number) = 10),
  CONSTRAINT non_negative_terminal_limit CHECK (terminal_limit >= 0)
);

CREATE INDEX idx_tenants_is_active ON tenants(is_active);
CREATE INDEX idx_tenants_stripe_customer_id ON tenants(stripe_customer_id);
CREATE INDEX idx_tenants_created_at ON tenants(created_at DESC);

-- USERS Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL,
  is_email_verified BOOLEAN NOT NULL DEFAULT false,
  email_verified_at TIMESTAMP,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMP,
  login_attempt_count INTEGER DEFAULT 0,
  is_locked BOOLEAN DEFAULT false,
  locked_until TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  UNIQUE(tenant_id, email)
);

CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tenant_email ON users(tenant_id, email);
CREATE INDEX idx_users_is_active ON users(tenant_id, is_active);
CREATE INDEX idx_users_role ON users(tenant_id, role);

-- AUDIT_LOGS Table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  user_role user_role,
  event_type audit_event_type NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  resource_name VARCHAR(255),
  action VARCHAR(50),
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  request_id VARCHAR(255),
  status VARCHAR(20),
  error_message VARCHAR(500),
  severity VARCHAR(20) DEFAULT 'INFO',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Insert sample data
INSERT INTO tenants (business_name, business_type, phone_number, address_street, address_city, address_state, address_pincode) VALUES
('Sharma General Store', 'RETAIL', '9876543210', '123 Market St', 'Mumbai', 'Maharashtra', '400001'),
('Ravi Enterprises', 'RETAIL', '8765432109', '456 Main Rd', 'Delhi', 'Delhi', '110001'),
('Priya Cafe', 'FNB', '7654321098', '789 Coffee Lane', 'Bangalore', 'Karnataka', '560001');
```

### V2__Phase_2_Stripe_Billing.sql

```sql
-- Create additional enum types
CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'INACTIVE', 'PAST_DUE', 'CANCELLED');
CREATE TYPE payment_method AS ENUM ('CASH', 'CARD', 'UPI', 'CHEQUE', 'WALLET');

-- SUBSCRIPTIONS Table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  stripe_customer_id VARCHAR(255) NOT NULL,
  stripe_subscription_id VARCHAR(255) NOT NULL UNIQUE,
  stripe_price_id VARCHAR(255) NOT NULL,
  plan_type VARCHAR(20) NOT NULL,
  plan_name VARCHAR(100),
  monthly_price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  terminal_limit INTEGER NOT NULL,
  current_period_start DATE NOT NULL,
  current_period_end DATE NOT NULL,
  next_billing_date DATE,
  status subscription_status NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancelled_at TIMESTAMP,
  cancellation_reason VARCHAR(500),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_terminal_limit CHECK (terminal_limit > 0),
  CONSTRAINT valid_price CHECK (monthly_price > 0)
);

CREATE INDEX idx_subscriptions_tenant ON subscriptions(tenant_id);
CREATE INDEX idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_next_billing ON subscriptions(next_billing_date);

-- PAYMENT_EVENTS Table
CREATE TABLE payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  stripe_event_id VARCHAR(255) NOT NULL UNIQUE,
  stripe_event_type VARCHAR(100),
  stripe_subscription_id VARCHAR(255),
  stripe_invoice_id VARCHAR(255),
  amount_cents DECIMAL(12,0) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50),
  webhook_payload JSONB NOT NULL,
  processed_at TIMESTAMP,
  idempotency_key VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_amount CHECK (amount_cents > 0)
);

CREATE INDEX idx_payment_events_tenant ON payment_events(tenant_id, created_at DESC);
CREATE INDEX idx_payment_events_stripe_id ON payment_events(stripe_event_id);
CREATE INDEX idx_payment_events_status ON payment_events(status);

-- INVOICES Table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  stripe_invoice_id VARCHAR(255) NOT NULL UNIQUE,
  stripe_subscription_id VARCHAR(255),
  invoice_number VARCHAR(50),
  amount_due DECIMAL(10,2) NOT NULL,
  amount_paid DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  invoice_date DATE,
  due_date DATE,
  paid_at TIMESTAMP,
  status VARCHAR(50),
  invoice_pdf_url VARCHAR(500),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoices_tenant ON invoices(tenant_id, created_at DESC);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_paid_at ON invoices(paid_at DESC);
```

### V3__Phase_3_Inventory_Management.sql

```sql
CREATE TYPE product_type AS ENUM ('PACKAGED', 'LOOSE', 'HYBRID');
CREATE TYPE inventory_transaction_type AS ENUM ('SALE', 'RESTOCK', 'ADJUSTMENT', 'RETURN', 'DAMAGE', 'LOSS');

-- CATEGORIES Table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(500),
  parent_category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

CREATE INDEX idx_categories_tenant ON categories(tenant_id);
CREATE INDEX idx_categories_parent ON categories(parent_category_id);

-- PRODUCTS Table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) NOT NULL,
  barcode VARCHAR(255),
  description VARCHAR(500),
  product_type product_type NOT NULL DEFAULT 'PACKAGED',
  unit_price DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'INR',
  package_quantity DECIMAL(10,3),
  package_unit VARCHAR(20),
  base_unit DECIMAL(10,3),
  base_unit_name VARCHAR(20),
  allows_loose_selling BOOLEAN DEFAULT false,
  allows_packaged_selling BOOLEAN DEFAULT false,
  is_trackable BOOLEAN DEFAULT true,
  reorder_level INTEGER DEFAULT 0,
  reorder_quantity INTEGER DEFAULT 0,
  metadata JSONB,
  is_active BOOLEAN DEFAULT true,
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_price CHECK (unit_price > 0),
  CONSTRAINT valid_cost CHECK (cost_price IS NULL OR cost_price > 0),
  CONSTRAINT valid_quantity CHECK (package_quantity IS NULL OR package_quantity > 0),
  UNIQUE(tenant_id, sku)
);

CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku ON products(tenant_id, sku);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_is_active ON products(tenant_id, is_active);
CREATE INDEX idx_products_type ON products(tenant_id, product_type);

-- INVENTORY Table
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  qty_on_hand DECIMAL(15,3) NOT NULL DEFAULT 0,
  qty_reserved DECIMAL(15,3) NOT NULL DEFAULT 0,
  qty_in_transit DECIMAL(15,3) NOT NULL DEFAULT 0,
  low_stock_threshold DECIMAL(15,3) NOT NULL DEFAULT 0,
  unit VARCHAR(20),
  last_updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT qty_consistency CHECK (qty_on_hand >= 0 AND qty_reserved >= 0 AND qty_in_transit >= 0),
  UNIQUE(tenant_id, product_id)
);

CREATE INDEX idx_inventory_tenant_product ON inventory(tenant_id, product_id);
CREATE INDEX idx_inventory_low_stock ON inventory(tenant_id)
  WHERE qty_on_hand <= low_stock_threshold;
CREATE INDEX idx_inventory_last_updated ON inventory(last_updated_at DESC);

-- INVENTORY_TRANSACTIONS Table
CREATE TABLE inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  transaction_type inventory_transaction_type NOT NULL,
  quantity_change DECIMAL(15,3) NOT NULL,
  unit VARCHAR(20),
  reason VARCHAR(500),
  reference_id UUID,
  reference_type VARCHAR(50),
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT non_zero_quantity CHECK (quantity_change != 0)
);

CREATE INDEX idx_inv_trans_tenant ON inventory_transactions(tenant_id, created_at DESC);
CREATE INDEX idx_inv_trans_product ON inventory_transactions(product_id, created_at DESC);
CREATE INDEX idx_inv_trans_type ON inventory_transactions(transaction_type);
CREATE INDEX idx_inv_trans_reference ON inventory_transactions(reference_type, reference_id);

-- PHYSICAL_INVENTORY_COUNTS Table
CREATE TABLE physical_inventory_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  system_quantity DECIMAL(15,3) NOT NULL,
  physical_count DECIMAL(15,3) NOT NULL,
  discrepancy DECIMAL(15,3),
  count_reason VARCHAR(500),
  performed_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  count_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_physical_counts_tenant ON physical_inventory_counts(tenant_id);
CREATE INDEX idx_physical_counts_discrepancy ON physical_inventory_counts(tenant_id)
  WHERE discrepancy != 0;
```

### V4__Phase_4_POS_Terminal.sql

```sql
CREATE TYPE sale_status AS ENUM ('COMPLETED', 'REFUNDED', 'CANCELLED', 'PENDING');
CREATE TYPE payment_method AS ENUM ('CASH', 'CARD', 'UPI', 'CHEQUE', 'WALLET');

-- TERMINALS Table
CREATE TABLE terminals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  terminal_name VARCHAR(100) NOT NULL,
  terminal_number INTEGER NOT NULL,
  location VARCHAR(255),
  device_id VARCHAR(255),
  last_ip_address VARCHAR(45),
  last_connected_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  status VARCHAR(50),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_terminal_number CHECK (terminal_number > 0),
  UNIQUE(tenant_id, terminal_number),
  UNIQUE(tenant_id, terminal_name)
);

CREATE INDEX idx_terminals_tenant ON terminals(tenant_id);
CREATE INDEX idx_terminals_status ON terminals(tenant_id, status);

-- SALES Table
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  terminal_id UUID NOT NULL REFERENCES terminals(id) ON DELETE RESTRICT,
  cashier_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  cashier_name VARCHAR(255),
  subtotal DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  discount_reason VARCHAR(255),
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  payment_method payment_method NOT NULL,
  payment_reference VARCHAR(255),
  status sale_status DEFAULT 'COMPLETED',
  notes VARCHAR(500),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_amounts CHECK (subtotal >= 0 AND discount_amount >= 0 AND tax_amount >= 0),
  CONSTRAINT valid_total CHECK (total >= 0)
);

CREATE INDEX idx_sales_tenant ON sales(tenant_id);
CREATE INDEX idx_sales_tenant_created ON sales(tenant_id, created_at DESC);
CREATE INDEX idx_sales_terminal ON sales(terminal_id);
CREATE INDEX idx_sales_cashier ON sales(cashier_id);
CREATE INDEX idx_sales_payment_method ON sales(payment_method);
CREATE INDEX idx_sales_status ON sales(status);

-- SALE_ITEMS Table
CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name VARCHAR(255) NOT NULL,
  product_sku VARCHAR(100),
  product_snapshot JSONB,
  unit_price DECIMAL(10,2) NOT NULL,
  quantity DECIMAL(10,3) NOT NULL,
  quantity_unit VARCHAR(20),
  line_discount DECIMAL(10,2) DEFAULT 0,
  discount_reason VARCHAR(255),
  line_tax DECIMAL(10,2) DEFAULT 0,
  line_subtotal DECIMAL(10,2),
  line_total DECIMAL(10,2),
  CONSTRAINT valid_quantity CHECK (quantity > 0),
  CONSTRAINT valid_prices CHECK (unit_price >= 0)
);

CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON sale_items(product_id);

-- SALE_ADJUSTMENTS Table
CREATE TABLE sale_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  adjustment_type VARCHAR(50),
  amount DECIMAL(10,2) NOT NULL,
  reason VARCHAR(500),
  created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  user_name VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_amount CHECK (amount > 0)
);

CREATE INDEX idx_sale_adjustments_sale ON sale_adjustments(sale_id);
CREATE INDEX idx_sale_adjustments_tenant ON sale_adjustments(tenant_id, created_at DESC);
```

### V5__Phase_5_Reporting_Analytics.sql

```sql
-- HOURLY_SALES_SUMMARY Table
CREATE TABLE hourly_sales_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  hour_start TIMESTAMP NOT NULL,
  hour_end TIMESTAMP NOT NULL,
  total_revenue DECIMAL(12,2),
  transaction_count INTEGER,
  avg_order_value DECIMAL(10,2),
  cash_count INTEGER,
  card_count INTEGER,
  upi_count INTEGER,
  completed_count INTEGER,
  refunded_count INTEGER,
  cancelled_count INTEGER,
  UNIQUE(tenant_id, hour_start)
);

CREATE INDEX idx_hourly_summary_tenant ON hourly_sales_summary(tenant_id, hour_start DESC);

-- DAILY_SALES_SUMMARY Table
CREATE TABLE daily_sales_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sale_date DATE NOT NULL,
  total_revenue DECIMAL(12,2),
  transaction_count INTEGER,
  avg_order_value DECIMAL(10,2),
  cash_revenue DECIMAL(12,2),
  card_revenue DECIMAL(12,2),
  upi_revenue DECIMAL(12,2),
  refund_count INTEGER,
  refund_amount DECIMAL(12,2),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, sale_date)
);

CREATE INDEX idx_daily_summary_tenant ON daily_sales_summary(tenant_id, sale_date DESC);

-- PRODUCT_SALES_SUMMARY Table
CREATE TABLE product_sales_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  summary_date DATE NOT NULL,
  total_quantity_sold DECIMAL(15,3),
  total_revenue DECIMAL(12,2),
  avg_unit_price DECIMAL(10,2),
  transaction_count INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, product_id, summary_date)
);

CREATE INDEX idx_product_summary_tenant ON product_sales_summary(tenant_id);
CREATE INDEX idx_product_summary_date ON product_sales_summary(summary_date DESC);
```

### V6__Phase_6_AI_Restocking.sql

```sql
CREATE TYPE urgency_level AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- PRODUCT_SALES_HISTORY Table
CREATE TABLE product_sales_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sale_date DATE NOT NULL,
  quantity_sold DECIMAL(15,3),
  revenue DECIMAL(12,2),
  daily_velocity DECIMAL(10,3),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sales_history_tenant_product ON product_sales_history(tenant_id, product_id, sale_date DESC);
CREATE INDEX idx_sales_history_date_range ON product_sales_history(tenant_id, sale_date DESC);

-- PURCHASE_ORDER_SUGGESTIONS Table
CREATE TABLE purchase_order_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_name VARCHAR(255),
  current_stock DECIMAL(15,3),
  predicted_monthly_demand DECIMAL(15,3),
  predicted_monthly_revenue DECIMAL(12,2),
  recommended_order_qty DECIMAL(15,3),
  urgency urgency_level,
  ai_analysis JSONB,
  status VARCHAR(50) DEFAULT 'PENDING',
  generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_suggestions_tenant ON purchase_order_suggestions(tenant_id, created_at DESC);
CREATE INDEX idx_suggestions_urgency ON purchase_order_suggestions(urgency);
CREATE INDEX idx_suggestions_status ON purchase_order_suggestions(status);
```

### V7__Phase_7_RBAC_User_Management.sql

```sql
CREATE TYPE permission_action AS ENUM ('VIEW', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT');

-- ROLES Table
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name user_role NOT NULL UNIQUE,
  description VARCHAR(500),
  is_system_role BOOLEAN DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- PERMISSIONS Table
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(500),
  resource VARCHAR(50),
  action permission_action NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ROLE_PERMISSIONS Table
CREATE TABLE role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- TEAM_INVITATIONS Table
CREATE TABLE team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role user_role NOT NULL,
  invitation_token VARCHAR(255) UNIQUE,
  status VARCHAR(50) DEFAULT 'PENDING',
  accepted_at TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  invited_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_expiry CHECK (expires_at > created_at),
  UNIQUE(tenant_id, email)
);

CREATE INDEX idx_invitations_tenant ON team_invitations(tenant_id);
CREATE INDEX idx_invitations_status ON team_invitations(status);
CREATE INDEX idx_invitations_token ON team_invitations(invitation_token);

-- Insert sample roles and permissions
INSERT INTO roles (name, description, is_system_role) VALUES
('SUPER_ADMIN', 'Platform administrator', true),
('OWNER', 'Business owner', true),
('MANAGER', 'Store manager', true),
('CASHIER', 'POS cashier', true);

INSERT INTO permissions (name, description, resource, action) VALUES
('view_sales', 'View sales transactions', 'sales', 'VIEW'),
('create_sale', 'Create POS sales', 'sales', 'CREATE'),
('view_inventory', 'View inventory levels', 'products', 'VIEW'),
('edit_inventory', 'Adjust inventory', 'products', 'UPDATE'),
('manage_users', 'Add/remove team members', 'users', 'CREATE'),
('view_billing', 'View subscription and invoices', 'billing', 'VIEW'),
('manage_billing', 'Change subscription plan', 'billing', 'UPDATE'),
('view_reports', 'View analytics and reports', 'reports', 'VIEW'),
('export_reports', 'Download reports as PDF/CSV', 'reports', 'EXPORT'),
('manage_settings', 'Edit business settings', 'settings', 'UPDATE'),
('trigger_ai_agent', 'Generate restocking recommendations', 'ai', 'CREATE'),
('view_audit_logs', 'View activity audit trail', 'audit', 'VIEW'),
('manage_roles', 'Create/edit custom roles', 'roles', 'UPDATE'),
('view_all_tenants', 'View all businesses (admin only)', 'tenants', 'VIEW'),
('deactivate_tenant', 'Suspend business (admin only)', 'tenants', 'UPDATE');
```

---

## Sample Data

### Insert Sample Test Data

```sql
-- Insert sample tenants (from V1)
INSERT INTO tenants (business_name, business_type, phone_number, address_street, address_city, address_state, address_pincode) 
VALUES ('Sharma General Store', 'RETAIL', '9876543210', '123 Market St', 'Mumbai', 'Maharashtra', '400001');

-- Insert sample users
INSERT INTO users (tenant_id, full_name, email, password_hash, role, is_email_verified, email_verified_at)
SELECT id, 'Sharma', 'sharma@example.com', '$2a$12$...', 'OWNER', true, NOW()
FROM tenants WHERE business_name = 'Sharma General Store';

-- Insert sample categories
INSERT INTO categories (tenant_id, name, description)
SELECT id, 'Groceries', 'Food items and grocery products'
FROM tenants WHERE business_name = 'Sharma General Store';

-- Insert sample products (packaged)
INSERT INTO products (tenant_id, category_id, name, sku, product_type, unit_price, package_quantity, package_unit, allows_packaged_selling)
SELECT t.id, c.id, 'Sugar 5kg Bag', 'SUGAR-5KG-BAG', 'PACKAGED', 450.00, 5, 'kg', true
FROM tenants t, categories c
WHERE t.business_name = 'Sharma General Store' AND c.name = 'Groceries' AND c.tenant_id = t.id;

-- Insert sample products (loose)
INSERT INTO products (tenant_id, category_id, name, sku, product_type, unit_price, base_unit, base_unit_name, allows_loose_selling)
SELECT t.id, c.id, 'Sugar Loose (per kg)', 'SUGAR-LOOSE-KG', 'LOOSE', 112.00, 1, 'kg', true
FROM tenants t, categories c
WHERE t.business_name = 'Sharma General Store' AND c.name = 'Groceries' AND c.tenant_id = t.id;

-- Insert sample inventory
INSERT INTO inventory (tenant_id, product_id, qty_on_hand, low_stock_threshold, unit)
SELECT t.id, p.id, 20, 5, 'unit'
FROM tenants t, products p
WHERE t.business_name = 'Sharma General Store' AND p.sku = 'SUGAR-5KG-BAG' AND p.tenant_id = t.id;

-- Insert sample terminals
INSERT INTO terminals (tenant_id, terminal_name, terminal_number, location, is_active, status)
SELECT id, 'Counter 1', 1, 'Front Desk', true, 'ONLINE'
FROM tenants WHERE business_name = 'Sharma General Store';
```

---

## Query Performance Guide

### Common Queries & Optimization

```sql
-- QUERY 1: Get today's sales for a tenant (Common - fast)
SELECT id, total, payment_method, created_at
FROM sales
WHERE tenant_id = 'tenant-uuid-001'
  AND DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;
-- Uses: idx_sales_tenant_created
-- Expected: < 100ms for 1000 rows

-- QUERY 2: Find low stock products
SELECT p.id, p.name, p.sku, i.qty_on_hand, i.low_stock_threshold
FROM products p
JOIN inventory i ON p.id = i.product_id
WHERE p.tenant_id = 'tenant-uuid-001'
  AND i.qty_on_hand <= i.low_stock_threshold;
-- Uses: idx_inventory_low_stock
-- Expected: < 50ms

-- QUERY 3: Revenue by payment method (last 30 days)
SELECT 
  payment_method,
  COUNT(*) as transaction_count,
  SUM(total) as total_revenue
FROM sales
WHERE tenant_id = 'tenant-uuid-001'
  AND created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY payment_method
ORDER BY total_revenue DESC;
-- Uses: idx_sales_tenant_created
-- Expected: < 500ms for 30K rows

-- QUERY 4: Top-selling products (monthly)
SELECT 
  p.id,
  p.name,
  p.sku,
  SUM(si.quantity) as total_quantity,
  SUM(si.line_total) as total_revenue
FROM products p
LEFT JOIN sale_items si ON p.id = si.product_id
LEFT JOIN sales s ON si.sale_id = s.id
WHERE p.tenant_id = 'tenant-uuid-001'
  AND s.created_at >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY p.id, p.name, p.sku
ORDER BY total_quantity DESC
LIMIT 10;
-- Uses: indexes on products, sales
-- Alternative: Use daily_sales_summary for faster results

-- QUERY 5: Inventory discrepancies (for audit)
SELECT 
  p.name,
  pic.system_quantity,
  pic.physical_count,
  pic.discrepancy,
  u.full_name as counted_by
FROM physical_inventory_counts pic
JOIN products p ON pic.product_id = p.id
LEFT JOIN users u ON pic.performed_by_user_id = u.id
WHERE pic.tenant_id = 'tenant-uuid-001'
  AND pic.discrepancy != 0
ORDER BY pic.count_date DESC;
-- Uses: idx_physical_counts_discrepancy
-- Expected: < 50ms

-- QUERY 6: Sales by loose vs packaged products (for analytics)
SELECT 
  p.product_type,
  COUNT(DISTINCT si.sale_id) as transactions,
  SUM(si.quantity) as total_quantity,
  SUM(si.line_total) as total_revenue
FROM sale_items si
JOIN products p ON si.product_id = p.id
WHERE p.tenant_id = 'tenant-uuid-001'
  AND si.sale_id IN (
    SELECT id FROM sales WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
  )
GROUP BY p.product_type;
-- Uses: idx_products_type
-- Expected: < 200ms
```

---

**End of Schema Document**

This is a complete, production-ready database schema for QuantPOS covering all 10 phases!