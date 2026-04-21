import { apiClient, API_BASE_URL } from '../api';

/**
 * Convert a registration image path (e.g. "images/logo-1-xxx.png") to a full API URL
 * so the browser can load it from the backend. Returns null for empty or data URLs.
 */
export function getRegistrationImageUrl(path: string | undefined | null): string | null {
  if (!path || path.startsWith('data:')) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = apiClient.defaults.baseURL || API_BASE_URL;
  return `${base}/api/registration-images/${path.replace(/^\//, '')}`;
}

/**
 * Return a URL suitable for use as <img src>. Handles data URLs, full URLs, and
 * relative paths (resolved via API). Use this when displaying profile/logo images
 * that may come from registration (path) or localStorage (path or data URL).
 */
export function getDisplayImageUrl(value: string | undefined | null): string | undefined | null {
  if (!value) return value;
  if (value.startsWith('data:') || value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }
  return getRegistrationImageUrl(value) ?? value;
}
