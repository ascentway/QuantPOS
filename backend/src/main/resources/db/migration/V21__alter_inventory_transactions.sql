-- Add missing columns to inventory_transactions table

ALTER TABLE inventory_transactions
    ADD COLUMN product_variant_id UUID,
    ADD COLUMN is_negative_stock_warning BOOLEAN DEFAULT false,
    ADD COLUMN status VARCHAR(50),
    ADD COLUMN approved_by_user_id UUID;

-- Add foreign key constraints
ALTER TABLE inventory_transactions
    ADD CONSTRAINT fk_inv_trans_variant FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_inv_trans_approved_by FOREIGN KEY (approved_by_user_id) REFERENCES users(id) ON DELETE SET NULL;
