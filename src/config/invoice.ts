export const INVOICE_CONFIG = {
  shopName: "Jewelly Co.",
  tagline: "Trusted Jewellery Specialists",
  addressLines: [
    "123, Arcade Estate, 1st Floor, C Wing",
    "Lane No 3, Fort Road, Kurla Bandra Complex",
    "Mumbai - 411000",
  ],
  phone: "+91 12345 67890",
  email: "support@jewellyco.com",
  fax: "+91 2- 3456 7890",
  gstNumber: "GSTIN: 27ABCDE1234F1Z5",
  cgstNumber: "CGST :1324 453546467",
  sgstNumber: "SGST :1324 453546467",
  paymentMode: "CASH/UPI",
  billSeries: "INV",
  defaultHsn: "7111",
  defaultMakingCharge: 2000,
  cgstPercent: 1.5,
  sgstPercent: 1.5
};

export type InvoiceConfig = typeof INVOICE_CONFIG;
