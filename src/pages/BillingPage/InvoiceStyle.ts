import { Box, Button, Table } from "@mui/material";
import { styled } from "@mui/material/styles";

export const InvoiceHeader = styled(Box)(({ theme }) => ({
  backgroundColor: "#2e2d47",
  color: "#ffffff",
  padding: "24px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
}));

export const InvoiceContent = styled(Box)(({ theme }) => ({
  padding: "32px",
  backgroundColor: "#ffffff",
}));

export const InvoiceTable = styled(Table)(({ theme }) => ({
  marginTop: "24px",
  "& .MuiTableCell-head": {
    backgroundColor: "#fff3e0",
    fontWeight: 600,
    fontSize: "13px",
    padding: "12px",
  },
  "& .MuiTableCell-body": {
    fontSize: "13px",
    padding: "12px",
  },
}));

export const TotalRow = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "8px",
  fontSize: "14px",
}));

export const PrintButton = styled(Button)(({ theme }) => ({
  backgroundColor: "rgba(89, 12, 22, 1)",
  color: "#fff",
  borderRadius: 6,
  padding: "10px 24px",
  fontWeight: 600,
  fontSize: "0.875rem",
  textTransform: "none",
  boxShadow: "0 2px 8px rgba(46, 45, 71, 0.25)",
  "&:hover": {
    backgroundColor: "#3d3b5c",
    boxShadow: "0 4px 12px rgba(46, 45, 71, 0.3)",
  },
}));

export const CancelButton = styled(Button)(({ theme }) => ({
  backgroundColor: "#f1f5f9",
  color: "#475569",
  borderRadius: 6,
  padding: "10px 24px",
  fontWeight: 600,
  fontSize: "0.875rem",
  textTransform: "none",
  border: "1px solid #e2e8f0",
  "&:hover": {
    backgroundColor: "#e2e8f0",
  },
}));

