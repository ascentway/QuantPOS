CREATE TABLE inventory_batches (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    product_id UUID NOT NULL,
    product_variant_id UUID,
    batch_number VARCHAR(255),
    stock_quantity DECIMAL(15, 3),
    expiry_date DATE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_inventory_batches_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_inventory_batches_product FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT fk_inventory_batches_variant FOREIGN KEY (product_variant_id) REFERENCES product_variants(id)
);

CREATE INDEX idx_inventory_batches_tenant_id ON inventory_batches(tenant_id);
CREATE INDEX idx_inventory_batches_product_id ON inventory_batches(product_id);
CREATE INDEX idx_inventory_batches_expiry_date ON inventory_batches(expiry_date);
