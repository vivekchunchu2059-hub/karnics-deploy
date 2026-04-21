import React from "react";
import { Box, Typography } from "@mui/material";
import { FormikProps } from "formik";
import { FormField, FormSection, SectionTitle } from "./BillingStyles";
import { BillingFormValues } from "../../../models/Billing";

type BillDetailsSectionProps = {
  formik: FormikProps<BillingFormValues>;
  isEditMode: boolean;
};

export const BillDetailsSection: React.FC<BillDetailsSectionProps> = ({
  formik,
  isEditMode,
}) => (
  <FormSection>
    <SectionTitle>Bill Details</SectionTitle>
    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
      <Box>
        <Typography sx={{ fontSize: "14px", fontWeight: 500, mb: 0.5 }}>
          Bill Number
        </Typography>
        <FormField
          fullWidth
          InputProps={{ readOnly: true }}
          {...formik.getFieldProps("billDetails.billNumber")}
          error={formik.touched.billDetails?.billNumber && Boolean(formik.errors.billDetails?.billNumber)}
          helperText={formik.touched.billDetails?.billNumber && formik.errors.billDetails?.billNumber}
          disabled={isEditMode}
        />
      </Box>
      <Box>
        <Typography sx={{ fontSize: "14px", fontWeight: 500, mb: 1 }}>
          Bill Date
        </Typography>
        <FormField
          fullWidth
          type="date"
          InputLabelProps={{ shrink: true }}
          inputProps={{
            min: new Date().toISOString().split("T")[0], // No past date
          }}
          {...formik.getFieldProps("billDetails.billDate")}
          error={
            formik.touched.billDetails?.billDate &&
            Boolean(formik.errors.billDetails?.billDate)
          }
          helperText={
            formik.touched.billDetails?.billDate &&
            formik.errors.billDetails?.billDate
          }
          disabled={isEditMode}
        />
      </Box>
    </Box>
  </FormSection>
);

