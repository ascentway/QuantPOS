
CREATE TABLE IF NOT EXISTS hourly_sales_summary (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tenant Reference
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Time Bucket
  hour_start TIMESTAMP NOT NULL,  -- Start of hour (e.g., 2024-01-15 14:00:00)
  hour_end TIMESTAMP NOT NULL,
  
  -- Aggregated Metrics
  total_revenue DECIMAL(12,2),
  transaction_count INTEGER,
  avg_order_value DECIMAL(10,2),
  
  -- Payment breakdown
  cash_count INTEGER,
  card_count INTEGER,
  upi_count INTEGER,
  
  -- Status breakdown
  completed_count INTEGER,
  refunded_count INTEGER,
  cancelled_count INTEGER,
  
  -- Unique constraint (prevent duplicates)
  UNIQUE(tenant_id, hour_start)
);

-- Indexes
CREATE INDEX idx_hourly_summary_tenant ON hourly_sales_summary(tenant_id, hour_start DESC);

-- Comments
COMMENT ON TABLE hourly_sales_summary IS 'Pre-aggregated hourly data. Refreshed every hour via background job.';



CREATE TABLE IF NOT EXISTS daily_sales_summary (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tenant Reference
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Date
  sale_date DATE NOT NULL,
  
  -- Aggregated Metrics
  total_revenue DECIMAL(12,2),
  transaction_count INTEGER,
  avg_order_value DECIMAL(10,2),
  
  -- Payment breakdown
  cash_revenue DECIMAL(12,2),
  card_revenue DECIMAL(12,2),
  upi_revenue DECIMAL(12,2),
  
  -- Refund tracking
  refund_count INTEGER,
  refund_amount DECIMAL(12,2),
  
  -- Timestamp
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Unique constraint
  UNIQUE(tenant_id, sale_date)
);

-- Indexes
CREATE INDEX idx_daily_summary_tenant ON daily_sales_summary(tenant_id, sale_date DESC);

-- Comments
COMMENT ON TABLE daily_sales_summary IS 'Pre-aggregated daily data. Refreshed overnight via cron job.';



CREATE TABLE IF NOT EXISTS product_sales_summary (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tenant Reference
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Product Reference
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Date
  summary_date DATE NOT NULL,
  
  -- Metrics
  total_quantity_sold DECIMAL(15,3),  -- Can be decimal for loose products
  total_revenue DECIMAL(12,2),
  avg_unit_price DECIMAL(10,2),
  transaction_count INTEGER,
  
  -- Timestamp
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Unique constraint
  UNIQUE(tenant_id, product_id, summary_date)
);

-- Indexes
CREATE INDEX idx_product_summary_tenant ON product_sales_summary(tenant_id);
CREATE INDEX idx_product_summary_date ON product_sales_summary(summary_date DESC);

-- Comments
COMMENT ON TABLE product_sales_summary IS 'Top-selling products by date. Used for dashboard charts.';



