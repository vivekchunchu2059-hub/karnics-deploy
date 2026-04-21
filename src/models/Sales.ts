// For summary table (grouped by date + metal)
export interface SalesSummaryRecord {
  billDate: string;
  metal: string;
  weightQuantity: number;
  amount: number;
  gstDeduction: number;
  totalAmount: number;
}

// For dropdown table (per day details)
export interface SalesDetailRecord {
  itemName: string;
  weight: string;
  quantity: number;
  amount: number;
  gstAmount: number;
  total: number;
}

export interface SalesRecords {
  _id: string;
  billDetails?: {
    billDate?: string;
    billNumber?: string;
  };
  createdAt: string;
  totalAmount?: number;
  metal? : string;
}