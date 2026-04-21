import React from 'react';
import {
  Box,
  TextField,
  Table,
  TableCell,
  TableRow,
  Dialog,
  DialogTitle,
  Button,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { APP_COLORS } from '../../constants/colors';

export const Container = styled(Box)(({ theme }) => ({
  marginLeft: '280px',
  padding: '24px',
  backgroundColor: '#ffffff',
  minHeight: 'calc(100vh - 70px)',
  width: 'calc(100% - 280px)',
  overflowY: 'auto',
  overflowX: 'hidden',
}));

export const HeaderSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '24px',
}));

export const SearchBar = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: '16px',
  alignItems: 'center',
}));

export const SearchField = styled(TextField)(({ theme }) => ({
  backgroundColor: 'white',
  width: '300px',
  '& .MuiOutlinedInput-root': {
    height: '40px',
    borderRadius: '5px',
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

// Note: TableContainer is used directly with sx prop in Inventory, so we'll use it the same way

export const StyledTable = styled(Table)(({ theme }) => ({
  minWidth: 650,
  '& .MuiTableCell-root': {
    fontSize: '12px',
  },
}));

export const StyledTableCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: '#fafafa',
  fontWeight: 600,
  fontSize: '11px',
  color: APP_COLORS.themePrimary,
  padding: '8px 10px',
  borderBottom: '2px solid #e0e0e0',
  whiteSpace: 'nowrap',
}));

interface TableHeaderCellProps {
  children?: React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

export const TableHeaderCell: React.FC<TableHeaderCellProps> = ({ children, align, ...props }) => {
  return (
    <StyledTableCell align={align} {...props}>
      {children}
    </StyledTableCell>
  );
};

export const TableDataRow = styled(TableRow)(({ theme }) => ({
  '&:hover': {
    backgroundColor: '#f9f9f9',
  },
  '& td': {
    padding: '12px 10px',
    borderBottom: '1px solid #f0f0f0',
  },
}));

export const StyledTableCellData = styled(TableCell)(({ theme }) => ({
  fontSize: '12px',
  padding: '12px 10px',
}));

export const StyledTableCellBold = styled(TableCell)(({ theme }) => ({
  fontWeight: 500,
  fontSize: '12px',
  padding: '12px 10px',
}));

export const StyledTypographyCell = styled(Typography)(({ theme }) => ({
  fontSize: '12px',
}));

export const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: '12px',
    padding: '8px',
    maxWidth: '600px',
    width: '100%',
  },
}));

export const DialogTitleStyled = styled(DialogTitle)(({ theme }) => ({
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

export const FormField = styled(TextField)(({ theme }) => ({
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

export const SaveButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#6b1010',
  color: '#ffffff',
  textTransform: 'none',
  fontSize: '14px',
  fontWeight: 500,
  padding: '8px 20px',
  borderRadius: '6px',
  height: '40px',
  transition: 'background-color 0.3s ease',
  '&:hover': {
    backgroundColor: '#8b1515',
  },
}));

export const CancelButton = styled(Button)(({ theme }) => ({
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

export const FormRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: '16px',
  width: '100%',
  '& > *': {
    flex: 1,
  },
}));

export const FormFieldContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
}));

export const FieldLabel = styled(Typography)(({ theme }) => ({
  fontSize: '14px',
  fontWeight: 500,
  color: '#424242',
  marginBottom: '4px',
}));

export const usersPageStyles = {
  titleTypography: {
    fontWeight: 600,
    fontSize: '20px',
    color: '#2c2c2c',
  },
  loadingBox: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "200px",
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
  snackbarSx: {
    mt: "50px",
  },
  dialogContentSx: {
    padding: '40px',
    textAlign: 'center',
  },
  warningIconBox: {
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
  dialogButtonSx: {
    minWidth: '120px',
  },
};

