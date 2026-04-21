import {
  Box,
  Table,
  TableCell,
  TableRow,
  TextField,
  Select,
  IconButton,
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

export const FilterBar = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: '12px',
  alignItems: 'center',
}));

export const StyledSelect = styled(Select)(({ theme }) => ({
  backgroundColor: 'white',
  height: '40px',
  minWidth: '120px',
  borderRadius: '6px',
  fontSize: '14px',
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: '#d3d3d3',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: '#b0b0b0',
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: '#7c3aed',
    borderWidth: '1px',
  },
}));

export const FilterField = styled(TextField)(({ theme }) => ({
  backgroundColor: 'white',
  width: '140px',
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
  },
}));

export const StyledTable = styled(Table)(({ theme }) => ({
  minWidth: 650,
  '& .MuiTableCell-root': {
    fontSize: '13px',
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

export const ExpandIconButton = styled(IconButton)(({ theme }) => ({
  padding: '2px',
  color: '#424242',
}));

export const TotalAmountCell = styled(TableCell)(({ theme }) => ({
  color: '#4caf50',
  fontWeight: 500,
}));

