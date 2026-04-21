import React from "react";
import { styled } from "@mui/material/styles";
import { Table, TableCell, TableRow, Typography } from "@mui/material";
import { APP_COLORS } from "../../constants/colors";

export const StyledTable = styled(Table)(() => ({
  minWidth: 650,
  "& .MuiTableCell-root": {
    fontSize: "12px",
  },
}));

export const StyledTableCell = styled(TableCell)(() => ({
  backgroundColor: "#fafafa",
  fontWeight: 600,
  fontSize: "11px",
  color: APP_COLORS.themePrimary,
  padding: "8px 10px",
  borderBottom: "2px solid #e0e0e0",
  whiteSpace: "nowrap",
}));

interface TableHeaderCellProps {
  children?: React.ReactNode;
  align?: "left" | "center" | "right";
}

export const TableHeaderCell: React.FC<TableHeaderCellProps> = ({ children, align, ...props }) => {
  return (
    <StyledTableCell align={align} {...props}>
      {children}
    </StyledTableCell>
  );
};

export const TableDataRow = styled(TableRow)(() => ({
  "&:hover": {
    backgroundColor: "#f9f9f9",
  },
  "& td": {
    padding: "12px 10px",
    borderBottom: "1px solid #f0f0f0",
  },
}));

export const StyledTableCellData = styled(TableCell)(() => ({
  fontSize: "12px",
  padding: "12px 10px",
}));

export const StyledTableCellBold = styled(TableCell)(() => ({
  fontWeight: 500,
  fontSize: "12px",
  padding: "12px 10px",
}));

// Kept for future ActivityLog table needs (mirrors Users table utilities)
export const StyledTypographyCell = styled(Typography)(() => ({
  fontSize: "12px",
}));

