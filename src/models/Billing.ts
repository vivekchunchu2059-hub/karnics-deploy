/**
 * Billing Models
 * Type definitions for billing-related data structures
 */

export type BillingItem = {
    itemName?: string;
    metal?: string;
    hsn?: string;
    weight?: string;
    quantity: number;
    makingCharge: number;
    price: number | "";
    description?: string;
    sku?: string;
    stock?: number;
    originalQuantity?: number; // For edit mode: stores original quantity from invoice
  };

  export type PaymentModeType = "cash" | "upi" | "check" | "credit";
  export type Status = "Pending" | "Cleared";

  export type PaymentDetails = {
    mode: PaymentModeType;
    amount?: string;
    // For UPI
    upiType?: string;
    transitionId?: string;
    // For Check
    checkNumber?: string;
    checkDate?: string;
    bankNameAddress?: string;
    checkStatus?: "pending" | "cleared";
    // For Credit
    advanceAmount?: string;
    numberOfInstallments?: number;
    installmentDate?: string;
  };
  
  export type BillingFormValues = {
    billDetails: BillDetails;
    customerDetails: CustomerDetails;
    gstEnabled: boolean;
    gstPercent: number;
    cgstPercent: number;
    paymentDetails: PaymentDetails;
    discountType: "fixed" | "percent";
    discountValue: number;
    items: BillingItem[];
  };
  
  export type BillingTotals = {
    subtotal: number;
    cgstAmount: number;
    sgstAmount: number;
    discount: number;
    grandTotal: number;
  };
  
  export type BillDetails = {
    billNumber?: string;
    billDate?: string;
  };
  
  export type CustomerDetails = {
    customerTitle?: string;
    customerName?: string;
    state?: string;
    city?: string;
    panAadharType: string;
    panAadharNumber?: string;
    address?: string;
    contactNumber?: string;
    email?: string;
  };
  
  export type InvoiceTotals = {
    subtotal: number;
    cgstAmount: number;
    sgstAmount: number;
    discount: number;
    grandTotal: number;
    /** Balance (e.g. remaining after advance); used in installment view */
    balance?: number;
  };
  
  export type InvoiceDialogProps = {
    open: boolean;
    onClose: () => void;
    onPrint: () => void;
    billDetails: BillDetails;
    paymentMode?: string;
    customerDetails: CustomerDetails;
    items: BillingItem[];
    totals: InvoiceTotals;
    cgstPercent: number;
    sgstPercent: number;
    gstEnabled: boolean;
    viewMode?: "bill" | "installment";
    installments?: {
      installmentNo: number;
      date: string;
      amount: number;
    }[];
    registrationData?: {
      cgst: number;
      sgst: number;
      gstNumber: string;
      makingCharges: number;
      shopName?: string;
      shopAddress?: string;
      mobileNumber?: string;
      email?: string;
      logo?: string;
    } | null;
  };  

  export type InvoiceRecords = {
    id: number;
    billDetails: BillDetails;
    customerDetails: CustomerDetails;
    items: BillingItem[];
    totals: InvoiceTotals;
    gstEnabled?: boolean;
    gstPercent?: number;
    cgstPercent: number;
    sgstPercent: number;
    discountType?: string;
    discountValue?: number;
    paymentMode?: string;
    paymentAmount?: string;
    paymentDetails?: PaymentDetails;
  }

  export type InvoiceResponse = {
    data: InvoiceRecords[];
    pagination: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
    };
  };


