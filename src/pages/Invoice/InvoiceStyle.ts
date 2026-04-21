import {
  Box,
  Button,
  Table,
  TableCell,
  TableRow,
  TextField,
  IconButton,
  Dialog,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { APP_COLORS } from '../../constants/colors';

export const Container = styled(Box)(({ theme }) => ({
  marginLeft: 280,
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
  marginTop: '20px',
  width: '50%',
}));

export const DateField = styled(TextField)(({ theme }) => ({
  backgroundColor: 'white',
  width: '160px',
  flexShrink: 0,
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
  '& .MuiInputLabel-root': {
    fontSize: '14px',
  }
}));

/** Same visual style as `NewInvoiceButton` in BillingPage/components/BillingStyles.tsx */
export const AddInvoiceButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#6b1010',
  color: '#ffffff',
  textTransform: 'none',
  fontSize: '14px',
  fontWeight: 500,
  padding: '8px 24px',
  borderRadius: '6px',
  transition: 'background-color 0.3s ease',
  flexShrink: 0,
  '&:hover': {
    backgroundColor: '#8b1515',
  },
}));

export const SearchField = styled(TextField)(({ theme }) => ({
  flex: '1 1 auto',
  minWidth: 0,
  maxWidth: '450px',
  backgroundColor: 'white',
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
      borderColor: APP_COLORS.gold,
      borderWidth: '1px',
    },
  },
  '& .MuiOutlinedInput-input': {
    padding: '10px 14px',
    fontSize: '14px',
    '&::placeholder': {
      color: '#9e9e9e',
      opacity: 1,
    },
  },
}));

export const StyledTable = styled(Table)(({ theme }) => ({
  minWidth: 650,
  width: '100%',
  tableLayout: 'auto',
  '& .MuiTableCell-root': {
    fontSize: '13px',
    boxSizing: 'border-box',
  },
}));

export const TableHeaderCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: '#fafafa',
  fontWeight: 600,
  fontSize: '13px',
  color: APP_COLORS.themePrimary,
  padding: '14px 16px',
  borderBottom: '2px solid #e0e0e0',
}));

export const TableDataRow = styled(TableRow)(({ theme }) => ({
  '&:hover': {
    backgroundColor: '#f9f9f9',
  },
  '& td': {
    padding: '12px 16px',
    borderBottom: '1px solid #f0f0f0',
  },
}));

export const ActionIcon = styled(IconButton)(({ theme }) => ({
  padding: '4px',
  marginRight: '4px',
  color: '#757575',
  '&:hover': {
    backgroundColor: '#f0f0f0',
    color: '#424242',
  },
}));

export const TotalAmount = styled(TableCell)(({ theme }) => ({
  color: '#4caf50',
  fontWeight: 500,
}));

export const PriceCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 500,
}));

export const PrintDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    maxWidth: '900px',
    width: '100%',
    borderRadius: 0,
  },
}));

export const InvoiceHeader = styled(Box)(({ theme }) => ({
  backgroundColor: '#2e2d47',
  color: '#ffffff',
  padding: '24px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
}));

export const InvoiceContent = styled(Box)(({ theme }) => ({
  padding: '32px',
  backgroundColor: '#ffffff',
}));

export const InvoiceTable = styled(Table)(({ theme }) => ({
  marginTop: '24px',
  '& .MuiTableCell-head': {
    backgroundColor: '#fff3e0',
    fontWeight: 600,
    fontSize: '13px',
    padding: '12px',
  },
  '& .MuiTableCell-body': {
    fontSize: '13px',
    padding: '12px',
  },
}));

