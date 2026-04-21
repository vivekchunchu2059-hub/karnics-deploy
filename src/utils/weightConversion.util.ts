/**
 * Weight Conversion Utilities
 * Handles conversion between different weight units used in jewellery
 */

export const GRAMS_PER_KG = 1000;
export const GRAMS_PER_CARAT = 0.2; // 1 carat = 0.2 grams
export const CARATS_PER_RATTI = 0.91; // 1 ratti ≈ 0.91 carats (India standard)
export const GRAMS_PER_RATTI = CARATS_PER_RATTI * GRAMS_PER_CARAT; // ≈ 0.182 grams

/**
 * Gets default unit for a metal type
 * @param metalName - Name of the metal
 * @returns Default unit ('gm', 'kg', 'ct', 'ratti')
 */
export const getDefaultUnitForMetal = (metalName: string): string => {
  const metalLower = (metalName || '').toLowerCase();
  
  if (metalLower === 'diamond' || metalLower === 'gems' || metalLower.includes('gem')) {
    return 'ct'; // Carat for diamonds and gems
  }
  
  // Gold, Silver, Platinum default to grams
  return 'gm';
};

/**
 * Converts weight to grams based on unit and metal type
 * @param weight - Weight value
 * @param unit - Unit of weight ('gm', 'g', 'kg', 'kilogram', 'ct', 'carat', 'ratti')
 * @param metalName - Optional metal name to determine default unit
 * @returns Weight in grams
 */
export const toGrams = (weight: number, unit?: string, metalName?: string): number => {
  if (!weight || weight < 0) return 0;
  
  // If no unit provided, determine from metal type
  if (!unit && metalName) {
    unit = getDefaultUnitForMetal(metalName);
  }
  
  const normalizedUnit = (unit || 'gm').toLowerCase().trim();
  
  // Kilograms
  if (normalizedUnit === 'kg' || normalizedUnit === 'kilogram') {
    return weight * GRAMS_PER_KG;
  }
  
  // Carats (for diamonds and gems)
  if (normalizedUnit === 'ct' || normalizedUnit === 'carat') {
    return weight * GRAMS_PER_CARAT;
  }
  
  // Ratti (Indian unit for gems)
  if (normalizedUnit === 'ratti') {
    return weight * GRAMS_PER_RATTI;
  }
  
  // Default to grams
  return weight;
};

/**
 * Converts weight to kilograms
 * @param weight - Weight in grams
 * @returns Weight in kilograms
 */
export const toKilograms = (weight: number): number => {
  if (!weight || weight < 0) return 0;
  return weight / GRAMS_PER_KG;
};

/**
 * Converts grams to carats
 * @param weightGrams - Weight in grams
 * @returns Weight in carats
 */
export const toCarats = (weightGrams: number): number => {
  if (!weightGrams || weightGrams <= 0) return 0;
  return weightGrams / GRAMS_PER_CARAT;
};

/**
 * Formats weight for display based on metal type
 * @param weightGrams - Weight in grams
 * @param metalName - Metal name to determine display unit
 * @returns Formatted string (e.g., "1.5KG", "500GM", "2.5CT")
 */
export const formatWeight = (weightGrams: number, metalName?: string): string => {
  if (!weightGrams || weightGrams <= 0) {
    const metalLower = (metalName || '').toLowerCase();
    if (metalLower === 'diamond' || metalLower === 'gems' || metalLower.includes('gem')) {
      return '0CT';
    }
    return '0GM';
  }
  
  const metalLower = (metalName || '').toLowerCase();
  
  // For diamonds and gems, display in carats
  if (metalLower === 'diamond' || metalLower === 'gems' || metalLower.includes('gem')) {
    const carats = toCarats(weightGrams);
    if (carats >= 1) {
      return `${carats.toFixed(2)}CT`;
    }
    // For less than 1 carat, show in points (1 point = 0.01 carat)
    const points = Math.round(carats * 100);
    return `${points}PT`;
  }
  
  // For Gold, Silver, Platinum - display in kg or gm
  if (weightGrams >= GRAMS_PER_KG) {
    const kg = toKilograms(weightGrams);
    return `${kg.toFixed(3)}KG`;
  }
  
  return `${Math.round(weightGrams)}GM`;
};

/**
 * Parses weight string to extract numeric value and unit
 * @param weightString - Weight string (e.g., "5 gm", "2.5 ct", "1 kg")
 * @returns Object with value and unit
 */
export const parseWeight = (weightString: string | number): { value: number; unit: string } => {
  if (typeof weightString === 'number') {
    return { value: weightString, unit: 'gm' };
  }
  
  if (!weightString) {
    return { value: 0, unit: 'gm' };
  }
  
  // Extract number and unit from string like "5 gm" or "2.5 ct"
  const match = weightString.toString().match(/^([\d.]+)\s*(gm|g|kg|kilogram|ct|carat|ratti)?$/i);
  
  if (match) {
    const value = parseFloat(match[1]);
    const unit = match[2]?.toLowerCase() || 'gm';
    return { value: isNaN(value) ? 0 : value, unit };
  }
  
  // Try to extract just the number
  const numMatch = weightString.toString().match(/[\d.]+/);
  if (numMatch) {
    return { value: parseFloat(numMatch[0]), unit: 'gm' };
  }
  
  return { value: 0, unit: 'gm' };
};
