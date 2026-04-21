/**
 * Page layout config: title and icon key for each route.
 * Used by PageLayout for consistent header across screens.
 */
export const PAGE_LAYOUT_CONFIG: Record<string, { title: string; icon: string }> = {
  '/invoices': { title: 'Invoices', icon: 'Receipt' },
  '/billing': { title: 'Billing', icon: 'PointOfSale' },
  '/sales': { title: 'Sales', icon: 'TrendingUp' },
  '/inventory': { title: 'Inventory', icon: 'Inventory2' },
  '/customers': { title: 'Customers', icon: 'People' },
  '/roles': { title: 'Role Management', icon: 'Security' },
  '/users': { title: 'Users', icon: 'Person' },
  '/data-sync': { title: 'Data Sync', icon: 'Sync' },
};
