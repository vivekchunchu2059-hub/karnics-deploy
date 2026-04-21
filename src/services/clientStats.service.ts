/**
 * Client Statistics Service
 * Aggregates sales data by client and metal type
 */

export interface InvoiceItem {
  metal?: string;
  weight?: string | number;
  quantity?: number;
  price?: number;
  makingCharge?: number;
}

export interface Invoice {
  id: number;
  customerId?: number;
  items?: InvoiceItem[];
  totals?: {
    subtotal?: number;
    grandTotal?: number;
  };
}

export interface ClientMetalStats {
  totalWeight: number;
  totalAmount: number;
  totalItems: number;
}

export interface ClientStats {
  customerId: number;
  customerName: string;
  gold: ClientMetalStats;
  silver: ClientMetalStats;
  totalAmount: number;
}

/**
 * Aggregates client-wise statistics from invoices
 * @param invoices - Array of invoices
 * @param customers - Map of customerId to customer name
 * @returns Array of client statistics
 */
export const aggregateClientStats = (
  invoices: Invoice[],
  customers: Record<number, string>
): ClientStats[] => {
  const clientStatsMap: Record<number, ClientStats> = {};
  
  invoices.forEach((invoice) => {
    const customerId = invoice.customerId;
    if (!customerId) return;
    
    const customerName = customers[customerId] || `Customer ${customerId}`;
    
    if (!clientStatsMap[customerId]) {
      clientStatsMap[customerId] = {
        customerId,
        customerName,
        gold: {
          totalWeight: 0,
          totalAmount: 0,
          totalItems: 0,
        },
        silver: {
          totalWeight: 0,
          totalAmount: 0,
          totalItems: 0,
        },
        totalAmount: 0,
      };
    }
    
    const stats = clientStatsMap[customerId];
    const items = invoice.items || [];
    
    items.forEach((item) => {
      const metal = (item.metal || '').toLowerCase();
      const weight = parseFloat(String(item.weight || 0));
      const quantity = parseInt(String(item.quantity || 0), 10);
      const price = parseFloat(String(item.price || 0));
      const makingCharge = parseFloat(String(item.makingCharge || 0));
      const itemTotal = price * quantity + makingCharge;
      
      if (metal === 'gold') {
        stats.gold.totalWeight += weight;
        stats.gold.totalAmount += itemTotal;
        stats.gold.totalItems += quantity;
      } else if (metal === 'silver') {
        stats.silver.totalWeight += weight;
        stats.silver.totalAmount += itemTotal;
        stats.silver.totalItems += quantity;
      }
    });
    
    // Update total amount
    stats.totalAmount = stats.gold.totalAmount + stats.silver.totalAmount;
  });
  
  // Convert to array and filter out clients with no gold/silver purchases
  return Object.values(clientStatsMap)
    .filter((stat) => stat.gold.totalItems > 0 || stat.silver.totalItems > 0)
    .map((stat) => ({
      ...stat,
      gold: {
        totalWeight: Number(stat.gold.totalWeight.toFixed(2)),
        totalAmount: Math.round(stat.gold.totalAmount),
        totalItems: stat.gold.totalItems,
      },
      silver: {
        totalWeight: Number(stat.silver.totalWeight.toFixed(2)),
        totalAmount: Math.round(stat.silver.totalAmount),
        totalItems: stat.silver.totalItems,
      },
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount); // Sort by total amount descending
};
