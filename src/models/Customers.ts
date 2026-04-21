export interface CreditData {
  srNo: number;
  customerName: string;
  contactNumber: string;
  invoice: string;
  status: 'Pending' | 'Cleared';
  customerInstallmentData?: CustomerInstallmentData;
  customerTitle?: string;
  address?: string;
  email?: string;
  state?: string;
  city?: string;
  panAadharType?: string;
  panAadharNumber?: string;
}

export interface Installment {
  installmentNo: number;
  date: string;
  amount: string;
}

export interface CustomerInstallmentData {
  paymentBy: string;
  totalPurchaseAmount: number;
  advAmount: number;
  invoiceNo: string;
  /** Short id (e.g. INV9149) for API calls; optional for backward compatibility */
  invoiceShort?: string;
  purchasedItems: string[];
  installments: Installment[];
  balance: number;
  billDate: string;
  /** Customer info for invoice; optional, may be set when opening from CreditTab */
  customerName?: string;
  phoneNumber?: string;
  address?: string;
  email?: string;
  customerTitle?: string;
  state?: string;
  city?: string;
  panAadharType?: string;
  panAadharNumber?: string;
}