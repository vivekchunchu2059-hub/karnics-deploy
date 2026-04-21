import { Role } from '../models/Role';
import log from './logger';

/**
 * Checks if a user role has access to a specific page
 * @param userRole - The role name of the logged-in user
 * @param pageName - The page name to check access for (e.g., "DASHBOARD", "INVENTORY")
 * @param rolesData - Array of all roles with their permissions
 * @returns true if the user has access, false otherwise
 */
export const canAccessPage = (
  userRole: string | null,
  pageName: string,
  rolesData: Role[]
): boolean => {
  // Allow access if roles data is empty (first user scenario - JSON files are empty)
  // Role can be assigned later manually from Users page
  if (rolesData.length === 0) {
    return true;
  }

  if (!userRole) return false;

  const normalizedUserRole =
    (userRole || "").toLowerCase().replace(/\s+/g, "");

  // SuperAdmin always has access to all pages regardless of permissions array
  if (normalizedUserRole.toLowerCase().trim() === "superadmin") {
    return true;
  }

  // First-time registered user may have "No Role Assigned" until role is set - allow full access so left panel and pages work
  if (normalizedUserRole === "noroleassigned") {
    return true;
  }

  // First-time registered user may have "No Role Assigned" until role is set - allow full access so left panel and pages work
  if (normalizedUserRole === "noroleassigned") {
    return true;
  }

  const roleObj = rolesData.find(
    (r) =>
      (r.role || "")
        .toLowerCase()
        .replace(/\s+/g, "") === normalizedUserRole
  );
  
  // If role not found, deny access (user has a role but it doesn't exist in rolesData)
  if (!roleObj) {
    log.warn(`Role "${userRole}" not found in rolesData. Available roles:`, rolesData.map(r => r.role));
    return false;
  }
  
  // Check if role is active
  if (roleObj.status === 'INACTIVE') {
    return false;
  }
  
  // Check if page is in role's permissions
  if (pageName === "ACTIVITY LOG") {
    // Only superAdmin can open Activity Log
    return normalizedUserRole === "superadmin";
  }

  return roleObj.permissions.includes(pageName);
};

/**
 * Gets all accessible pages for a user role
 * @param userRole - The role name of the logged-in user
 * @param rolesData - Array of all roles with their permissions
 * @returns Array of page names the user can access
 */
export const getAccessiblePages = (
  userRole: string | null,
  rolesData: Role[]
): string[] => {
  if (!userRole) return [];

  const normalized = (userRole || "").toLowerCase().replace(/\s+/g, "");
  if (normalized === "superadmin" || normalized === "noroleassigned") {
    // Return all known page names so SuperAdmin / first-time user can access everything
    return [
      "DASHBOARD", "INVOICES", "SALES", "INVENTORY", "CUSTOMERS",
      "ROLES", "USERS", "DATA SYNC",
    ];
  }

  // Use normalized comparison to match role (consistent with canAccessPage)
  const roleObj = rolesData.find(
    (r) =>
      (r.role || "")
        .toLowerCase()
        .replace(/\s+/g, "") === normalized
  );
  if (!roleObj) return [];

  return roleObj.permissions;
};


