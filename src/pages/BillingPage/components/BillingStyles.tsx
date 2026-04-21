import {
  Add as AddIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { Alert, Box, Button, IconButton, Select, Table, TextField, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

export const Container = styled(Box)(({ theme }) => ({
  marginLeft: 280,
  padding: "24px",
  backgroundColor: "#f8f9fa",
  minHeight: "calc(100vh - 70px)",
  width: "calc(100% - 280px)",
  overflowY: "auto",
  overflowX: "hidden",
}));

export const PageHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "24px",
}));

export const PageTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  fontSize: "24px",
  color: "#2c2c2c",
  margin: 0,
}));

export const NewInvoiceButton = styled(Button)(({ theme }) => ({
  backgroundColor: "#6b1010",
  color: "#ffffff",
  textTransform: "none",
  fontSize: "14px",
  fontWeight: 500,
  padding: "10px 24px",
  borderRadius: "6px",
  transition: "background-color 0.3s ease",
  "&:hover": {
    backgroundColor: "#8b1515",
  },
}));

export const TabsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: "16px",
  marginBottom: "24px",
}));

interface TabProps {
  selected?: boolean;
}

export const Tab = styled(Button, {
  shouldForwardProp: (prop) => prop !== "selected",
})<TabProps>(({ selected }) => ({
  backgroundColor: selected ? "#2e2d47" : "#e0e0e0",
  color: selected ? "#ffffff" : "#2e2d47",
  textTransform: "none",
  fontSize: "14px",
  fontWeight: 500,
  padding: "10px 24px",
  borderRadius: "6px",
  "&:hover": {
    backgroundColor: selected ? "#3a3855" : "#bdbdbd",
  },
}));

export const FormSection = styled(Box)(({ theme }) => ({
  backgroundColor: "#ffffff",
  padding: "16px",
  borderRadius: "8px",
  marginBottom: "16px",
}));

export const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  fontSize: "16px",
  color: "#2e2d47",
  marginBottom: "12px",
  paddingBottom: "8px",
  borderBottom: "1px solid #e0e0e0",
}));

export const FormField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: "6px",
    backgroundColor: "#ffffff",
    "& fieldset": {
      borderColor: "#d3d3d3",
    },
  },
}));

export const FormSelect = styled(Select)(({ theme }) => ({
  borderRadius: "6px",
  backgroundColor: "#ffffff",
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "#d3d3d3",
  },
}));

export const PurchaseTable = styled(Table)(({ theme }) => ({
  "& .MuiTableCell-head": {
    backgroundColor: "#fafafa",
    fontWeight: 600,
    fontSize: "13px",
    color: "#424242",
    padding: "12px 8px",
  },
  "& .MuiTableCell-body": {
    fontSize: "13px",
    padding: "12px 8px",
    verticalAlign: "middle",
  },
}));

export const ActionButton = styled(IconButton)(({ theme }) => ({
  padding: "4px",
  color: "#4caf50",
  "&:hover": {
    backgroundColor: "#e8f5e9",
  },
  "&.edit": {
    color: "#2196f3",
    "&:hover": {
      backgroundColor: "#e3f2fd",
    },
  },
  "&.delete": {
    color: "#f44336",
    "&:hover": {
      backgroundColor: "#ffebee",
    },
  },
}));

export const TotalSection = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: "16px",
  marginTop: "32px",
  paddingTop: "24px",
  borderTop: "1px solid #e0e0e0",
}));

export const TotalRow = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "120px 150px",
  gap: "20px",
  fontSize: "14px",
  alignItems: "center",
}));

export const ButtonGroup = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: "16px",
  justifyContent: "flex-end",
  marginTop: "24px",
}));

export const SaveButton = styled(Button)(({ theme }) => ({
  backgroundColor: "#6b1010",
  color: "#ffffff",
  textTransform: "none",
  fontSize: "14px",
  fontWeight: 500,
  padding: "10px 24px",
  borderRadius: "6px",
  transition: "background-color 0.3s ease",
  "&:hover": {
    backgroundColor: "#8b1515",
  },
}));

export const CancelButton = styled(Button)(({ theme }) => ({
  backgroundColor: "#e0e0e0",
  color: "#2e2d47",
  textTransform: "none",
  fontSize: "14px",
  fontWeight: 500,
  padding: "10px 32px",
  borderRadius: "6px",
  "&:hover": {
    backgroundColor: "#bdbdbd",
  },
}));

export const PrintButton = styled(Button)(({ theme }) => ({
  backgroundColor: "#4caf50",
  color: "#ffffff",
  textTransform: "none",
  fontSize: "14px",
  fontWeight: 500,
  padding: "10px 32px",
  borderRadius: "6px",
  "&:hover": {
    backgroundColor: "#45a049",
  },
}));

export const AddItemButton = styled(Button)(({ theme }) => ({
  marginTop: 16,
  borderColor: "#d3d3d3",
  color: "#2e2d47",
}));

export const TableDeleteIcon = DeleteIcon;
export const TableAddIcon = AddIcon;
export const StyledAlert = styled(Alert)(({ theme }) => ({
  width: "100%",
}));

// Embedded billing dialog styles
export const billingDialogContainerSx = {
  p: 2,
  backgroundColor: "#f8f9fa",
  minHeight: "70vh",
  overflowY: "auto",
};

export const billingDialogHeaderSx = {
  display: "flex",
  alignItems: "center",
  gap: 1,
  mb: 2,
  px: 2,
  py: 1.5,
  borderRadius: 1,
  backgroundColor: "#590C16",
};

export const billingDialogHeaderIconSx = {
  fontSize: 26,
  color: "#ffffff",
};

export const billingDialogHeaderTitleSx = {
  fontWeight: 600,
  fontSize: "20px",
  color: "#ffffff",
};


