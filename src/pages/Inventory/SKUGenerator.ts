/**
 * Function to generate a 12-character uppercase alphanumeric unique SKU (format: WDWW-R4ER-5433)
 * Based on combination of Product name, Category, Metal Type, Karat, Color, and Timestamp
 */
export const generateSKU = (
  product: string,
  category: string,
  metal: string,
  purity: string,
  color: string
): string => {
  // Get first few characters from each field (uppercase, remove spaces and special chars)
  const getInitials = (str: string, length: number = 2): string => {
    if (!str) return '';
    return str.replace(/[^a-zA-Z0-9]/g, '').substring(0, length).toUpperCase();
  };

  const productInit = getInitials(product, 2);
  const categoryInit = getInitials(category, 2);
  const metalInit = getInitials(metal, 2);
  const purityInit = getInitials(purity, 1);
  const colorInit = getInitials(color, 1);

  // Get timestamp (last 6 digits of current timestamp)
  const timestamp = Date.now().toString().slice(-6);

  // Combine all parts into a string
  const combined = `${productInit}${categoryInit}${metalInit}${purityInit}${colorInit}${timestamp}`;

  // Convert string to alphanumeric hash
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Generate uppercase alphanumeric characters from hash
  const alphanumeric = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const getAlphanumericChar = (num: number): string => {
    return alphanumeric[Math.abs(num) % alphanumeric.length];
  };

  // Create 12-character alphanumeric string
  let alphanumericSKU = '';
  let hashValue = Math.abs(hash);
  
  // Generate 12 characters
  for (let i = 0; i < 12; i++) {
    hashValue = ((hashValue << 5) - hashValue) + combined.charCodeAt(i % combined.length);
    hashValue = hashValue & hashValue;
    alphanumericSKU += getAlphanumericChar(hashValue);
  }

  // Format as WDWW-R4ER-5433 (4-4-4 with dashes, uppercase)
  const formattedSKU = `${alphanumericSKU.slice(0, 4)}-${alphanumericSKU.slice(4, 8)}-${alphanumericSKU.slice(8, 12)}`;

  return formattedSKU;
};