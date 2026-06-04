
CREATE TABLE IF NOT EXISTS roles (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Role Details
  name user_role NOT NULL UNIQUE,
  description VARCHAR(500),
  
  -- System Level
  is_system_role BOOLEAN DEFAULT false,  -- Cannot be deleted
  
  -- Timestamp
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Sample data (immutable roles)
INSERT INTO roles (name, description, is_system_role) VALUES
('SUPER_ADMIN', 'Platform administrator. Full access to all features and all tenants.', true),
('OWNER', 'Business owner. Full access to their business dashboard and features.', true),
('MANAGER', 'Store manager. Can manage inventory, view reports, manage cashiers.', true),
('CASHIER', 'POS cashier. Can process sales and view their own transactions.', true);



CREATE TABLE IF NOT EXISTS permissions (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Permission Details
  name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(500),
  
  -- Resource
  resource VARCHAR(50),  -- 'sales', 'products', 'users', 'billing', 'reports'
  action permission_action NOT NULL,  -- VIEW, CREATE, UPDATE, DELETE, EXPORT
  
  -- Timestamp
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Sample data
INSERT INTO permissions (name, description, resource, action) VALUES
('view_sales', 'View sales transactions', 'sales', 'VIEW'),
('create_sale', 'Create POS sales', 'sales', 'CREATE'),
('view_inventory', 'View inventory levels', 'products', 'VIEW'),
('edit_inventory', 'Adjust inventory', 'products', 'UPDATE'),
('manage_users', 'Add/remove team members', 'users', 'CREATE'),
('view_billing', 'View subscription and invoices', 'billing', 'VIEW'),
('manage_billing', 'Change subscription plan', 'billing', 'UPDATE'),
('view_reports', 'View analytics and reports', 'reports', 'VIEW'),
('export_reports', 'Download reports as PDF/CSV', 'reports', 'EXPORT'),
('manage_settings', 'Edit business settings', 'settings', 'UPDATE'),
('trigger_ai_agent', 'Generate restocking recommendations', 'ai', 'CREATE'),
('view_audit_logs', 'View activity audit trail', 'audit', 'VIEW'),
('manage_roles', 'Create/edit custom roles', 'roles', 'UPDATE'),
('view_all_tenants', 'View all businesses (admin only)', 'tenants', 'VIEW'),
('deactivate_tenant', 'Suspend business (admin only)', 'tenants', 'UPDATE');



CREATE TABLE IF NOT EXISTS role_permissions (
  -- Composite Primary Key
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  
  PRIMARY KEY (role_id, permission_id)
);

-- Sample data (define what each role can do)
INSERT INTO role_permissions (role_id, permission_id) VALUES
-- SUPER_ADMIN: Can do everything
((SELECT id FROM roles WHERE name = 'SUPER_ADMIN'), (SELECT id FROM permissions WHERE name = 'view_all_tenants')),
((SELECT id FROM roles WHERE name = 'SUPER_ADMIN'), (SELECT id FROM permissions WHERE name = 'deactivate_tenant')),
-- OWNER: Can manage their business
((SELECT id FROM roles WHERE name = 'OWNER'), (SELECT id FROM permissions WHERE name = 'view_sales')),
((SELECT id FROM roles WHERE name = 'OWNER'), (SELECT id FROM permissions WHERE name = 'create_sale')),
((SELECT id FROM roles WHERE name = 'OWNER'), (SELECT id FROM permissions WHERE name = 'view_inventory')),
((SELECT id FROM roles WHERE name = 'OWNER'), (SELECT id FROM permissions WHERE name = 'edit_inventory')),
((SELECT id FROM roles WHERE name = 'OWNER'), (SELECT id FROM permissions WHERE name = 'manage_users')),
((SELECT id FROM roles WHERE name = 'OWNER'), (SELECT id FROM permissions WHERE name = 'view_billing')),
((SELECT id FROM roles WHERE name = 'OWNER'), (SELECT id FROM permissions WHERE name = 'manage_billing')),
((SELECT id FROM roles WHERE name = 'OWNER'), (SELECT id FROM permissions WHERE name = 'view_reports')),
((SELECT id FROM roles WHERE name = 'OWNER'), (SELECT id FROM permissions WHERE name = 'manage_settings')),
((SELECT id FROM roles WHERE name = 'OWNER'), (SELECT id FROM permissions WHERE name = 'trigger_ai_agent')),
((SELECT id FROM roles WHERE name = 'OWNER'), (SELECT id FROM permissions WHERE name = 'view_audit_logs')),
-- MANAGER: Limited management
((SELECT id FROM roles WHERE name = 'MANAGER'), (SELECT id FROM permissions WHERE name = 'view_sales')),
((SELECT id FROM roles WHERE name = 'MANAGER'), (SELECT id FROM permissions WHERE name = 'view_inventory')),
((SELECT id FROM roles WHERE name = 'MANAGER'), (SELECT id FROM permissions WHERE name = 'edit_inventory')),
((SELECT id FROM roles WHERE name = 'MANAGER'), (SELECT id FROM permissions WHERE name = 'view_reports')),
((SELECT id FROM roles WHERE name = 'MANAGER'), (SELECT id FROM permissions WHERE name = 'trigger_ai_agent')),
-- CASHIER: Only POS
((SELECT id FROM roles WHERE name = 'CASHIER'), (SELECT id FROM permissions WHERE name = 'create_sale')),
((SELECT id FROM roles WHERE name = 'CASHIER'), (SELECT id FROM permissions WHERE name = 'view_sales'));



CREATE TABLE IF NOT EXISTS team_invitations (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tenant Reference
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Invitation Details
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role user_role NOT NULL,
  
  -- Token for OTP verification
  invitation_token VARCHAR(255) UNIQUE,
  
  -- Status
  status VARCHAR(50) DEFAULT 'PENDING',  -- PENDING, ACCEPTED, EXPIRED, CANCELLED
  accepted_at TIMESTAMP NULL,
  
  -- Expiry
  expires_at TIMESTAMP NOT NULL,
  
  -- Who invited?
  invited_by_user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  
  -- Timestamp
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_expiry CHECK (expires_at > created_at),
  UNIQUE(tenant_id, email)  -- One invitation per email per tenant
);

-- Indexes
CREATE INDEX idx_invitations_tenant ON team_invitations(tenant_id);
CREATE INDEX idx_invitations_status ON team_invitations(status);
CREATE INDEX idx_invitations_token ON team_invitations(invitation_token);

-- Comments
COMMENT ON TABLE team_invitations IS 'Pending team member invitations with OTP verification.';



