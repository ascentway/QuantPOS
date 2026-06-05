-- Update role permissions according to specs
INSERT INTO permissions (name, description, resource, action) VALUES
('create_sale', 'Create sales transactions in POS', 'sales', 'CREATE'),
('view_sales', 'View sales history', 'sales', 'VIEW'),
('apply_discount', 'Apply discounts to sales', 'sales', 'UPDATE'),
('process_refund', 'Process sales refunds', 'sales', 'CREATE'),
('cancel_sale', 'Cancel a pending or completed sale', 'sales', 'UPDATE'),
('view_all_cashier_sales', 'View sales processed by all cashiers', 'sales', 'VIEW'),
('view_inventory', 'View inventory list and stock levels', 'products', 'VIEW'),
('create_product', 'Add a new product to catalogue', 'products', 'CREATE'),
('edit_product', 'Edit product details', 'products', 'UPDATE'),
('delete_product', 'Remove product from catalogue', 'products', 'DELETE'),
('adjust_inventory', 'Manually adjust stock quantity', 'products', 'UPDATE'),
('manage_categories', 'Create, edit or delete product categories', 'products', 'UPDATE'),
('perform_stock_count', 'Perform physical stock audits', 'products', 'UPDATE'),
('view_low_stock_alerts', 'View items below low-stock threshold', 'products', 'VIEW'),
('view_dashboard', 'View business performance dashboard', 'reports', 'VIEW'),
('view_reports', 'View detailed business reports', 'reports', 'VIEW'),
('export_reports', 'Export reports to PDF or Excel', 'reports', 'EXPORT'),
('view_cashier_performance', 'View cashier transaction and sales reports', 'reports', 'VIEW'),
('trigger_ai_agent', 'Trigger AI restocking predictions', 'ai', 'CREATE'),
('view_ai_recommendations', 'View AI inventory recommendations', 'ai', 'VIEW'),
('dismiss_ai_suggestion', 'Dismiss AI restocking recommendations', 'ai', 'UPDATE'),
('create_purchase_order', 'Create supplier purchase orders', 'ai', 'CREATE'),
('export_restock_report', 'Export restocking recommendation reports', 'ai', 'EXPORT'),
('invite_team_member', 'Invite a new team member', 'users', 'CREATE'),
('view_team_members', 'View list of team members', 'users', 'VIEW'),
('edit_team_member_role', 'Change a team member''s role', 'users', 'UPDATE'),
('deactivate_team_member', 'Deactivate or remove a team member', 'users', 'UPDATE'),
('manage_roles', 'Manage custom role permissions', 'users', 'UPDATE'),
('view_terminals', 'View active POS terminals', 'terminals', 'VIEW'),
('create_terminal', 'Register a new POS terminal', 'terminals', 'CREATE'),
('deactivate_terminal', 'Deactivate a POS terminal', 'terminals', 'UPDATE'),
('view_billing', 'View subscription status and bills', 'billing', 'VIEW'),
('manage_subscription', 'Manage company subscription settings', 'billing', 'UPDATE'),
('view_invoices', 'View and download billing invoices', 'billing', 'VIEW'),
('change_plan', 'Change subscription tier or count', 'billing', 'UPDATE'),
('view_settings', 'View business and account settings', 'settings', 'VIEW'),
('manage_settings', 'Update business and account settings', 'settings', 'UPDATE'),
('edit_business_profile', 'Edit organization profile details', 'settings', 'UPDATE'),
('view_audit_logs', 'View system activity logs', 'audit', 'VIEW'),
('view_all_tenants', 'View all tenant business details', 'tenants', 'VIEW'),
('deactivate_tenant', 'Deactivate or suspend a tenant', 'tenants', 'UPDATE'),
('impersonate_tenant', 'Impersonate a tenant account', 'tenants', 'CREATE'),
('view_platform_metrics', 'View system-wide platform metrics', 'system', 'VIEW'),
('manage_system_roles', 'Manage system roles and permissions', 'system', 'UPDATE')
ON CONFLICT (name) DO UPDATE SET 
  description = EXCLUDED.description,
  resource = EXCLUDED.resource,
  action = EXCLUDED.action;

-- 1. Wipe existing permissions mapping to redefine them cleanly
DELETE FROM role_permissions;

-- 2. Populate role_permissions for SUPER_ADMIN (gets all permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'SUPER_ADMIN';

-- 3. Populate role_permissions for OWNER
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'OWNER' 
  AND p.name IN (
    'create_sale', 'view_sales', 'apply_discount', 'process_refund', 'cancel_sale', 'view_all_cashier_sales',
    'view_inventory', 'create_product', 'edit_product', 'delete_product', 'adjust_inventory', 'manage_categories',
    'perform_stock_count', 'view_low_stock_alerts', 'view_dashboard', 'view_reports', 'export_reports',
    'view_cashier_performance', 'trigger_ai_agent', 'view_ai_recommendations', 'dismiss_ai_suggestion',
    'create_purchase_order', 'export_restock_report', 'invite_team_member', 'view_team_members',
    'edit_team_member_role', 'deactivate_team_member', 'view_terminals', 'create_terminal', 'deactivate_terminal',
    'view_billing', 'manage_subscription', 'view_invoices', 'change_plan', 'view_settings', 'manage_settings',
    'edit_business_profile', 'view_audit_logs'
  );

-- 4. Populate role_permissions for MANAGER
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'MANAGER' 
  AND p.name IN (
    'create_sale', 'view_sales', 'apply_discount', 'process_refund', 'cancel_sale', 'view_all_cashier_sales',
    'view_inventory', 'create_product', 'edit_product', 'adjust_inventory', 'manage_categories',
    'perform_stock_count', 'view_low_stock_alerts', 'view_dashboard', 'view_reports', 'export_reports',
    'view_cashier_performance', 'trigger_ai_agent', 'view_ai_recommendations', 'dismiss_ai_suggestion',
    'create_purchase_order', 'export_restock_report', 'view_team_members', 'view_terminals'
  );

-- 5. Populate role_permissions for CASHIER
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'CASHIER' 
  AND p.name IN (
    'create_sale', 'view_sales', 'apply_discount', 'view_inventory'
  );
