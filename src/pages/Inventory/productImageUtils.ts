import { API_BASE_URL } from '../../api';

/**
 * Returns the full URL for a product image.
 * - If image is base64 (data:) or already http(s), return as-is.
 * - Otherwise treat as filename and return API images endpoint URL.
 */
export const getProductImageUrl = (image?: string): string => {
  if (!image) return '';
  if (image.startsWith('data:') || image.startsWith('http://') || image.startsWith('https://')) {
    return image;
  }
  return `${API_BASE_URL}/api/inventory/images/${encodeURIComponent(image)}?t=${Date.now()}`;
};