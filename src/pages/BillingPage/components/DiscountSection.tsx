import React from "react";
import { Box, MenuItem, Typography } from "@mui/material";
import { FormikProps } from "formik";
import { BillingFormValues } from "../../../models/Billing";
import { FormField, FormSelect } from "./BillingStyles";

type DiscountSectionProps = {
  formik: FormikProps<BillingFormValues>;
  appliedDiscount: number;
};

export const DiscountSection: React.FC<DiscountSectionProps> = ({
  formik,
  appliedDiscount,
}) => (
  <Box>
    <Typography sx={{ fontWeight: 600, fontSize: "16px", color: "#2c2c2c", mb: 1 }}>
      Discount
    </Typography>
    <Box
      sx={{
        display: "flex",
        gap: 2,
        alignItems: "flex-end",
        flexWrap: "wrap",
      }}
    >
      <Box sx={{ minWidth: 160 }}>
        <FormSelect
          fullWidth
          size="small"
          displayEmpty
          {...formik.getFieldProps("discountType")}
        >
          <MenuItem value="fixed" onClick={(e) => e.preventDefault()}>Amount</MenuItem>
          <MenuItem value="percent" onClick={(e) => e.preventDefault()}>Percentage (%)</MenuItem>
        </FormSelect>
      </Box>
      <Box sx={{ minWidth: 140 }}>
        <FormField
          placeholder="₹"
          type="number"
          fullWidth
          size="small"
          inputProps={{ step: "0.01", min: 0 }}
          {...formik.getFieldProps("discountValue")}
          onChange={(e) =>
            formik.setFieldValue(
              "discountValue",
              e.target.value === "" ? "" : Number(e.target.value)
            )
          }
        />
      </Box>
      {formik.values.discountType === "percent" && (
        <Typography sx={{ color: "#616161", fontSize: "13px", pb: 1 }}>
          Applied: ₹{appliedDiscount.toFixed(2)}
        </Typography>
      )}
    </Box>
  </Box>
);

