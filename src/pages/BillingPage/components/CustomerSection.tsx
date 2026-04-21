import React from "react";
import { Autocomplete, Box, MenuItem, Tooltip, Typography } from "@mui/material";
import { FormikProps } from "formik";
import { FormField, FormSection, FormSelect, SectionTitle } from "./BillingStyles";
import { BillingFormValues } from "../../../models/Billing";
import { CUSTOMER_TITLES, PAN_AADHAR_TYPES } from "../../../constants/common";

type CustomerSectionProps = {
  formik: FormikProps<BillingFormValues>;
  stateOptions: string[];
  onStateChange: (state: string) => void;
  hasSelectedState: boolean;
  normalizeText: (value: string) => string;
  isEditMode: boolean;
};

export const CustomerSection: React.FC<CustomerSectionProps> = ({
  formik,
  stateOptions,
  onStateChange,
  hasSelectedState,
  normalizeText,
  isEditMode,
}) => (
  <FormSection>
    <SectionTitle>Customer Details</SectionTitle>
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Row 1: Customer Name | State/City */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
        <Box>
          <Typography sx={{ fontSize: "14px", fontWeight: 500, mb: 0.5 }}>
            Customer Name
          </Typography>
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <FormSelect
              {...formik.getFieldProps("customerDetails.customerTitle")}
              size="small"
              sx={{ width: "100px" }}
            >
              {CUSTOMER_TITLES.map((title) => (
                <MenuItem key={title} value={title} onClick={(e) => e.preventDefault()}>
                  {title}
                </MenuItem>
              ))}
            </FormSelect>
            <Tooltip title={isEditMode ? "Customer Name is not editable" : ""} arrow placement="top">
              <span style={{ width: "100%" }}>
                <FormField
                  fullWidth
                  size="small"
                  {...formik.getFieldProps("customerDetails.customerName")}
                  error={
                    formik.touched.customerDetails?.customerName && Boolean(formik.errors.customerDetails?.customerName)
                  }
                  helperText={
                    formik.touched.customerDetails?.customerName && formik.errors.customerDetails?.customerName
                  }
                  disabled={isEditMode}
                />
              </span>
            </Tooltip>
          </Box>
        </Box>
        <Box>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <Box>
              <Typography sx={{ fontSize: "14px", fontWeight: 500, mb: 0.5 }}>
                State
              </Typography>
              <Tooltip title={isEditMode ? "State is not editable" : ""} arrow placement="top">
                <span style={{ display: "block" }}>
                  <Autocomplete
                    options={stateOptions}
                    loading={false}
                    filterOptions={(options, params) =>
                      options.filter((opt) =>
                        normalizeText(opt).includes(normalizeText(params.inputValue))
                      )
                    }
                    value={
                      stateOptions.find(
                        (s) =>
                          normalizeText(s) ===
                          normalizeText(formik.values.customerDetails?.state || "")
                      ) || null
                    }
                    onChange={(_, newValue) => onStateChange(newValue || "")}
                    onBlur={() => formik.setFieldTouched("customerDetails.state", true)}
                    renderInput={(params) => (
                      <FormField
                        {...params}
                        fullWidth
                        size="small"
                        placeholder="Select State"
                        inputProps={{
                          ...params.inputProps,
                          autoComplete: "off",
                        }}
                        error={formik.touched.customerDetails?.state && Boolean(formik.errors.customerDetails?.state)}
                        helperText={formik.touched.customerDetails?.state && formik.errors.customerDetails?.state}
                      />
                    )}
                    disabled={isEditMode}
                  />
                </span>
              </Tooltip>
            </Box>
            <Box>
              <Typography sx={{ fontSize: "14px", fontWeight: 500, mb: 0.5 }}>
                City
              </Typography>
              <FormField
                fullWidth
                size="small"
                placeholder="Enter City"
                {...formik.getFieldProps("customerDetails.city")}
                disabled={!hasSelectedState}
                error={formik.touched.customerDetails?.city && Boolean(formik.errors.customerDetails?.city)}
                helperText={formik.touched.customerDetails?.city && formik.errors.customerDetails?.city}
              />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Row 2 & 3: PAN/Aadhar & Contact Number | Address (spanning 2 rows) */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
        {/* Left Column: PAN/Aadhar Number and Contact Number */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Box>
            <Typography sx={{ fontSize: "14px", fontWeight: 500, mb: 0.5 }}>
              Customer PAN/Aadhar Number
            </Typography>
            <Box sx={{ display: "flex", gap: 2 }}>
              <FormSelect
                {...formik.getFieldProps("customerDetails.panAadharType")}
                size="small"
                sx={{ width: "150px" }}
              >
                {PAN_AADHAR_TYPES.map((type) => (
                  <MenuItem key={type} value={type} onClick={(e) => e.preventDefault()}>
                    {type}
                  </MenuItem>
                ))}
              </FormSelect>
              <FormField
                fullWidth
                size="small"
                {...formik.getFieldProps("customerDetails.panAadharNumber")}
                error={
                  formik.touched.customerDetails?.panAadharNumber &&
                  Boolean(formik.errors.customerDetails?.panAadharNumber)
                }
                helperText={
                  formik.touched.customerDetails?.panAadharNumber && formik.errors.customerDetails?.panAadharNumber
                }
              />
            </Box>
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <Box>
              <Typography sx={{ fontSize: "14px", fontWeight: 500, mb: 0.5 }}>
                Contact Number
              </Typography>
              <FormField
                fullWidth
                size="small"
                {...formik.getFieldProps("customerDetails.contactNumber")}
                error={
                  formik.touched.customerDetails?.contactNumber &&
                  Boolean(formik.errors.customerDetails?.contactNumber)
                }
                helperText={
                  formik.touched.customerDetails?.contactNumber && formik.errors.customerDetails?.contactNumber
                }
              />
            </Box>
            <Box>
              <Typography sx={{ fontSize: "14px", fontWeight: 500, mb: 0.5 }}>
                Email
              </Typography>
              <FormField
                fullWidth
                size="small"
                {...formik.getFieldProps("customerDetails.email")}
                error={
                  formik.touched.customerDetails?.email &&
                  Boolean(formik.errors.customerDetails?.email)
                }
                helperText={
                  formik.touched.customerDetails?.email && formik.errors.customerDetails?.email
                }
              />
            </Box>
          </Box>
        </Box>

        {/* Right Column: Address (spans 2 rows) */}
        <Box>
          <Typography sx={{ fontSize: "14px", fontWeight: 500, mb: 0.5 }}>
            Address
          </Typography>
          <FormField
            fullWidth
            multiline
            rows={5}
            size="small"
            {...formik.getFieldProps("customerDetails.address")}
            error={formik.touched.customerDetails?.address && Boolean(formik.errors.customerDetails?.address)}
            helperText={formik.touched.customerDetails?.address && formik.errors.customerDetails?.address}
          />
        </Box>
      </Box>
    </Box>
  </FormSection>
);
