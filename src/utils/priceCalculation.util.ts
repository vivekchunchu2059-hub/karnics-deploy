/**
 * Price Calculation Utilities
 * Handles price calculations for metals based on weight and current rates
 */

import log from './logger';

export interface MetalPrices {
  gold: number; // Price per 10gm
  silver: number; // Price per 10gm
  platinum?: number; // Price per 10gm (optional)
}

/**
 * Parses price string to numeric value
 * @param priceString - Price string (e.g., "₹1,24,650/10gm")
 * @returns Numeric price value
 */
export const parsePriceValue = (priceString: string): number => {
  if (!priceString) return 0;
  
  // Remove ₹, /10gm, and commas, then parse
  const cleaned = priceString.replace(/₹|,|\/10gm|\/gm/g, '').trim();
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Gets metal prices from localStorage
 * @returns Metal prices object
 */
export const getMetalPricesFromStorage = (): MetalPrices => {
  try {
    const stored = localStorage.getItem('metalPrices');
    if (stored) {
      const prices = JSON.parse(stored);
      return {
        gold: prices.gold?.pricePer10gm || 124650,
        silver: prices.silver?.pricePer10gm || 2410,
        platinum: prices.platinum?.pricePer10gm,
      };
    }
  } catch (error) {
    log.error('Failed to read metal prices from localStorage:', error);
  }
  
  return {
    gold: 124650,
    silver: 2410,
    platinum: 50000,
  };
};

/**
 * Calculates stock value for Gold, Silver, or Platinum based on weight and current price
 * @param metalName - Name of the metal ('Gold', 'Silver', or 'Platinum')
 * @param weightGrams - Total weight in grams
 * @param prices - Current metal prices
 * @param quantity - Number of units (for multiplying total value)
 * @returns Total stock value in rupees
 */
export const calculateMetalStockValue = (
  metalName: string,
  weightGrams: number,
  prices: MetalPrices,
  quantity: number = 1
): number => {
  if (!weightGrams || weightGrams <= 0 || quantity <= 0) return 0;
  
  const metalLower = metalName.toLowerCase();
  
  if (metalLower === 'gold') {
    // Price is per 10gm, so: (weight per unit / 10) * pricePer10gm * quantity
    return (weightGrams / 10) * prices.gold * quantity;
  }
  
  if (metalLower === 'silver') {
    return (weightGrams / 10) * prices.silver * quantity;
  }
  
  if (metalLower === 'platinum' && prices.platinum) {
    return (weightGrams / 10) * prices.platinum * quantity;
  }
  
  // For other metals, return 0 and let product price be used
  return 0;
};

/**
 * Formats currency value for display
 * @param value - Value in rupees
 * @returns Formatted string (e.g., "₹1.2L" or "₹50K")
 */
export const formatCurrency = (value: number): string => {
  if (!value || value <= 0) return '₹0';
  
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(2)}Cr`;
  }
  
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(2)}L`;
  }
  
  if (value >= 1000) {
    return `₹${(value / 1000).toFixed(2)}K`;
  }
  
  return `₹${Math.round(value)}`;
};
