import { SalesRecords } from "./Sales";

export interface ChartData {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number;
}

export interface PurchaseData {
  date: string;
  supplier: string;
  item: string;
  price: string;
}

export interface SalesData {
  id?: number;
  date: string;
  customer: string;
  item: string;
  price: string;
  billNumber?: string;
  totalAmount?: number;
  itemCount?: number;
  billDate?: string;
  isNewCustomer?: boolean;
  isWalkIn?: boolean;
}

export interface SalesResponse {
  data: SalesRecords[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export type MetalStock = {
  name: string;
  color?: string;
  totalUnits: number;
  totalWeightKg: number;
  totalValue?: number;
};

export type StockTotalsResponse = {
  metals: MetalStock[];
  totals: {
    totalUnits: number;
    totalWeightKg: number;
    totalValue: number;
  };
};

export interface SalesTotalsResponse {
  totalSales: number;
  monthlySales: number;
}
