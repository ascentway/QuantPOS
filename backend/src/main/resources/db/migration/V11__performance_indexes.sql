-- V11__performance_indexes.sql
-- Missing composite indexes identified during system design audit (2026-06-04)
-- All use IF NOT EXISTS to be idempotent

-- ─────────────────────────────────────────────────────────────────
-- Sales table: additional composite indexes for reporting
-- ─────────────────────────────────────────────────────────────────

-- Filter by tenant + status (COMPLETED, REFUNDED, CANCELLED)
CREATE INDEX IF NOT EXISTS idx_sales_tenant_status
    ON sales(tenant_id, status);

-- Cashier performance reports: per-tenant, per-cashier timeline
CREATE INDEX IF NOT EXISTS idx_sales_tenant_cashier_created
    ON sales(tenant_id, cashier_id, created_at DESC);

-- Date-range reports within a tenant (status=COMPLETED subset)
CREATE INDEX IF NOT EXISTS idx_sales_tenant_created_status
    ON sales(tenant_id, created_at DESC, status);

-- ─────────────────────────────────────────────────────────────────
-- sale_items: per-tenant lookup (joins back to sales)
-- ─────────────────────────────────────────────────────────────────

-- Add tenant_id to sale_items for denormalization to allow fast tenant-scoped queries
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Backfill tenant_id from sales
UPDATE sale_items si
SET tenant_id = s.tenant_id
FROM sales s
WHERE si.sale_id = s.id AND si.tenant_id IS NULL;

-- Make it NOT NULL and add FK constraint
ALTER TABLE sale_items ALTER COLUMN tenant_id SET NOT NULL;
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_sale_items_tenant' AND table_name = 'sale_items'
    ) THEN
        ALTER TABLE sale_items ADD CONSTRAINT fk_sale_items_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Enables fast per-tenant item-level queries without touching sales table
CREATE INDEX IF NOT EXISTS idx_sale_items_tenant
    ON sale_items(tenant_id, sale_id);

-- Revenue-by-product across tenant (analytics)
CREATE INDEX IF NOT EXISTS idx_sale_items_tenant_product
    ON sale_items(tenant_id, product_id);

-- ─────────────────────────────────────────────────────────────────
-- inventory_transactions: ensure tenant-scoped history queries are fast
-- Already has idx_inv_trans_tenant but add created_at to support ranges
-- ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_inv_trans_tenant_created
    ON inventory_transactions(tenant_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────────
-- audit_logs: per-user history scoped to tenant
-- ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_user_created
    ON audit_logs(tenant_id, user_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────────
-- users: tenant-scoped role lookup (team management)
-- ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_users_tenant_role
    ON users(tenant_id, role);

CREATE INDEX IF NOT EXISTS idx_users_tenant_active
    ON users(tenant_id, is_active);
