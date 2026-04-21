import React, { useState, useEffect } from "react";
import { Box, Divider, Dialog, DialogContent, Typography } from "@mui/material";
import { INVOICE_CONFIG } from "../../config/invoice";
import { InvoiceDialogProps } from "../../models/Billing";
import { INDIAN_NUMBER_UNITS, ONES, TENS } from "../../constants/common";
import { getInvoiceTerms, type InvoiceTermsConfig } from "../../constants/invoiceTerms";
import { APP_COLORS } from "../../constants/colors";
import { STORAGE_COMPANY_NAME } from "../../utils/uploadConstants";
import { apiClient, API_BASE_URL } from "../../api";
import { PrintButton, CancelButton } from "./InvoiceStyle";
import log from '../../utils/logger';
import { formatInrAmount, roundInrPaise } from '../../utils/formatCurrency';

const getRegistrationImageUrl = (path: string | undefined): string => {
  if (!path || path.startsWith("data:")) return "";
  const base = apiClient.defaults.baseURL || API_BASE_URL;
  return `${base}/api/registration-images/${path.replace(/^\//, "")}`;
};

const numberToWordsIndian = (num: number) => {
  if (isNaN(num)) return "—";
  if (num === 0) return "Zero";

  const twoDigit = (n: number) => {
    if (n < 20) return ONES[n];
    const t = Math.floor(n / 10);
    const o = n % 10;
    return `${TENS[t]}${o ? " " + ONES[o] : ""}`.trim();
  };

  const threeDigit = (n: number) => {
    const h = Math.floor(n / 100);
    const rest = n % 100;
    const hPart = h ? `${ONES[h]} Hundred` : "";
    const rPart = rest ? `${h ? " " : ""}${twoDigit(rest)}` : "";
    return `${hPart}${rPart}`.trim();
  };

  let n = Math.floor(num);
  const result: string[] = [];

  for (const u of INDIAN_NUMBER_UNITS) {
    if (n >= u.value) {
      const count = Math.floor(n / u.value);
      result.push(`${count < 100 ? twoDigit(count) : threeDigit(count)} ${u.str}`);
      n = n % u.value;
    }
  }

  if (n > 0) result.push(twoDigit(n));

  return result.join(" ").trim();
};

/** Match numeric Grand Total (2 dp): rupees + optional paise in words. */
const grandTotalInWords = (grandTotal: number, toWords: (n: number) => string) => {
  const rounded = roundInrPaise(grandTotal);
  const rupees = Math.floor(rounded);
  const paise = Math.round((rounded - rupees) * 100);
  const rupeePart = toWords(rupees);
  if (paise <= 0) return rupeePart;
  return `${rupeePart} and ${toWords(paise)} Paise`;
};

export const InvoiceDialog: React.FC<InvoiceDialogProps> = ({
  open,
  onClose,
  onPrint,
  billDetails,
  paymentMode,
  customerDetails,
  items,
  totals,
  cgstPercent,
  sgstPercent,
  gstEnabled,
  registrationData,
  viewMode,
  installments,
}) => {
  const totalQty = items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    return sum + qty;
  }, 0);

  const [companyName, setCompanyName] = useState<string>("");
  const [invoiceTerms, setInvoiceTerms] = useState<InvoiceTermsConfig>(() => getInvoiceTerms());
  const [liveRegistrationData, setLiveRegistrationData] = useState<any>(registrationData || null);
  useEffect(() => {
    if (open) {
      setCompanyName(localStorage.getItem(STORAGE_COMPANY_NAME) || "");
      setInvoiceTerms(getInvoiceTerms());
      // Company logo uses registrationData.logo only (not localStorage)
    }
  }, [open]);

  useEffect(() => {
    setLiveRegistrationData(registrationData || null);
  }, [registrationData]);

  useEffect(() => {
    if (!open) return;
    const fetchLatestRegistration = async () => {
      try {
        const response = await apiClient.get<{ success: boolean; data: any[] }>("/api/registration");
        const registrations = response.data?.data || [];
        if (registrations.length > 0) {
          setLiveRegistrationData(registrations[registrations.length - 1]);
        }
      } catch (error) {
        log.error("Error fetching latest registration:", error);
        // Keep existing registration data fallback if live fetch fails
      }
    };
    fetchLatestRegistration();
  }, [open]);

  const resolveLogoSrc = (logo: string | null | undefined): string => {
    if (!logo) return "";
    if (logo.startsWith("data:") || logo.startsWith("http") || logo.startsWith("/")) return logo;
    return getRegistrationImageUrl(logo);
  };

  // Logo comes only from registration (registration.json via API → registrationData); not localStorage
  const headerRegistrationData = liveRegistrationData || registrationData;
  const displayLogoSrc = resolveLogoSrc(headerRegistrationData?.logo ?? null);
  const displayCompanyName = headerRegistrationData?.shopName || companyName || "RANKA";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 0,
          overflow: "hidden",
          boxShadow: "0 24px 48px rgba(0,0,0,0.12)",
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Header - background matches PDF/print */}
        <Box
          sx={{
            backgroundColor: "rgba(89, 12, 22, 1)",
            color: "#fff",
            px: 3,
            py: 2.5,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 2,
            // Preserve background when printing/saving as PDF
            printColorAdjust: "exact",
            WebkitPrintColorAdjust: "exact",
          }}
        >
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            {displayLogoSrc && (
              <Box
                component="img"
                src={displayLogoSrc}
                alt="Company logo"
                sx={{ width: 52, height: 52, objectFit: "contain", borderRadius: 1 }}
              />
            )}
            <Box>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  fontFamily: '"Playfair Display", Georgia, serif',
                  color: APP_COLORS.gold,
                  letterSpacing: "0.5px",
                }}
              >
                {displayCompanyName}
              </Typography>
              <Typography sx={{ fontSize: "0.7rem", opacity: 0.9, mt: 0.5, lineHeight: 1.5, maxWidth: 320 }}>
                {headerRegistrationData?.shopAddress || INVOICE_CONFIG.addressLines.join(", ") ||" Shop Address "}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ textAlign: "right", fontSize: "0.7rem", opacity: 0.95 }}>
            {headerRegistrationData?.mobileNumber && <Box>Mobile: {headerRegistrationData.mobileNumber}</Box>}
            {headerRegistrationData?.email && <Box>Email: {headerRegistrationData.email}</Box>}
            {headerRegistrationData?.gstNumber && <Box sx={{ fontWeight: 600 }}>GSTIN: {headerRegistrationData.gstNumber}</Box>}
          </Box>
        </Box>

        <Box sx={{ p: 3, backgroundColor: "#fafbfc" }}>
          {/* Bill To + Invoice meta */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              gap: 3,
              mb: 3,
              flexWrap: "wrap",
            }}
          >
            <Box
              sx={{
                flex: "1 1 280px",
                padding: 2,
                borderRadius: 1,
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: "#2e2d47", textTransform: "uppercase", letterSpacing: "0.5px", mb: 0.75 }}>
                Invoice To
              </Typography>
              <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: "#1e293b" }}>
                {`${customerDetails.customerTitle || ""} ${customerDetails.customerName || ""}`.trim() || "Customer"}
              </Typography>

              {customerDetails.address && (
                <Typography sx={{ fontSize: "0.75rem", color: "#475569", mt: 0.5 }}>
                  {customerDetails.address}
                </Typography>
              )}

              {(customerDetails.state || customerDetails.city) && (
                <Typography sx={{ fontSize: "0.75rem", color: "#475569" }}>
                  {[customerDetails.city, customerDetails.state].filter(Boolean).join(", ")}
                </Typography>
              )}

              {customerDetails.panAadharNumber && (
                <Typography sx={{ fontSize: "0.75rem", color: "#475569" }}>
                  Aadhaar: {customerDetails.panAadharNumber}
                </Typography>
              )}

              {customerDetails.contactNumber && (
                <Typography sx={{ fontSize: "0.75rem", color: "#475569" }}>
                  Phone: +91-{customerDetails.contactNumber}
                </Typography>
              )}

              {customerDetails.email && (
                <Typography sx={{ fontSize: "0.75rem", color: "#475569" }}>
                  Email: {customerDetails.email}
                </Typography>
              )}

              
            </Box>
            <Box
              sx={{
                display: "flex",
                gap: 3,
                flexWrap: "wrap",
                padding: 2,
                borderRadius: 1,
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                alignSelf: "flex-start",
              }}
            >
              <Box>
                <Typography sx={{ fontSize: "0.65rem", color: "#2e2d47", textTransform: "uppercase", fontWeight: 600 }}>Invoice No</Typography>
                <Typography sx={{ fontWeight: 700, fontSize: "0.8rem" }}>{billDetails.billNumber || "—"}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: "0.65rem", color: "#2e2d47", textTransform: "uppercase", fontWeight: 600 }}>Date</Typography>
                <Typography sx={{ fontWeight: 700, fontSize: "0.8rem" }}>{billDetails.billDate || "—"}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: "0.65rem", color: "#2e2d47", textTransform: "uppercase", fontWeight: 600 }}>Payment</Typography>
                <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", textTransform: "capitalize" }}>
                  {paymentMode?.toLowerCase() === 'check' ? 'Cheque' : (paymentMode || "—")}
                </Typography>
              </Box>
            </Box>
          </Box>

          {viewMode === "installment" && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mb: 2,
                px: 1
              }}
            >
              <Typography sx={{ fontWeight: 700, fontSize: "0.85rem" }}>
                Total Purchase Amount:{" "}
                <Box component="span" sx={{ fontWeight: 400, fontSize: "0.78rem" }}>
                  ₹{formatInrAmount(totals.grandTotal)}
                </Box>
              </Typography>
              <Typography sx={{ fontWeight: 700, fontSize: "0.85rem" }}>
                Advance Amount:{" "}
                <Box component="span" sx={{ fontWeight: 400, fontSize: "0.78rem" }}>
                  ₹{(totals.discount || 0).toLocaleString("en-IN")}
                </Box>
              </Typography>
            </Box>
          )}

          {viewMode !== "installment" && (
            <Box
                sx={{
                  borderRadius: 1,
                  overflow: "hidden",
                  border: "1px solid #e5e7eb",
                  backgroundColor: "#fff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "40px 2fr 0.85fr 0.65fr 0.6fr 1fr 1fr 1fr",
                    gap: 0.75,
                    backgroundColor: "#f1f5f9",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    color: "#475569",
                    px: 2,
                    py: 1.5,
                  }}
                >
                  <Box>S.No.</Box>
                  <Box>Item</Box>
                  <Box>Metal</Box>
                  <Box>Weight</Box>
                  <Box sx={{ textAlign: "right" }}>Qty</Box>
                  <Box sx={{ textAlign: "right" }}>Making</Box>
                  <Box sx={{ textAlign: "right" }}>Price</Box>
                  <Box sx={{ textAlign: "right" }}>Total</Box>
                </Box>
                {items?.length > 0 ? (
                  items.map((item, idx) => {
                    const qty = Number(item.quantity) || 0;
                    const price = Number(item.price) || 0;
                    const makingCharge = Number(item.makingCharge) || 0;
                    const lineTotal = qty * price + makingCharge;
                    return (
                      <Box
                        key={`${item.itemName}-${idx}`}
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "40px 2fr 0.85fr 0.65fr 0.6fr 1fr 1fr 1fr",
                          gap: 0.75,
                          fontSize: "0.72rem",
                          px: 2,
                          py: 1.5,
                          borderTop: "1px solid #f1f5f9",
                          alignItems: "center",
                        }}
                      >
                        <Box sx={{ color: "#2e2d47" }}>{idx + 1}</Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 500, fontSize: "inherit" }}>{item.itemName || "—"}</Typography>
                          {item.description && (
                            <Typography sx={{ fontSize: "0.65rem", color: "#2e2d47" }}>{item.description}</Typography>
                          )}
                        </Box>
                        <Box>{item.metal || "—"}</Box>
                        <Box>{item.weight || "—"}</Box>
                        <Box sx={{ textAlign: "right" }}>{qty} Pcs</Box>
                        <Box sx={{ textAlign: "right" }}>₹{makingCharge.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</Box>
                        <Box sx={{ textAlign: "right" }}>₹{price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</Box>
                        <Box sx={{ textAlign: "right", fontWeight: 600 }}>₹{lineTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</Box>
                      </Box>
                    );
                  })
                ) : (
                  <Box sx={{ py: 3, textAlign: "center", color: "#94a3b8", fontSize: "0.8rem" }}>No items added</Box>
                )}
                {/* GST (CGST, SGST) — above Total */}
                {gstEnabled && items?.length > 0 && (
                  <Box sx={{ display: "flex", justifyContent: "flex-end", px: 2, py: 1, borderTop: "1px solid #e2e8f0", backgroundColor: "#fafbfc" }}>
                    <Box sx={{ minWidth: 260, fontSize: "0.8rem" }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                        <span style={{ color: "#2e2d47" }}>CGST @ {cgstPercent}%</span>
                        <span style={{ fontWeight: 600 }}>₹{totals.cgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#2e2d47" }}>SGST @ {sgstPercent}%</span>
                        <span style={{ fontWeight: 600 }}>₹{totals.sgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                      </Box>
                    </Box>
                  </Box>
                )}
                {/* Summary row inside table so Qty and Total align with table columns */}
                {items?.length > 0 && (
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "40px 2fr 0.85fr 0.65fr 0.6fr 1fr 1fr 1fr",
                      gap: 0.75,
                      fontSize: "0.7rem",
                      px: 2,
                      py: 3,
                      borderTop: "1px solid #e2e8f0",
                      backgroundColor: "#f8fafc",
                      alignItems: "start",
                    }}
                  >
                    <Box sx={{ gridColumn: "1 / 5", color: "#475569", textAlign: "left", overflow: "hidden", wordBreak: "break-word", overflowWrap: "break-word" }}>
                      <Box sx={{ fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Total value
                        <Box component="span" sx={{ fontSize: "0.6rem", textTransform: "uppercase" }}>(in words):</Box>
                      </Box>
                      <Box sx={{ textTransform: "lowercase", wordBreak: "break-word", overflowWrap: "break-word" }}>
                        {grandTotalInWords(totals.grandTotal, numberToWordsIndian)}
                      </Box>
                    </Box>
                    <Box sx={{ gridColumn: "5", textAlign: "right", fontWeight: 600, fontSize: "0.72rem" }}>{totalQty} Pcs</Box>
                    <Box sx={{ gridColumn: "6" }} />
                    <Box sx={{ gridColumn: "7" }} />
                    <Box sx={{ gridColumn: "8", textAlign: "right", display: "flex", alignItems: "center", gap: 1, justifyContent: "flex-end" }}>
                      <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", color: "#1e293b" }}>Total</Typography>
                      <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: "#0f172a" }}>
                        ₹{formatInrAmount(totals.grandTotal)}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
          )}

          {viewMode === "installment" && (
            <Box
              sx={{
                border: "1px solid #e5e7eb",
                borderRadius: 1,
                p: 2,
                backgroundColor: "#fff",
              }}
            >
              <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start", flexWrap: "wrap" }}>
                {/* Customer Purchased */}
                {items?.length > 0 && (
                  <Box sx={{ flex: "0 0 240px", px: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", lineHeight: 1.2, mb: 0.75 }}>
                      Customer Purchased:
                    </Typography>
                    {items.map((item, idx) => (
                      <Typography key={idx} sx={{ fontSize: "0.78rem", lineHeight: 1.2 }}>
                        • {item.quantity} x {item.itemName}
                      </Typography>
                    ))}
                  </Box>
                )}

                <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />

                {/* Installment Table */}
                <Box sx={{ flex: "1 1 280px" }}>
                  <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", lineHeight: 1.2, mb: 0.75, px: 1 }}>
                    Installment List:
                  </Typography>

                  <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 1 }}>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "30% 35% 35%",
                        backgroundColor: "#f5f5f5",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        p: 1,
                      }}
                    >
                      <Box>S No.</Box>
                      <Box>Date</Box>
                      <Box sx={{ textAlign: "right" }}>Amount</Box>
                    </Box>

                    {(installments?.slice().sort((a, b) => a.installmentNo - b.installmentNo) ?? []).map((inst) => (
                      <Box
                        key={inst.installmentNo}
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "30% 35% 35%",
                          p: 1,
                          borderTop: "1px solid #e0e0e0",
                          fontSize: "0.78rem",
                          backgroundColor: "#fafafa",
                        }}
                      >
                        <Box>{inst.installmentNo}</Box>
                        <Box>{inst.date}</Box>
                        <Box sx={{ textAlign: "right" }}>
                          ₹{Number(inst.amount).toLocaleString("en-IN")}
                        </Box>
                      </Box>
                    ))}

                    {/* Total Row */}
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "65% 35%",
                        backgroundColor: "#f5f5f5",
                        borderTop: "1px solid #e0e0e0",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                      }}
                    >
                      <Box sx={{ p: 1, fontWeight: 700 }}>Total</Box>
                      <Box sx={{ p: 1, textAlign: "right", fontWeight: 700 }}>
                        ₹{formatInrAmount(totals.grandTotal)}
                      </Box>
                    </Box>

                    {/* Balance Row */}
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "65% 35%",
                        backgroundColor: "#f5f5f5",
                        borderTop: "1px solid #e0e0e0",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                      }}
                    >
                      <Box sx={{ p: 1, fontWeight: 700 }}>Balance</Box>
                      <Box sx={{ p: 1, textAlign: "right", fontWeight: 700 }}>
                        ₹{totals.balance?.toLocaleString("en-IN") || "0"}
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}

          {viewMode !== "installment" && (
            <>
              {/* Terms (two parts) + Signature */}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "stretch", gap: 3, flexWrap: "wrap" }}>
                <Box sx={{ flex: "1 1 300px", minWidth: 0 }}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                      height: "100%",
                    }}
                  >
                    <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: "#2e2d47", textTransform: "uppercase", letterSpacing: "0.5px", mb: 1 }}>
                      {invoiceTerms.title}
                    </Typography>

                    {/* Terms: left = Part 1, right = Part 2 */}
                    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                      <Box sx={{ flex: "1 1 240px", minWidth: 0 }}>
                        <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: "#1e293b", mb: 0.5 }}>
                          {invoiceTerms.part1Title}
                        </Typography>
                        <Box
                          component="ol"
                          sx={{ m: 0, pl: "1.25rem", fontSize: "0.7rem", lineHeight: 1.6, color: "#475569", "& li": { mb: 0.25 } }}
                        >
                          {invoiceTerms.part1Items.map((term, idx) => (
                            <li key={idx}>{term}</li>
                          ))}
                        </Box>
                      </Box>
                      <Box sx={{ flex: "1 1 240px", minWidth: 0 }}>
                        <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: "#1e293b", mb: 0.5 }}>
                          {invoiceTerms.part2Title}
                        </Typography>
                        <Box
                          component="ol"
                          sx={{ m: 0, pl: "1.25rem", fontSize: "0.7rem", lineHeight: 1.6, color: "#475569", "& li": { mb: 0.25 } }}
                        >
                          {invoiceTerms.part2Items.map((term: string, idx: number) => (
                            <li key={idx}>{term}</li>
                          ))}
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", flexShrink: 0 }}>
                  <Box sx={{ width: 120, height: 56, border: "1px dashed #cbd5e1", borderRadius: 1, mb: 0.75 }} />
                  <Typography sx={{ fontSize: "0.65rem", fontWeight: 600, color: "#2e2d47" }}>Authorized Signature</Typography>
                </Box>
              </Box>
            </>
          )}
        </Box>

        <Box sx={{ p: 2, borderTop: "1px solid #e5e7eb", backgroundColor: "#fff", display: "flex", justifyContent: "center", gap: 2 }}>
          <PrintButton onClick={onPrint}>Download / Print Invoice</PrintButton>
          <CancelButton onClick={onClose}>Close</CancelButton>
        </Box>
      </DialogContent>
    </Dialog>
  );
};