ALTER TABLE payment_events DROP CONSTRAINT valid_amount;
ALTER TABLE payment_events ADD CONSTRAINT valid_amount CHECK (amount_cents >= 0);
