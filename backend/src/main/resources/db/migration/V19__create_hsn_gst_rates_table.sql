-- V19__create_hsn_gst_rates_table.sql

CREATE TABLE IF NOT EXISTS hsn_gst_rates (
  hsn_code VARCHAR(10) PRIMARY KEY,
  description VARCHAR(500) NOT NULL,
  gst_rate DECIMAL(5,2) NOT NULL
);

-- Seed with some common FMCG/Retail rates in India
INSERT INTO hsn_gst_rates (hsn_code, description, gst_rate) VALUES
('1701', 'Cane or beet sugar and chemically pure sucrose', 5.00),
('0401', 'Milk and cream, not concentrated', 0.00),
('0902', 'Tea, whether or not flavoured', 5.00),
('1507', 'Soya-bean oil and its fractions', 5.00),
('1905', 'Bread, pastry, cakes, biscuits', 18.00),
('2201', 'Waters, including natural or artificial mineral waters', 18.00),
('3401', 'Soap; organic surface-active products', 18.00),
('3306', 'Preparations for oral or dental hygiene', 18.00),
('0901', 'Coffee, whether or not roasted or decaffeinated', 5.00),
('1006', 'Rice', 5.00),
('1101', 'Wheat or meslin flour', 0.00),
('0701', 'Potatoes, fresh or chilled', 0.00),
('0703', 'Onions, shallots, garlic, leeks', 0.00)
ON CONFLICT (hsn_code) DO NOTHING;
