-- V3__align_phase1_schema.sql

-- 1. Create ENUM Types
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
CREATE TYPE permission_action AS ENUM ('VIEW', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT');

-- 2. Alter tenants table
-- Drop CHECK constraints safely using Postgres DO block (in case names vary)
DO $$
DECLARE
    row record;
BEGIN
    FOR row IN SELECT conname FROM pg_constraint WHERE conrelid = 'tenants'::regclass AND contype = 'c' LOOP
        EXECUTE 'ALTER TABLE tenants DROP CONSTRAINT ' || quote_ident(row.conname);
    END LOOP;
END $$;

-- Drop defaults BEFORE altering type (PostgreSQL cannot auto-cast a varchar default to an enum)
ALTER TABLE tenants ALTER COLUMN business_type DROP DEFAULT;
ALTER TABLE tenants ALTER COLUMN business_type TYPE business_type USING business_type::business_type;

ALTER TABLE tenants ALTER COLUMN subscription_status DROP DEFAULT;
ALTER TABLE tenants ALTER COLUMN subscription_status TYPE subscription_status USING subscription_status::subscription_status;
-- Restore the default, now using the enum type
ALTER TABLE tenants ALTER COLUMN subscription_status SET DEFAULT 'INACTIVE'::subscription_status;

ALTER TABLE tenants ADD COLUMN created_by_user_id UUID NULL;
ALTER TABLE tenants ADD COLUMN updated_by_user_id UUID NULL;

-- 3. Alter users table
-- Drop CHECK constraints on users
DO $$
DECLARE
    row record;
BEGIN
    FOR row IN SELECT conname FROM pg_constraint WHERE conrelid = 'users'::regclass AND contype = 'c' LOOP
        EXECUTE 'ALTER TABLE users DROP CONSTRAINT ' || quote_ident(row.conname);
    END LOOP;
END $$;

-- Drop default on role before changing type
ALTER TABLE users ALTER COLUMN role DROP DEFAULT;
ALTER TABLE users ALTER COLUMN role TYPE user_role USING role::user_role;



-- Add new fields
ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN login_attempt_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN is_locked BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN locked_until TIMESTAMP NULL;

-- 4. Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  user_role user_role,
  event_type audit_event_type NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID NULL,
  resource_name VARCHAR(255) NULL,
  action VARCHAR(50),
  old_values JSONB NULL,
  new_values JSONB NULL,
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  request_id VARCHAR(255),
  status VARCHAR(20),
  error_message VARCHAR(500) NULL,
  severity VARCHAR(20) DEFAULT 'INFO',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
