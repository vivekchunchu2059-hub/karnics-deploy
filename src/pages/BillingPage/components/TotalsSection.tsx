import React from "react";
import { Typography } from "@mui/material";
import { BillingTotals } from "../../../models/Billing";
import { FormSection, SectionTitle, TotalRow, TotalSection } from "./BillingStyles";

type TotalsSectionProps = {
  totals: BillingTotals;
  cgstPercent: number;
  sgstPercent: number;
};

export const TotalsSection: React.FC<TotalsSectionProps> = ({
  totals,
  cgstPercent,
  sgstPercent,
}) => (
  <FormSection>
    <SectionTitle>Totals</SectionTitle>
    <TotalSection>
      <TotalRow>
        <Typography sx={{ color: "#616161" }}>Subtotal</Typography>
        <Typography sx={{ fontWeight: 600 }}>
          ₹{totals.subtotal.toFixed(2)}
        </Typography>
      </TotalRow>
      <TotalRow>
        <Typography sx={{ color: "#616161" }}>CGST ({cgstPercent}%)</Typography>
        <Typography sx={{ fontWeight: 600 }}>
          ₹{totals.cgstAmount.toFixed(2)}
        </Typography>
      </TotalRow>
      <TotalRow>
        <Typography sx={{ color: "#616161" }}>SGST ({sgstPercent}%)</Typography>
        <Typography sx={{ fontWeight: 600 }}>
          ₹{totals.sgstAmount.toFixed(2)}
        </Typography>
      </TotalRow>
      <TotalRow>
        <Typography sx={{ color: "#616161" }}>Discount</Typography>
        <Typography sx={{ fontWeight: 600 }}>
          ₹{totals.discount.toFixed(2)}
        </Typography>
      </TotalRow>
      <TotalRow>
        <Typography sx={{ color: "#616161" }}>Grand Total</Typography>
        <Typography
          sx={{ fontWeight: 700, fontSize: "18px", color: "#2e2d47" }}
        >
          ₹{totals.grandTotal.toFixed(2)}
        </Typography>
      </TotalRow>
    </TotalSection>
  </FormSection>
);

