
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



