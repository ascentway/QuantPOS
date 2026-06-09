-- Add Customer and Receipt Delivery Details to Sales table
ALTER TABLE sales 
  ADD COLUMN IF NOT EXISTS customer_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS receipt_delivery_method VARCHAR(20) DEFAULT 'PRINT' 
    CHECK (receipt_delivery_method IN ('PRINT', 'EMAIL', 'SMS', 'BOTH', 'NONE')),
  ADD COLUMN IF NOT EXISTS receipt_sent BOOLEAN DEFAULT FALSE;
