CREATE TABLE IF NOT EXISTS label_print_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    sku VARCHAR(255) NOT NULL,
    barcode VARCHAR(255) NOT NULL,
    weight DECIMAL(15,3),
    unit_type VARCHAR(50) NOT NULL,
    price DECIMAL(15,2) NOT NULL,
    printed_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_label_print_history_tenant ON label_print_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_label_print_history_user ON label_print_history(user_id);
CREATE INDEX IF NOT EXISTS idx_label_print_history_printed_at ON label_print_history(printed_at DESC);
