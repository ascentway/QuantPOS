-- V24__comprehensive_schema_sync.sql
-- Adds ONLY the schema elements not yet covered by V20-V23.
-- V20: inventory_batches created (DONE)
-- V21: inventory_transactions columns added (DONE)
-- V22: user_permissions table created (DONE if ran, IF NOT EXISTS guards it)
-- V23: notifications table created (DONE if ran, IF NOT EXISTS guards it)
-- This migration adds remaining gaps: low_stock_threshold on product_variants and products

-- ─────────────────────────────────────────────────────────
-- 1. product_variants: add low_stock_threshold
-- ─────────────────────────────────────────────────────────
ALTER TABLE product_variants
    ADD COLUMN IF NOT EXISTS low_stock_threshold DECIMAL(15,3);

-- ─────────────────────────────────────────────────────────
-- 2. products: add low_stock_threshold (may be missing from V17)
-- ─────────────────────────────────────────────────────────
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS low_stock_threshold DECIMAL(15,3);

-- ─────────────────────────────────────────────────────────
-- 3. user_permissions: guard in case V22 did not run yet
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_permissions (
    user_id UUID NOT NULL,
    permission VARCHAR(255) NOT NULL,
    CONSTRAINT fk_user_permissions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (user_id, permission)
);

CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);

-- ─────────────────────────────────────────────────────────
-- 4. notifications: guard in case V23 did not run yet
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    reference_id UUID,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
