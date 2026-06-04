
-- ENUM types required by AI restocking tables
CREATE TYPE urgency_level AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

CREATE TABLE IF NOT EXISTS product_sales_history (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tenant Reference
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Product Reference
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Sales Data
  sale_date DATE NOT NULL,
  quantity_sold DECIMAL(15,3),  -- Decimal for loose products
  revenue DECIMAL(12,2),
  
  -- Calculated Metrics
  daily_velocity DECIMAL(10,3),  -- Units sold per day
  
  -- Timestamp
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sales_history_tenant_product ON product_sales_history(tenant_id, product_id, sale_date DESC);
CREATE INDEX idx_sales_history_date_range ON product_sales_history(tenant_id, sale_date DESC);

-- Comments
COMMENT ON TABLE product_sales_history IS 'Historical sales data for AI demand forecasting.';



CREATE TABLE IF NOT EXISTS purchase_order_suggestions (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tenant Reference
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Product Reference
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_name VARCHAR(255),
  
  -- Current State
  current_stock DECIMAL(15,3),
  
  -- Demand Forecast (from AI)
  predicted_monthly_demand DECIMAL(15,3),
  predicted_monthly_revenue DECIMAL(12,2),
  
  -- Recommendation
  recommended_order_qty DECIMAL(15,3),
  
  -- Urgency Assessment
  urgency urgency_level,  -- CRITICAL, HIGH, MEDIUM, LOW
  
  -- AI Reasoning (why this recommendation)
  ai_analysis JSONB,  -- {reasoning: "...", confidence: 0.95, ...}
  
  -- User Actions
  status VARCHAR(50) DEFAULT 'PENDING',  -- PENDING, ORDERED, SNOOZED, DISMISSED
  
  -- Metadata
  generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Timestamp
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_suggestions_tenant ON purchase_order_suggestions(tenant_id, created_at DESC);
CREATE INDEX idx_suggestions_urgency ON purchase_order_suggestions(urgency);
CREATE INDEX idx_suggestions_status ON purchase_order_suggestions(status);

-- Comments
COMMENT ON TABLE purchase_order_suggestions IS 'AI-generated restocking recommendations. Shows urgency level.';
COMMENT ON COLUMN purchase_order_suggestions.ai_analysis IS 'JSONB with AI reasoning, confidence score, and formula used.';



