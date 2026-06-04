
CREATE TABLE IF NOT EXISTS subscriptions (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tenant Reference (one subscription per tenant)
  tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Stripe Integration
  stripe_customer_id VARCHAR(255) NOT NULL,
  stripe_subscription_id VARCHAR(255) NOT NULL UNIQUE,
  stripe_price_id VARCHAR(255) NOT NULL,
  
  -- Plan Details
  plan_type VARCHAR(20) NOT NULL,  -- 'STARTER', 'GROWTH', 'ENTERPRISE'
  plan_name VARCHAR(100),
  monthly_price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  terminal_limit INTEGER NOT NULL,
  
  -- Billing Cycle
  current_period_start DATE NOT NULL,
  current_period_end DATE NOT NULL,
  next_billing_date DATE NULL,
  
  -- Status
  status subscription_status NOT NULL,
  
  -- Cancellation Tracking
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancelled_at TIMESTAMP NULL,
  cancellation_reason VARCHAR(500) NULL,
  
  -- Audit
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_terminal_limit CHECK (terminal_limit > 0),
  CONSTRAINT valid_price CHECK (monthly_price > 0)
);

-- Indexes
CREATE INDEX idx_subscriptions_tenant ON subscriptions(tenant_id);
CREATE INDEX idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_next_billing ON subscriptions(next_billing_date);

-- Comments
COMMENT ON TABLE subscriptions IS 'Stripe subscription details. Tracks plan and billing cycle.';



CREATE TABLE IF NOT EXISTS payment_events (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tenant Reference
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Stripe Webhook
  stripe_event_id VARCHAR(255) NOT NULL UNIQUE,
  stripe_event_type VARCHAR(100),  -- checkout.session.completed, invoice.payment_succeeded
  stripe_subscription_id VARCHAR(255) NULL,
  stripe_invoice_id VARCHAR(255) NULL,
  
  -- Payment Details
  amount_cents DECIMAL(12,0) NOT NULL,  -- Store as cents for accuracy
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Status
  status VARCHAR(50),  -- SUCCESS, FAILED, PENDING
  
  -- Webhook Response
  webhook_payload JSONB NOT NULL,  -- Full Stripe response
  processed_at TIMESTAMP,
  
  -- Idempotency (prevent duplicate processing)
  idempotency_key VARCHAR(255) NULL,
  
  -- Timestamp
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_amount CHECK (amount_cents > 0)
);

-- Indexes
CREATE INDEX idx_payment_events_tenant ON payment_events(tenant_id, created_at DESC);
CREATE INDEX idx_payment_events_stripe_id ON payment_events(stripe_event_id);
CREATE INDEX idx_payment_events_status ON payment_events(status);

-- Comments
COMMENT ON TABLE payment_events IS 'All Stripe webhook events for audit trail and idempotency.';



CREATE TABLE IF NOT EXISTS invoices (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tenant Reference
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Stripe Integration
  stripe_invoice_id VARCHAR(255) NOT NULL UNIQUE,
  stripe_subscription_id VARCHAR(255) NULL,
  
  -- Invoice Details
  invoice_number VARCHAR(50),
  amount_due DECIMAL(10,2) NOT NULL,
  amount_paid DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Dates
  invoice_date DATE,
  due_date DATE,
  paid_at TIMESTAMP NULL,
  
  -- Status
  status VARCHAR(50),  -- PAID, FAILED, PENDING, CANCELLED
  
  -- PDF URL (Stripe generates)
  invoice_pdf_url VARCHAR(500) NULL,
  
  -- Timestamp
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_invoices_tenant ON invoices(tenant_id, created_at DESC);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_paid_at ON invoices(paid_at DESC);

-- Comments
COMMENT ON TABLE invoices IS 'Billing history shown to owners. Read-only from Stripe webhooks.';



