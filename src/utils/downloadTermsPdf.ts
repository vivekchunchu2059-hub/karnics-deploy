/**
 * Opens a print-friendly window with Invoice Terms & Conditions.
 * User can use the browser's "Save as PDF" from the print dialog.
 * Uses runtime-configured terms (getInvoiceTerms) so each jeweller can use their own.
 */
import { getInvoiceTerms } from '../constants/invoiceTerms';
import { getGlobalNotifier } from '../services/notificationService';

const getTermsHtml = (shopName: string): string => {
  const terms = getInvoiceTerms();
  const part1Items = terms.part1Items.map(
    (item) => `<li style="margin-bottom: 8px; line-height: 1.5;">${item}</li>`
  ).join('');
  const part2Items = terms.part2Items.map(
    (item) => `<li style="margin-bottom: 8px; line-height: 1.5;">${item}</li>`
  ).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${terms.title} - ${shopName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      padding: 40px 50px;
      color: #1a1a2e;
      max-width: 700px;
      margin: 0 auto;
    }
    .header {
      border-bottom: 2px solid #2e2d47;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .header h1 {
      font-size: 22px;
      font-weight: 700;
      color: #2e2d47;
    }
    .header .shop {
      font-size: 14px;
      color: #6b7280;
      margin-top: 4px;
    }
    .intro {
      font-size: 13px;
      color: #4b5563;
      margin-bottom: 20px;
      line-height: 1.5;
    }
    ol, ul {
      padding-left: 24px;
      font-size: 13px;
      line-height: 1.6;
      color: #374151;
    }
    li {
      margin-bottom: 10px;
    }
    .footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
      font-size: 11px;
      color: #9ca3af;
    }
    @media print {
      body { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${terms.title}</h1>
    <div class="shop">${shopName}</div>
  </div>
  <p class="intro">The following terms and conditions apply to all invoices and purchases.</p>
  <h2 style="font-size: 14px; font-weight: 700; color: #1e293b; margin: 20px 0 10px;">${terms.part1Title}</h2>
  <ol>${part1Items}</ol>
  <h2 style="font-size: 14px; font-weight: 700; color: #1e293b; margin: 20px 0 10px;">${terms.part2Title}</h2>
  <ol>${part2Items}</ol>
  <div class="footer">
    Document generated on ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}. For official use.
  </div>
  <script>
    window.onload = function() {
      window.print();
      window.onafterprint = function() { window.close(); };
    };
  </script>
</body>
</html>
  `.trim();
};

/**
 * Opens a new window with the terms content and triggers the print dialog
 * (user can choose "Save as PDF" as the destination).
 */
export function downloadTermsPdf(shopName: string = 'RANKA Jewellers'): void {
  const html = getTermsHtml(shopName);
  const win = window.open('', '_blank', 'noopener,noreferrer');
  if (!win) {
    const notifier = getGlobalNotifier();
    if (notifier) notifier.showWarning('Please allow pop-ups to download the Terms & Conditions PDF.');
    else alert('Please allow pop-ups to download the Terms & Conditions PDF.');
    return;
  }
  win.document.write(html);
  win.document.close();
}
