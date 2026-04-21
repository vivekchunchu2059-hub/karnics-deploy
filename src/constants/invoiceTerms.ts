/**
 * Invoice Terms and Conditions – configurable at runtime per jeweller.
 * Defaults below; override via getInvoiceTerms() / setInvoiceTerms() using localStorage.
 */

export const INVOICE_TERMS_TITLE = 'Terms and Conditions';

/** Part 1: Product & quality specifications */
export const INVOICE_TERMS_PART1_TITLE = 'Product & quality';
export const INVOICE_TERMS_PART1_ITEMS: string[] = [
  'Gold/Silver jewellery purity is as per BIS/Hallmark standards where applicable.',
  'Diamond jewellery is certified by an authorized gemological laboratory (if applicable).',
  'Net weight excludes stones, wax, thread, or fittings unless specified.',
  'Making charges are calculated as per prevailing rates and are non-refundable.',
  'Rates are based on metal prices prevailing on the date of billing.',
];

/** Part 2: Transaction & policies */
export const INVOICE_TERMS_PART2_TITLE = 'Transaction & policies';
export const INVOICE_TERMS_PART2_ITEMS: string[] = [
  'No claims will be entertained for price fluctuations after purchase.',
  'Jewellery once sold will not be returned.',
  'Making charges, GST, and stone charges are non-refundable on exchange.',
  'Buyback value will be calculated based on current market rate after deduction of melting/refining charges.',
  'GST is charged as applicable under Government of India regulations.',
  'Keep the Invoice for any future exchange, repair, or buyback.',
];

export interface InvoiceTermsConfig {
  title: string;
  part1Title: string;
  part1Items: string[];
  part2Title: string;
  part2Items: string[];
}

const STORAGE_KEY = 'invoiceTerms';

function getStoredTerms(): InvoiceTermsConfig | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as InvoiceTermsConfig;
    if (
      typeof parsed.title === 'string' &&
      typeof parsed.part1Title === 'string' &&
      Array.isArray(parsed.part1Items) &&
      typeof parsed.part2Title === 'string' &&
      Array.isArray(parsed.part2Items)
    ) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

/** Returns invoice terms from localStorage if set, otherwise defaults. Use this at runtime for display/print. */
export function getInvoiceTerms(): InvoiceTermsConfig {
  const stored = getStoredTerms();
  if (stored) return stored;
  return {
    title: INVOICE_TERMS_TITLE,
    part1Title: INVOICE_TERMS_PART1_TITLE,
    part1Items: [...INVOICE_TERMS_PART1_ITEMS],
    part2Title: INVOICE_TERMS_PART2_TITLE,
    part2Items: [...INVOICE_TERMS_PART2_ITEMS],
  };
}

/** Saves invoice terms to localStorage so each jeweller can use their own terms. */
export function setInvoiceTerms(terms: InvoiceTermsConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(terms));
  } catch {
    // ignore
  }
}
