/**
 * Common utility functions used across the application
 */

import { apiClient } from '../api';
import log from './logger';

// API Endpoints
const API_ENDPOINTS = {
  METALS: "/api/config/metals",
} as const;

export type MetalOption = {
  name: string;
  color?: string;
};


/**
 * Fetches metal types from the API configuration
 * @returns Promise resolving to array of metal options, empty array on error
 */
export const fetchMetals = async (): Promise<MetalOption[]> => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.METALS);
    const data = response.data;
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
    return [];
  } catch (error) {
    log.error("Failed to fetch metals config:", error);
    return [];
  }
};

/**
 * User Role Management Utilities
 */

/**
 * Checks if a role name is superAdmin (case-insensitive)
 * @param roleName - The role name to check
 * @returns true if the role is superAdmin, false otherwise
 */
debugger;
export const isSuperAdminRole = (roleName: string): boolean => {
  const normalized = roleName.toLowerCase().trim().replace(/\s/g, '');
  return normalized.toLowerCase().trim() === "superadmin";
};

/**
 * Sets the current user's role in localStorage
 * @param roleName - The role name to set
 */
export const setCurrentUserRole = (roleName: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('currentUserRole', roleName);
  }
};

/**
 * Gets the current user's role from localStorage
 * If no role is set, defaults to "superAdmin" and sets it in localStorage
 * @returns The current user's role name (defaults to "superAdmin")
 */
debugger;
export const getCurrentUserRole = (): string => {
  if (typeof window !== 'undefined') {
    const role = localStorage.getItem('currentUserRole');
    if (!role) {
      // Default to superAdmin if no role is set
      localStorage.setItem('currentUserRole', 'superAdmin');
      return 'superAdmin';
    }
    return role;
  }
  return "superAdmin";
};

/**
 * Checks if the current user is superAdmin
 * @returns true if the current user has a superAdmin role, false otherwise
 */
debugger;
export const isCurrentUserSuperAdmin = (): boolean => {
  const currentUserRole = getCurrentUserRole();
  if (!currentUserRole) return false;
  
  // Check if the role name contains "superadmin" (case-insensitive)
  const roleLower = currentUserRole.toLowerCase().replace(/\s/g, '');
  return roleLower.toLowerCase().trim() === 'superadmin';
};

/**
 * Clears the current user's role from localStorage
 */
export const clearCurrentUserRole = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('currentUserRole');
  }
};