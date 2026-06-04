
-- ENUM types required by inventory tables
CREATE TYPE product_type AS ENUM ('PACKAGED', 'LOOSE', 'HYBRID');
CREATE TYPE inventory_transaction_type AS ENUM (
  'PURCHASE',
  'SALE',
  'ADJUSTMENT',
  'RETURN',
  'DAMAGE',
  'TRANSFER',
  'PHYSICAL_COUNT'
);

CREATE TABLE IF NOT EXISTS categories (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tenant Reference
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Category Info
  name VARCHAR(100) NOT NULL,
  description VARCHAR(500),
  
  -- Optional parent category (for nested categories)
  parent_category_id UUID NULL REFERENCES categories(id) ON DELETE SET NULL,
  
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





CREATE TABLE IF NOT EXISTS products (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tenant Reference (CRITICAL)
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Category Reference
  category_id UUID NULL REFERENCES categories(id) ON DELETE SET NULL,
  
  -- Basic Info
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) NOT NULL,
  barcode VARCHAR(255) NULL,
  description VARCHAR(500),
  
  -- Product Type (determines pricing logic)
  product_type product_type NOT NULL DEFAULT 'PACKAGED',
  -- PACKAGED: Fixed quantity (e.g., 5kg sugar box)
  -- LOOSE: By weight/volume (e.g., sugar from container)
  -- HYBRID: Both options available
  
  -- Standard Pricing (always present)
  unit_price DECIMAL(10,2) NOT NULL,  -- Price per unit (kg, liter, piece)
  cost_price DECIMAL(10,2) NULL,  -- Cost to business
  currency VARCHAR(3) DEFAULT 'INR',
  
  -- For PACKAGED products
  package_quantity DECIMAL(10,3) NULL,  -- 5 (kg)
  package_unit VARCHAR(20) NULL,  -- kg, liter, piece
  
  -- For LOOSE products (dynamic pricing)
  base_unit DECIMAL(10,3) NULL,  -- 1 (kg)
  base_unit_name VARCHAR(20) NULL,  -- kg, liter, meter
  allows_loose_selling BOOLEAN DEFAULT false,
  
  -- For HYBRID products
  allows_packaged_selling BOOLEAN DEFAULT false,
  
  -- Stock Management
  is_trackable BOOLEAN DEFAULT true,  -- If false, no inventory tracking
  reorder_level INTEGER DEFAULT 0,
  reorder_quantity INTEGER DEFAULT 0,
  
  -- Metadata (flexible schema)
  metadata JSONB,  -- {supplier: "...", image_url: "...", tags: [...]}
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_by_user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  updated_by_user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_price CHECK (unit_price > 0),
  CONSTRAINT valid_cost CHECK (cost_price IS NULL OR cost_price > 0),
  CONSTRAINT valid_quantity CHECK (package_quantity IS NULL OR package_quantity > 0),
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
COMMENT ON COLUMN products.product_type IS 'PACKAGED: Fixed qty (5kg). LOOSE: By weight. HYBRID: Both.';
COMMENT ON COLUMN products.unit_price IS 'Price per base unit (kg/liter/piece). Used in dynamic pricing calculations.';
COMMENT ON COLUMN products.base_unit IS 'For loose products: 1 (kg). For packaged: 5 (kg).';





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
  reference_id UUID NULL,  -- sale_id, purchase_order_id, etc.
  reference_type VARCHAR(50),  -- 'SALE', 'RESTOCK', 'PHYSICAL_COUNT'
  
  -- Who did it?
  created_by_user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
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
  performed_by_user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  
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



