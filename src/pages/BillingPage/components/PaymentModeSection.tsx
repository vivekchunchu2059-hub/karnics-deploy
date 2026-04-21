import React, { useRef, useCallback } from "react";
import { Box, MenuItem, Typography, Divider } from "@mui/material";
import { FormikProps } from "formik";
import { BillingFormValues } from "../../../models/Billing";
import { FormField, FormSection, FormSelect, SectionTitle } from "./BillingStyles";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { parse, format } from "date-fns";
import { CheckStatus, CHECK_STATUS_COLORS } from "../../../constants/chequeStatus";
import { Tooltip } from "@mui/material";


type PaymentModeSectionProps = {
  formik: FormikProps<BillingFormValues>;
  isReadOnly?: boolean;
};

export const PaymentModeSection: React.FC<PaymentModeSectionProps> = ({ formik, isReadOnly = false }) => {
  const paymentModeSelectRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const paymentMode = formik.values.paymentDetails.mode;
  const checkStatus = formik.values.paymentDetails.checkStatus;

  // Get color based on check status value
  const getCheckStatusColor = (status: string | undefined): string => {
    if (!status) return "inherit";
    const statusKey = Object.values(CheckStatus).find((value) => value === status);
    return statusKey ? CHECK_STATUS_COLORS[statusKey as CheckStatus] : "inherit";
  };

  // Get color based on payment mode value
  const getPaymentModeColor = (mode: string | undefined): string => {
    if (!mode) return "inherit";
    const modeLower = mode.toLowerCase();
    switch (modeLower) {
      case 'cash':
        return '#4caf50';
      case 'upi':
        return '#ff9800';
      case 'check':
        return '#2196f3';
      case 'credit':
        return '#9e9e9e';
      default:
        return "inherit";
    }
  };

  const getScrollParent = (el: HTMLElement | null): HTMLElement | null => {
    if (!el) return null;
    let p = el.parentElement;
    while (p) {
      const style = getComputedStyle(p);
      const oy = style.overflowY;
      if (oy === "auto" || oy === "scroll" || oy === "overlay") return p;
      p = p.parentElement;
    }
    return null;
  };

  const restoreScrollRef = useRef<{ scrollParent: HTMLElement; scrollTop: number } | null>(null);
  const restoreScroll = useCallback(() => {
    const saved = restoreScrollRef.current;
    if (!saved) return;
    if (saved.scrollParent.scrollTop !== saved.scrollTop) {
      saved.scrollParent.scrollTop = saved.scrollTop;
    }
  }, []);

  const scrollSectionIntoView = useCallback(() => {
    sectionRef.current?.scrollIntoView({ block: "nearest", behavior: "auto" });
  }, []);

  const billDate = formik.values.billDetails?.billDate;

  return (
    <FormSection ref={sectionRef}>
      <SectionTitle>Payment Mode</SectionTitle>
      <Typography sx={{ fontSize: "14px", color: "#616161", mb: 1 }}>
        Please select your Payment Mode
      </Typography>

      <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start", flexWrap: "wrap" }}>
        {/* Payment Mode Dropdown */}
        <Box sx={{ minWidth: 150 }}>
          <Tooltip title={isReadOnly ? "Payment mode is not editable" : ""} arrow placement="top">
            <span style={{ display: "block" }}>
              <FormSelect
                ref={paymentModeSelectRef}
                fullWidth
                size="small"
                displayEmpty
                disabled={isReadOnly}
                value={paymentMode}
                onOpen={() => {
                  const section = sectionRef.current;
                  let scrollParent: HTMLElement | null = section ? getScrollParent(section) : null;
                  if (!scrollParent && section) {
                    const docEl = document.scrollingElement as HTMLElement | null;
                    if (docEl && docEl.scrollTop !== undefined) scrollParent = docEl;
                  }
                  if (scrollParent) {
                    restoreScrollRef.current = { scrollParent, scrollTop: scrollParent.scrollTop };
                  }
                }}
                onChange={(e) => {
                  if (isReadOnly) return;
                  formik.setFieldValue("paymentDetails.mode", e.target.value);
                  // Reset other payment fields when mode changes
                  formik.setFieldValue("paymentDetails.amount", "");
                  formik.setFieldValue("paymentDetails.upiType", "");
                  formik.setFieldValue("paymentDetails.transitionId", "");
                  formik.setFieldValue("paymentDetails.checkNumber", "");
                  formik.setFieldValue("paymentDetails.checkDate", "");
                  formik.setFieldValue("paymentDetails.bankNameAddress", "");
                  formik.setFieldValue("paymentDetails.checkStatus", "pending");
                  formik.setFieldValue("paymentDetails.advanceAmount", "");
                  formik.setFieldValue("paymentDetails.numberOfInstallments", "");
                  formik.setFieldValue("paymentDetails.installmentDate", "");
                  // Restore scroll repeatedly (MUI/focus may reset it after first restore)
                  requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                      restoreScroll();
                      const el = paymentModeSelectRef.current;
                      if (el && typeof (el as HTMLElement).focus === "function") {
                        (el as HTMLElement).focus();
                      }
                    });
                  });
                  setTimeout(restoreScroll, 0);
                  setTimeout(restoreScroll, 50);
                  setTimeout(restoreScroll, 120);
                  setTimeout(() => {
                    restoreScroll();
                    scrollSectionIntoView();
                  }, 200);
                }}
                MenuProps={{
                  disableScrollLock: true,
                  onClose: restoreScroll,
                }}
                sx={{
                  "& .MuiInputBase-input": {
                    color: getPaymentModeColor(paymentMode),
                  },
                }}
              >
                <MenuItem value="" disabled onClick={(e) => e.preventDefault()}>Please select</MenuItem>
                <MenuItem 
                  value="cash" 
                  onClick={(e) => e.preventDefault()}
                  sx={{ 
                    backgroundColor: '#ffffff',
                    color: '#4caf50',
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                      color: '#4caf50',
                    },
                    '&.Mui-selected': {
                      backgroundColor: '#ffffff',
                      color: '#4caf50',
                      '&:hover': {
                        backgroundColor: '#f5f5f5',
                        color: '#4caf50',
                      },
                    },
                  }}
                >
                  Cash
                </MenuItem>
                <MenuItem 
                  value="upi" 
                  onClick={(e) => e.preventDefault()}
                  sx={{ 
                    backgroundColor: '#ffffff',
                    color: '#ff9800',
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                      color: '#ff9800',
                    },
                    '&.Mui-selected': {
                      backgroundColor: '#ffffff',
                      color: '#ff9800',
                      '&:hover': {
                        backgroundColor: '#f5f5f5',
                        color: '#ff9800',
                      },
                    },
                  }}
                >
                  UPI
                </MenuItem>
                <MenuItem 
                  value="check" 
                  onClick={(e) => e.preventDefault()}
                  sx={{ 
                    backgroundColor: '#ffffff',
                    color: '#2196f3',
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                      color: '#2196f3',
                    },
                    '&.Mui-selected': {
                      backgroundColor: '#ffffff',
                      color: '#2196f3',
                      '&:hover': {
                        backgroundColor: '#f5f5f5',
                        color: '#2196f3',
                      },
                    },
                  }}
                >
                  Cheque
                </MenuItem>
                <MenuItem 
                  value="credit" 
                  onClick={(e) => e.preventDefault()}
                  sx={{ 
                    backgroundColor: '#ffffff',
                    color: '#9e9e9e',
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                      color: '#9e9e9e',
                    },
                    '&.Mui-selected': {
                      backgroundColor: '#ffffff',
                      color: '#9e9e9e',
                      '&:hover': {
                        backgroundColor: '#f5f5f5',
                        color: '#9e9e9e',
                      },
                    },
                  }}
                >
                  Credit
                </MenuItem>
              </FormSelect>
            </span>
          </Tooltip>
        </Box>

        {/* Conditional Fields Based on Payment Mode */}
        {/* No additional fields for cash payment mode */}

        {paymentMode === "upi" && (
          <>
            <Box sx={{ minWidth: 180 }}>
              <FormField
                label="Select UPI"
                size="small"
                fullWidth
                value={formik.values.paymentDetails.upiType || ""}
                onChange={(e) =>
                  formik.setFieldValue("paymentDetails.upiType", e.target.value)
                }
                onBlur={() => formik.setFieldTouched("paymentDetails.upiType", true)}
                error={formik.touched.paymentDetails?.upiType && Boolean(formik.errors.paymentDetails?.upiType)}
                helperText={formik.touched.paymentDetails?.upiType && formik.errors.paymentDetails?.upiType}
                placeholder="e.g., Google Pay, PhonePe"
              />
            </Box>
            <Box sx={{ minWidth: 200 }}>
              <FormField
                label="Transaction ID"
                size="small"
                fullWidth
                value={formik.values.paymentDetails.transitionId || ""}
                onChange={(e) =>
                  formik.setFieldValue("paymentDetails.transitionId", e.target.value)
                }
                onBlur={() => formik.setFieldTouched("paymentDetails.transitionId", true)}
                error={formik.touched.paymentDetails?.transitionId && Boolean(formik.errors.paymentDetails?.transitionId)}
                helperText={formik.touched.paymentDetails?.transitionId && formik.errors.paymentDetails?.transitionId}
              />
            </Box>
          </>
        )}

        {paymentMode === "check" && (
          <>
            <Box sx={{ width: 170 }}>
              <FormField
                label="Amount"
                type="number"
                size="small"
                fullWidth
                inputProps={{ step: "0.01", min: 0 }}
                value={formik.values.paymentDetails.amount || ""}
                onChange={(e) =>
                  formik.setFieldValue("paymentDetails.amount", e.target.value)
                }
                onBlur={() => formik.setFieldTouched("paymentDetails.amount", true)}
                error={formik.touched.paymentDetails?.amount && Boolean(formik.errors.paymentDetails?.amount)}
                helperText={formik.touched.paymentDetails?.amount && formik.errors.paymentDetails?.amount}
              />
            </Box>
            <Box sx={{ minWidth: 160 }}>
              <FormField
                label="Cheque Number"
                size="small"
                fullWidth
                value={formik.values.paymentDetails.checkNumber || ""}
                onChange={(e) =>
                  formik.setFieldValue("paymentDetails.checkNumber", e.target.value)
                }
                onBlur={() => formik.setFieldTouched("paymentDetails.checkNumber", true)}
                error={formik.touched.paymentDetails?.checkNumber && Boolean(formik.errors.paymentDetails?.checkNumber)}
                helperText={formik.touched.paymentDetails?.checkNumber && formik.errors.paymentDetails?.checkNumber}
              />
            </Box>
            <Box sx={{ width: 180 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
               <DatePicker
                  label="Check Date"                 
                   value={
                    formik.values.paymentDetails.checkDate
                      ? parse(formik.values.paymentDetails.checkDate, "dd-MM-yyyy", new Date())
                      : null
                  }
                  onChange={(date) => {
                    formik.setFieldValue(
                      "paymentDetails.checkDate",
                      date ? format(date, "dd-MM-yyyy") : ""
                    );
                  
                    formik.setFieldTouched("paymentDetails.checkDate", true);
                  }}
                  slotProps={{
                    textField: {
                      
                      size: "small",
                      fullWidth: true,
                      error: formik.touched.paymentDetails?.checkDate && Boolean(formik.errors.paymentDetails?.checkDate),
                      helperText: formik.touched.paymentDetails?.checkDate && formik.errors.paymentDetails?.checkDate,
                      sx: {
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "6px",
                          backgroundColor: "#ffffff",
                          "& fieldset": {
                            borderColor: "#d3d3d3",
                          },
                        },
                      },
                    },
                  }}
                />
              </LocalizationProvider>
            </Box>
            <Box sx={{ width: 160 }}>
              <FormField
                select
                fullWidth
                size="small"
                label="Cheque Status"
                value={formik.values.paymentDetails.checkStatus}
                onChange={(e) => {
                  formik.setFieldValue("paymentDetails.checkStatus", e.target.value);
                  requestAnimationFrame(() => {
                    requestAnimationFrame(restoreScroll);
                  });
                  setTimeout(restoreScroll, 0);
                  setTimeout(restoreScroll, 50);
                  setTimeout(restoreScroll, 120);
                  setTimeout(() => {
                    restoreScroll();
                    scrollSectionIntoView();
                  }, 200);
                }}
                onBlur={() => formik.setFieldTouched("paymentDetails.checkStatus", true)}
                error={formik.touched.paymentDetails?.checkStatus && Boolean(formik.errors.paymentDetails?.checkStatus)}
                helperText={formik.touched.paymentDetails?.checkStatus && formik.errors.paymentDetails?.checkStatus}
                SelectProps={{
                  onOpen: () => {
                    const section = sectionRef.current;
                    let scrollParent: HTMLElement | null = section ? getScrollParent(section) : null;
                    if (!scrollParent && section) {
                      const docEl = document.scrollingElement as HTMLElement | null;
                      if (docEl && docEl.scrollTop !== undefined) scrollParent = docEl;
                    }
                    if (scrollParent) {
                      restoreScrollRef.current = { scrollParent, scrollTop: scrollParent.scrollTop };
                    }
                  },
                  MenuProps: {
                    disableScrollLock: true,
                    onClose: restoreScroll,
                  },
                }}
                sx={{
                  "& .MuiInputBase-input": {
                    color: getCheckStatusColor(checkStatus),
                  },
                }}
              >
                <MenuItem 
                  value={CheckStatus.PENDING}
                  sx={{ color: CHECK_STATUS_COLORS[CheckStatus.PENDING], maxWidth: "10px" }}
                  onClick={(e) => e.preventDefault()}
                >{CheckStatus.PENDING}</MenuItem><Divider />
                <MenuItem 
                  value={CheckStatus.CLEARED}
                  sx={{ color: CHECK_STATUS_COLORS[CheckStatus.CLEARED], maxWidth: "10px" }}
                  onClick={(e) => e.preventDefault()}
                >{CheckStatus.CLEARED}</MenuItem><Divider />
                <MenuItem 
                  value={CheckStatus.BOUNCED}
                  sx={{ color: CHECK_STATUS_COLORS[CheckStatus.BOUNCED], maxWidth: "10px" }}
                  onClick={(e) => e.preventDefault()}
                >{CheckStatus.BOUNCED}</MenuItem><Divider />
                <MenuItem 
                  value={CheckStatus.CANCELLED}
                  sx={{ color: CHECK_STATUS_COLORS[CheckStatus.CANCELLED], maxWidth: "10px" }}
                  onClick={(e) => e.preventDefault()}
                >{CheckStatus.CANCELLED}</MenuItem><Divider />
                <MenuItem 
                  value={CheckStatus.RETURNED}
                  sx={{ color: CHECK_STATUS_COLORS[CheckStatus.RETURNED], maxWidth: "10px" }}
                  onClick={(e) => e.preventDefault()}
                >{CheckStatus.RETURNED}</MenuItem>
              </FormField>
            </Box>
          </>
        )}

        {paymentMode === "credit" && (
          <>
            <Box sx={{ minWidth: 180 }}>
              <FormField
                label="Advance Amount"
                type="number"
                size="small"
                fullWidth
                inputProps={{ step: "0.01", min: 0 }}
                value={formik.values.paymentDetails.advanceAmount || ""}
                onChange={(e) =>
                  formik.setFieldValue("paymentDetails.advanceAmount", e.target.value)
                }
                onBlur={() => formik.setFieldTouched("paymentDetails.advanceAmount", true)}
                error={formik.touched.paymentDetails?.advanceAmount && Boolean(formik.errors.paymentDetails?.advanceAmount)}
                helperText={formik.touched.paymentDetails?.advanceAmount && formik.errors.paymentDetails?.advanceAmount}
              />
            </Box>
            <Box sx={{ minWidth: 160 }}>
              <FormField
                label="No. of Installments"
                type="number"
                size="small"
                fullWidth
                inputProps={{ step: "1", min: 1 }}
                value={formik.values.paymentDetails.numberOfInstallments || ""}
                onChange={(e) =>
                  formik.setFieldValue("paymentDetails.numberOfInstallments", e.target.value)
                }
                onBlur={() => formik.setFieldTouched("paymentDetails.numberOfInstallments", true)}
                error={formik.touched.paymentDetails?.numberOfInstallments && Boolean(formik.errors.paymentDetails?.numberOfInstallments)}
                helperText={formik.touched.paymentDetails?.numberOfInstallments && formik.errors.paymentDetails?.numberOfInstallments}
              />
            </Box>
            <Box sx={{ minWidth: 160 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Tooltip
                  title={!billDate ? "Please select bill date first" : ""}
                  arrow
                  placement="top"
                >
                  <span>
                  <DatePicker
                      label="Installment Date"                
                      disabled={!billDate}
                      minDate={
                        billDate
                          ? parse(billDate, "yyyy-MM-dd", new Date())
                          : undefined
                      }
                      value={
                        formik.values.paymentDetails.installmentDate
                          ? parse(
                            formik.values.paymentDetails.installmentDate,
                            "dd-MM-yyyy",
                            new Date()
                          )
                          : null
                      }
                      onChange={(date) => {
                        formik.setFieldValue(
                          "paymentDetails.installmentDate",
                          date ? format(date, "dd-MM-yyyy") : ""
                        );
                        formik.setFieldTouched(
                          "paymentDetails.installmentDate",
                          true
                        );
                      }}
                      slotProps={{
                        textField: {
                          size: "small",
                          fullWidth: true,
                        },
                      }}
                    />
                  </span>
                </Tooltip>
              </LocalizationProvider>
            </Box>
          </>
        )}
      </Box>

      {/* Bank Name and Address for Check - Full width field below */}
      {paymentMode === "check" && (
        <Box sx={{ mt: 2 }}>
          <FormField
            label="Bank Name and Address"
            size="small"
            fullWidth
            multiline
            rows={2}
            value={formik.values.paymentDetails.bankNameAddress || ""}
            onChange={(e) =>
              formik.setFieldValue("paymentDetails.bankNameAddress", e.target.value)
            }
            onBlur={() => formik.setFieldTouched("paymentDetails.bankNameAddress", true)}
            error={formik.touched.paymentDetails?.bankNameAddress && Boolean(formik.errors.paymentDetails?.bankNameAddress)}
            helperText={formik.touched.paymentDetails?.bankNameAddress && formik.errors.paymentDetails?.bankNameAddress}
          />
        </Box>
      )}
    </FormSection>
  );
};