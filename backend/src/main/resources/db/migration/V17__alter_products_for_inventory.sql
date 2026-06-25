-- V17__alter_products_for_inventory.sql

-- Add new columns for GST and Integer-based Pricing
ALTER TABLE products
  ADD COLUMN price_paise BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN cost_paise BIGINT,
  ADD COLUMN hsn_code VARCHAR(10),
  ADD COLUMN gst_rate DECIMAL(5,2) DEFAULT 0.00,
  ADD COLUMN gst_inclusive BOOLEAN DEFAULT true,
  ADD COLUMN unit_type VARCHAR(20) DEFAULT 'PIECE',  -- 'KG', 'GRAM', 'LITRE', 'ML', 'PIECE'
  ADD COLUMN price_per_unit_paise BIGINT,
  ADD COLUMN stock_quantity DECIMAL(15,3) DEFAULT 0,
  ADD COLUMN minimum_loose_quantity DECIMAL(15,3);

-- Convert existing data (assuming old columns existed and were decimals)
UPDATE products SET price_paise = CAST(unit_price * 100 AS BIGINT) WHERE unit_price IS NOT NULL;
UPDATE products SET cost_paise = CAST(cost_price * 100 AS BIGINT) WHERE cost_price IS NOT NULL;

-- Drop legacy float columns from V5
ALTER TABLE products 
  DROP COLUMN unit_price,
  DROP COLUMN cost_price,
  DROP COLUMN base_unit,
  DROP COLUMN base_unit_name;
