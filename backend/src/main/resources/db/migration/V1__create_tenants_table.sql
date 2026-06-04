CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name VARCHAR(255) NOT NULL,
  business_type VARCHAR(20) NOT NULL CHECK (business_type IN ('RETAIL','FNB')),
  phone_number VARCHAR(20) NOT NULL,
  gstin VARCHAR(15),
  address_street VARCHAR(255) NOT NULL,
  address_city VARCHAR(100) NOT NULL,
  address_state VARCHAR(100) NOT NULL,
  address_pincode VARCHAR(10) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
  financial_year_start VARCHAR(10) NOT NULL DEFAULT 'APRIL',
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  subscription_status VARCHAR(20) NOT NULL DEFAULT 'INACTIVE'
    CHECK (subscription_status IN ('ACTIVE','INACTIVE','PAST_DUE','CANCELLED')),
  terminal_limit INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
