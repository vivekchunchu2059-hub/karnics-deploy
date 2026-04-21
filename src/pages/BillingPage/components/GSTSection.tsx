import React from "react";
import { Box, Checkbox, Typography } from "@mui/material";
import { FormikProps } from "formik";
import { BillingFormValues } from "../../../models/Billing";
import { FormField } from "./BillingStyles";

type GSTSectionProps = {
  formik: FormikProps<BillingFormValues>;
};

export const GSTSection: React.FC<GSTSectionProps> = ({ formik }) => (
  <Box>
    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
      <Checkbox
        checked={formik.values.gstEnabled}
        onChange={(e) => formik.setFieldValue("gstEnabled", e.target.checked)}
        sx={{
          color: "#2e2d47",
          "&.Mui-checked": {
            color: "#2e2d47",
          },
          padding: "4px",
          marginRight: "8px",
        }}
      />
      <Typography sx={{ fontWeight: 600, fontSize: "16px", color: "#2c2c2c", margin: 0 }}>
        GST
      </Typography>
    </Box>
    
    <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography sx={{ fontSize: "14px", fontWeight: 500, minWidth: "45px" }}>
          CGST
        </Typography>
        <FormField
          type="number"
          size="small"
          inputProps={{ step: "0.1", min: 0, max: 100, readOnly: true }}
          value={formik.values.cgstPercent}
          disabled
          sx={{ 
            width: "80px",
            "& .MuiInputBase-input.Mui-disabled": {
              WebkitTextFillColor: "#666",
              backgroundColor: "#f5f5f5",
            }
          }}
        />
        <Typography sx={{ fontSize: "14px", color: "#616161" }}>%</Typography>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography sx={{ fontSize: "14px", fontWeight: 500, minWidth: "45px" }}>
          SGST
        </Typography>
        <FormField
          type="number"
          size="small"
          inputProps={{ step: "0.1", min: 0, max: 100, readOnly: true }}
          value={formik.values.gstPercent}
          disabled
          sx={{ 
            width: "80px",
            "& .MuiInputBase-input.Mui-disabled": {
              WebkitTextFillColor: "#666",
              backgroundColor: "#f5f5f5",
            }
          }}
        />
        <Typography sx={{ fontSize: "14px", color: "#616161" }}>%</Typography>
      </Box>
    </Box>
  </Box>
);
