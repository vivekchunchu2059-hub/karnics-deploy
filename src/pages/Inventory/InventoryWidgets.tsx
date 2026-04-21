import React from 'react';
import { Box, TextField, Table, TableCell, TableRow, IconButton, Dialog, DialogTitle, Select, Button, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { APP_COLORS } from '../../constants/colors';

const Container = styled(Box)(({ theme }) => ({
    marginLeft: 280,
    padding: '24px',
    backgroundColor: '#ffffff',
    minHeight: 'calc(100vh - 70px)',
    width: 'calc(100% - 280px)',
    overflowY: 'auto',
    overflowX: 'hidden',
}));

const HeaderSection = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
}));

const SearchBar = styled(Box)(({ theme }) => ({
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
}));

const SearchField = styled(TextField)(({ theme }) => ({
    backgroundColor: 'white',
    width: '300px',
    '& .MuiOutlinedInput-root': {
        height: '40px',
        borderRadius: '6px',
        '& fieldset': {
            borderColor: '#d3d3d3',
        },
        '&:hover fieldset': {
            borderColor: '#b0b0b0',
        },
        '&.Mui-focused fieldset': {
            borderColor: '#7c3aed',
            borderWidth: '1px',
        },
    },
    '& .MuiOutlinedInput-input': {
        fontSize: '14px',
        '&::placeholder': {
            color: '#9e9e9e',
            opacity: 1,
        },
    },
}));


const StyledTable = styled(Table)(({ theme }) => ({
    minWidth: 650,
    '& .MuiTableCell-root': {
        fontSize: '13px',
    },
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
    backgroundColor: '#fafafa',
    fontWeight: 600,
    fontSize: '12px',
    color: APP_COLORS.themePrimary,
    padding: '8px 10px',
    borderBottom: '2px solid #e0e0e0',
}));

interface TableHeaderCellProps {
    children?: React.ReactNode;
    align?: 'left' | 'center' | 'right';
}

const TableHeaderCell: React.FC<TableHeaderCellProps> = ({ children, align, ...props }) => {
    return (
        <StyledTableCell align={align} {...props}>
            {children}
        </StyledTableCell>
    );
};

const TableDataRow = styled(TableRow)(({ theme }) => ({
    '&:hover': {
        backgroundColor: '#f9f9f9',
    },
    '& td': {
        padding: '12px 16px',
        borderBottom: '1px solid #f0f0f0',
    },
}));

const ActionIcon = styled(IconButton)(({ theme }) => ({
    padding: '4px',
    marginRight: '4px',
    color: '#757575',
    '&:hover': {
        backgroundColor: '#f0f0f0',
        color: '#424242',
    },
}));

const StyledDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialog-paper': {
        borderRadius: '12px',
        padding: '8px',
        maxWidth: '600px',
        width: '100%',
    },
}));

const DialogTitleStyled = styled(DialogTitle)(({ theme }) => ({
    fontSize: '20px',
    fontWeight: 600,
    color: '#ffffff',
    backgroundColor: APP_COLORS.themeHeaderBg,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    '& .MuiIconButton-root': { color: 'rgba(255, 255, 255, 0.9)' },
    '& .MuiIconButton-root:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
}));

const FormField = styled(TextField)(({ theme }) => ({
    '& .MuiOutlinedInput-root': {
        borderRadius: '6px',
        '& fieldset': {
            borderColor: '#d3d3d3',
        },
    },
    '& .MuiInputLabel-root': {
        fontSize: '14px',
    },
}));

const FormSelect = styled(Select)(({ theme }) => ({
    borderRadius: '6px',
    '& .MuiOutlinedInput-notchedOutline': {
        borderColor: '#d3d3d3',
    },
}));

const SaveButton = styled(Button)(({ theme }) => ({
    backgroundColor: '#6b1010',
    color: '#ffffff',
    textTransform: 'none',
    fontSize: '14px',
    fontWeight: 500,
    padding: '10px 24px',
    borderRadius: '6px',
    transition: 'background-color 0.3s ease',
    '&:hover': {
        backgroundColor: '#8b1515',
    },
}));

const CancelButton = styled(Button)(({ theme }) => ({
    backgroundColor: '#e0e0e0',
    color: '#424242',
    textTransform: 'none',
    fontSize: '14px',
    fontWeight: 500,
    padding: '10px 24px',
    borderRadius: '6px',
    '&:hover': {
        backgroundColor: '#bdbdbd',
    },
}));

export {
    Container,
    HeaderSection,
    SearchBar,
    SearchField,
    StyledTable,
    TableHeaderCell,
    TableDataRow,
    ActionIcon,
    StyledDialog,
    DialogTitleStyled,
    FormField,
    FormSelect,
    SaveButton,
    CancelButton,
};

export type { TableHeaderCellProps };

export type InventoryStatus =
  | 'In-Stock'
  | 'Low Stock'
  | 'Out of Stock'
  | string;

export const getStatusColors = (status: InventoryStatus) => {
  switch (status) {
    case 'In-Stock':
    case 'In Stock':
      return {
        textColor: '#1B5E20',
        bgColor: '#C8E6C9',
      };
    case 'Low Stock':
      return {
        textColor: '#F9A825',
        bgColor: '#FFF9C4',
      };
    case 'Out of Stock':
      return {
        textColor: '#B71C1C',
        bgColor: '#FFCDD2',
      };
    default:
      return {
        textColor: '#424242',
        bgColor: '#EEEEEE',
      };
  }
};

// Category Product Table Styled Components
export const CategoryTableContainer = styled(Box)(({ theme }) => ({
  padding: '16px 32px',
  backgroundColor: 'transparent',
}));

export const CategoryTableScrollContainer = styled(Box)<{ shouldScroll?: boolean }>(({ shouldScroll }) => ({
  maxHeight: '600px',
  overflowY: 'auto',
  overflowX: 'auto',
  border: '1px solid #e0e0e0',
  borderRadius: '8px',
  boxShadow: 'none',
  '&::-webkit-scrollbar': {
    width: '8px',
    height: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: '#f5f5f5',
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#bdbdbd',
    borderRadius: '10px',
    '&:hover': {
      background: '#9e9e9e',
    },
  },
  scrollbarWidth: 'thin',
  scrollbarColor: '#bdbdbd #f5f5f5',
}));

export const CategoryTable = styled(Table)(({ theme }) => ({
  '& .MuiTableCell-root': {
    fontSize: '12px',
  },
}));

export const CategoryProductHeaderCell = styled(TableCell)(() => ({
  backgroundColor: '#fafafa',
  fontWeight: 600,
  fontSize: '12px',
  color: '#424242',
  padding: '8px 10px',
  borderBottom: '2px solid #e0e0e0',
  whiteSpace: 'nowrap',
}));

export const CategoryImageCell = styled(TableCell)(() => ({
  verticalAlign: 'middle',
  paddingRight: '8px',
  paddingLeft: '8px',
  width: '48px',
  fontSize: '12px',
}));

export const CategoryBodyCell = styled(TableCell)(() => ({
  fontSize: '12px',
  padding: '10px 8px',
  borderBottom: '1px solid #f0f0f0',
}));

export const CategoryIconWrapper = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4px',
}));

export const CategoryIconButton = styled(IconButton)(() => ({
  '& .MuiSvgIcon-root': {
    fontSize: '16px',
  },
}));

export const CategoryEmptyStateBox = styled(Box)(() => ({
  padding: '16px 32px',
  backgroundColor: '#FFF9E6',
}));

export const CategoryEmptyStateText = styled(Typography)(() => ({
  fontSize: '12px',
  color: '#424242',
}));

/**
 * Styling constants for Inventory page
 */
export const inventoryPageStyles = {
  titleTypography: {
    fontWeight: 600,
    fontSize: '24px',
    color: '#2c2c2c',
    letterSpacing: '0.5px',
  },
  tableContainer: {
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  loadingTableCell: {
    py: 4,
  },
  loadingTypography: {
    color: '#9e9e9e',
    fontSize: '14px',
    mt: 2,
  },
  categoryTableCell: {
    fontWeight: 500,
  },
  deleteIcon: {
    color: '#9e9e9e',
  },
  expandedCategoryTableCell: {
    p: 0,
  },
  emptyStateTableCell: {
    py: 4,
  },
  emptyStateTypography: {
    color: '#9e9e9e',
    fontSize: '14px',
  },
  paginationContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    mt: 3,
    gap: 2,
  },
  paginationTypography: {
    fontSize: '14px',
    color: '#757575',
  },
  paginationSx: {
    '& .MuiPaginationItem-root': {
      fontSize: '14px',
      minWidth: '32px',
      height: '32px',
      margin: '0 2px',
      border: '1px solid #d3d3d3',
      borderRadius: '4px',
      color: '#424242',
      '&:hover': {
        backgroundColor: '#f5f5f5',
      },
      '&.Mui-selected': {
        backgroundColor: '#6b1010',
        color: '#ffffff',
        borderColor: '#2c2c2c',
        '&:hover': {
          backgroundColor: '#8b1515',
        },
      },
    },
    '& .MuiPaginationItem-previousNext': {
      fontSize: '16px',
    },
  },
  dialogContentSx: {
    padding: '40px',
    textAlign: 'center',
  },
  deleteIconContainer: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#ffebee',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
  },
  deleteIconSx: {
    fontSize: 30,
    color: '#c62828',
  },
  dialogTitleTypography: {
    fontWeight: 600,
    fontSize: '18px',
    color: '#2c2c2c',
    marginBottom: '8px',
  },
  dialogBodyTypography: {
    fontSize: '14px',
    color: '#757575',
  },
  dialogActionsSx: {
    padding: '0 40px 40px',
    justifyContent: 'center',
    gap: 2,
  },
  cancelButtonSx: {
    minWidth: '120px',
    backgroundColor: '#f5f5f5',
    color: '#424242',
    '&:hover': {
      backgroundColor: '#e0e0e0',
    },
  },
  deleteButtonSx: {
    minWidth: '120px',
    backgroundColor: 'rgba(89, 12, 22, 1)',
    '&:hover': {
      backgroundColor: 'rgba(89, 12, 22, 0.9)',
    },
  },
  warningIconContainer: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#fff3e0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
  },
  warningIconSx: {
    fontSize: 30,
    color: '#f57c00',
  },
  dialogActionsCentered: {
    padding: '0 40px 40px',
    justifyContent: 'center',
  },
  dialogButtonSx: {
    minWidth: '120px',
  },
  successIconContainer: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#c8e6c9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
  },
  checkmarkIcon: {
    width: '24px',
    height: '12px',
    borderLeft: '3px solid #2e7d32',
    borderBottom: '3px solid #2e7d32',
    transform: 'rotate(-45deg)',
  },
};
