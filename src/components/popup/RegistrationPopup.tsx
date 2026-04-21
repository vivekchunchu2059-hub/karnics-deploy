import React from "react";
import { Dialog, DialogContent, DialogActions, Typography, Button, Box } from "@mui/material";
import { MESSAGES } from "../../constants/errorMessages";

interface Props {
  open: boolean;
  type: "customer" | "server" | "success" | "missingFields" | "noCustomerId" | "customerIdBadRequest" | "duplicateCustomer" | "duplicateGst" | "ipAddressError" | "serviceUnavailable" | null;
  customerId?: string | null;
  onClose: () => void;
}

const RegistrationPopup: React.FC<Props> = ({
  open,
  type,
  customerId,
  onClose
}) => {
  if (!open || !type) return null;

  const getContent = () => {
    switch (type) {
      case "missingFields":
        return {
          title: "Missing Required Fields",
          message: MESSAGES.MISSING_FIELDS,
          color: "error.main"
        };

      case "ipAddressError":
        return {
          title: "IP Address Error",
          message: MESSAGES.IP_ERROR,
          color: "error.main"
        };

      case "noCustomerId":
        return {
          title: "Customer ID Generation Failed",
          message: MESSAGES.CUSTOMER_ID_FAILED,
          color: "error.main"
        };

      case "customerIdBadRequest":
        return {
          title: "Invalid Registration Data",
          message: MESSAGES.BAD_REQUEST,
            color: "error.main"
        };

      case "duplicateCustomer":
        return {
          title: "Registration Already Exists",
          message: MESSAGES.DUPLICATE_CUSTOMER,
            color: "error.main"
        };

      case "duplicateGst":
        return {
          title: "GST Number Already Registered",
          message: MESSAGES.DUPLICATE_GST,
            color: "error.main"
        };

      case "customer":
        return {
          title: "Registration Verification Failed",
          message: MESSAGES.CUSTOMER_VERIFICATION_FAILED,
            color: "error.main"
        };

      case "serviceUnavailable":
        return {
          title: "Service Unavailable",
          message: MESSAGES.SERVICE_UNAVAILABLE,
          color: "error.main"
        };

      case "server":
        return {
          title: "Server Communication Error",
          message: MESSAGES.SERVER_ERROR,
            color: "error.main"
        };

      case "success":
        return {
          title: "Registration Successful 🎉",
          message: `Your Customer ID has been generated successfully.`,
          color: "success.main"
        };

      default:
        return { title: "", message: "", color: "text.primary" };
    }
  };

  const { title, message, color } = getContent();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: "18px",
          padding: 2,
          minWidth: "420px",
          textAlign: "center"
        }
      }}
    >
      <DialogContent>
        <Box>
          <Typography variant="h6" fontWeight="600" mb={2} color={color}>
            {title}
          </Typography>

          <Typography fontSize="14px" color="text.secondary" mb={1}>
            {message}
          </Typography>

          {type === "success" && customerId && (
            <Typography
              fontSize="16px"
              fontWeight="bold"
              color="primary"
            >
              Your Customer Id : {customerId}
            </Typography>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
        <Button
          variant="contained"
          onClick={onClose}
          sx={{ 
            borderRadius: "8px", 
            paddingX: 4,
            backgroundColor: 'rgba(89, 12, 22, 1)',
            color: '#ffffff',
            '&:hover': {
              backgroundColor: 'rgba(89, 12, 22, 1)',
            },
          }}
        >
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RegistrationPopup;