const permissions = {
  ADMIN: ['*'],

  MANAGER: [
    'dashboard:read',
    'products:read',
    'products:create',
    'products:update',
    'categories:read',
    'categories:create',
    'suppliers:read',
    'suppliers:create',
    'stock:read',
    'stock:create',
    'sales:read',
    'sales:create',
    'expenses:read',
    'expenses:create',
    'reports:read',
    'audit:read',
    'users:read',
    'users:create',
    'users:update',
    'users:delete',
    'users:deactivate',
    'users:reactivate'
  ],

  STOCK: [
    'dashboard:read',
    'products:read',
    'categories:read',
    'suppliers:read',
    'stock:read',
    'stock:create',
    'reports:stock'
  ],

  SALES: [
    'dashboard:read',
    'products:read',
    'sales:read',
    'sales:create',
    'reports:sales'
  ],

  FINANCE: [
    'dashboard:read',
    'sales:read',
    'expenses:read',
    'expenses:create',
    'expenses:delete',
    'reports:read',
    'reports:finance'
  ]
};

function can(role, permission) {
  if (role === 'OWNER') return true;

  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes('*') || permissions.includes(permission);
}

module.exports = {
  permissions,
  can
};
