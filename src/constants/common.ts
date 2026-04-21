/**
 * Common constants used across the application
 */

// Table Headers
export type TableHeaderAlign = "left" | "center" | "right";

export interface TableHeader {
  label: string;
  align?: TableHeaderAlign;
}

// Purchase Items Table Headers
export const PURCHASE_ITEMS_TABLE_HEADERS: TableHeader[] = [
  { label: "Metal" },
  { label: "Weight" },
  { label: "Item Name" },
  { label: "Description" },
  { label: "Qty" },
  { label: "Price/Pcs" },
  { label: "Making Charges" },
  { label: "Total" },
  { label: "Action", align: "center" },
];

// Invoice Table Headers
export const INVOICE_TABLE_HEADERS: TableHeader[] = [
  { label: "No" },
  { label: "Item" },
  { label: "HSN" },
  { label: "Wgt/Qty", align: "center" },
  { label: "Making Charges", align: "right" },
  { label: "Price Item", align: "right" },
  { label: "Total", align: "right" },
];

// Customer Title Options
export const CUSTOMER_TITLES = ["Mr", "Mrs", "Ms"] as const;

// PAN/Aadhar Type Options
export const PAN_AADHAR_TYPES = [
  "Aadhar",
  "PAN",
  "Passport",
  "Voter ID",
  "Driving License",
] as const;


// Discount Types
export const DISCOUNT_TYPES = ["fixed", "percent"] as const;

// Common Validation Patterns
export const VALIDATION_PATTERNS = {
  ALPHABETS_ONLY: /^[A-Za-z\s]+$/,
  CONTACT_NUMBER: /^[0-9]{10,15}$/,
} as const;

// Common Messages
export const MESSAGES = {
  SAVE_SUCCESS: "Invoice generated successfully",
  SAVE_ERROR: "Failed to create/update invoice",
  PRINT_ERROR: "Please save before printing.",
  REQUIRED_FIELD: "This field is required",
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  SALES: "/api/sales",
  SALES_DETAILS: '/api/sales/details',
  INVOICES: "/api/invoices",
  CUSTOMERS: "/api/customers",
  INSTALLMENTS: "/api/installments",
  SETTINGS_COMPANY: "/api/settings/company",
  STATES: "https://countriesnow.space/api/v0.1/countries/states",
  CITIES: "https://countriesnow.space/api/v0.1/countries/state/cities",

  DASHBOARD_STOCK: "/api/dashboard/stock",
  DASHBOARD_SALES: "/api/dashboard/sales",
  DASHBOARD_SALES_TREND: "/api/dashboard/sales-trend",
  DASHBOARD_CATEGORY_MONTHLY: "/api/dashboard/category-monthly-sales",
  DASHBOARD_STOCK_SPLIT: "/api/dashboard/stock-split",
  DASHBOARD_STOCK_VALUES: "/api/dashboard/stock-values",
  DASHBOARD_MONTHLY_BY_CATEGORY: "/api/dashboard/monthly-sales-by-category",
  DASHBOARD_TODAY_SALES: "/api/dashboard/today-sales",
  DASHBOARD_RECENT_SALES: "/api/dashboard/recent-sales",
} as const;

// Common Countries
export const COUNTRIES = {
  INDIA: "India",
} as const;

// Number to Words - Ones (0–19)
export const ONES: string[] = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

// Number to Words - Tens (0, 10, 20–90)
export const TENS: string[] = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

// Number to Words - Indian Numbering System Units
export type NumberUnit = {
  value: number;
  str: string;
};

export const INDIAN_NUMBER_UNITS: NumberUnit[] = [
  { value: 10000000, str: "Crore" },
  { value: 100000, str: "Lakh" },
  { value: 1000, str: "Thousand" },
  { value: 100, str: "Hundred" },
];

export const ALL_PERMISSIONS = [
  'DASHBOARD',
  'INVOICES',
  'SALES',
  'INVENTORY',
  'CUSTOMERS',
  'ROLES',
  'USERS',
  'DATA SYNC'
];

export const getStatusColor = (status: string) => {
  const s = (status || '').toLowerCase();
  switch (s) {
    case 'success':
    case 'completed':
      return { bg: '#c8e6c9', color: '#2e7d32' };
    case 'failed':
    case 'fail':
      return { bg: '#ffcdd2', color: '#c62828' };
    case 'pending':
      return { bg: '#fff9c4', color: '#f57f17' };
    default:
      return { bg: '#f5f5f5', color: '#757575' };
  }
};


export const GENERATE_CUSTOMER_ID = {
  CUSTOMER_ID: "https://api-url.com/generate-customer-id"
};

