
-- ENUM types required by POS terminal tables
CREATE TYPE payment_method AS ENUM ('CASH', 'CARD', 'UPI', 'WALLET', 'CREDIT', 'OTHER');
CREATE TYPE sale_status AS ENUM ('COMPLETED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'CANCELLED', 'VOID');

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
  device_id VARCHAR(255) NULL,  -- Browser-based, so optional
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



CREATE TABLE IF NOT EXISTS sales (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tenant Reference (CRITICAL)
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Terminal Reference
  terminal_id UUID NOT NULL REFERENCES terminals(id) ON DELETE RESTRICT,
  
  -- User Reference (Who processed sale)
  cashier_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
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
  created_by_user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
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



