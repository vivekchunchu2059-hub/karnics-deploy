/**
 * Inventory Aggregation Service
 * Handles aggregation of inventory data by metal type
 */

import { toGrams, formatWeight } from '../utils/weightConversion.util';
import { calculateMetalStockValue, getMetalPricesFromStorage, formatCurrency } from '../utils/priceCalculation.util';

export interface InventoryItem {
  product?: string;
  sku?: string;
  weight: number;
  quantity: number;
  price: number | string;
  purity?: string;
  color?: string;
}

export interface InventoryGroup {
  id: number;
  metal: string;
  categoryName: string;
  category: InventoryItem[];
}

export interface MetalStockAggregate {
  name: string;
  color?: string;
  totalUnits: number;
  totalWeightGrams: number;
  totalWeightKg: number;
  totalValue: number;
  formattedWeight: string;
  formattedValue: string;
}

/**
 * Flattens nested inventory structure to array of items with metal info
 */
export const flattenInventory = (inventory: InventoryGroup[]): Array<InventoryItem & { metal: string }> => {
  const flattened: Array<InventoryItem & { metal: string }> = [];
  
  inventory.forEach((group) => {
    if (group.category && Array.isArray(group.category)) {
      group.category.forEach((item) => {
        flattened.push({
          ...item,
          metal: group.metal,
        });
      });
    }
  });
  
  return flattened;
};

/**
 * Aggregates inventory by metal type
 * @param inventory - Inventory data (nested structure)
 * @param metalPrices - Current metal prices
 * @returns Aggregated stock data by metal
 */
export const aggregateInventoryByMetal = (
  inventory: InventoryGroup[],
  metalPrices: { gold: number; silver: number }
): MetalStockAggregate[] => {
  const flattened = flattenInventory(inventory);
  
  // Group by metal
  const metalGroups: Record<string, InventoryItem[]> = {};
  
  flattened.forEach((item) => {
    const metal = (item.metal || '').toLowerCase();
    if (!metalGroups[metal]) {
      metalGroups[metal] = [];
    }
    metalGroups[metal].push(item);
  });
  
  // Aggregate each metal group
  const aggregates: MetalStockAggregate[] = [];
  
  Object.entries(metalGroups).forEach(([metal, items]) => {
    let totalUnits = 0;
    let totalWeightGrams = 0;
    let totalValue = 0;
    
    items.forEach((item) => {
      const weight = Number(item.weight) || 0;
      const quantity = Number(item.quantity) || 0;
      
      // Convert weight to grams (assuming weight is already in grams)
      const weightGrams = toGrams(weight, 'gm');
      const itemTotalWeight = weightGrams * quantity;
      
      totalUnits += quantity;
      totalWeightGrams += itemTotalWeight;
      
      // Calculate value
      if (metal === 'gold' || metal === 'silver') {
        // Use metal price calculation
        totalValue += calculateMetalStockValue(metal, itemTotalWeight, metalPrices);
      } else {
        // Use product price for other metals
        const price = typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0);
        totalValue += price * quantity;
      }
    });
    
    aggregates.push({
      name: metal.charAt(0).toUpperCase() + metal.slice(1),
      totalUnits,
      totalWeightGrams,
      totalWeightKg: totalWeightGrams / 1000,
      totalValue: Math.round(totalValue),
      formattedWeight: formatWeight(totalWeightGrams),
      formattedValue: formatCurrency(totalValue),
    });
  });
  
  return aggregates;
};

/**
 * Gets aggregated stock data for dashboard
 * @param inventory - Inventory data
 * @returns Aggregated stock totals
 */
export const getStockAggregates = (inventory: InventoryGroup[]): {
  metals: MetalStockAggregate[];
  totals: {
    totalUnits: number;
    totalWeightGrams: number;
    totalWeightKg: number;
    totalValue: number;
  };
} => {
  const metalPrices = getMetalPricesFromStorage();
  const aggregates = aggregateInventoryByMetal(inventory, metalPrices);
  
  const totals = aggregates.reduce(
    (acc, metal) => ({
      totalUnits: acc.totalUnits + metal.totalUnits,
      totalWeightGrams: acc.totalWeightGrams + metal.totalWeightGrams,
      totalWeightKg: acc.totalWeightKg + metal.totalWeightKg,
      totalValue: acc.totalValue + metal.totalValue,
    }),
    {
      totalUnits: 0,
      totalWeightGrams: 0,
      totalWeightKg: 0,
      totalValue: 0,
    }
  );
  
  return {
    metals: aggregates,
    totals: {
      ...totals,
      totalWeightKg: Number(totals.totalWeightKg.toFixed(3)),
    },
  };
};
