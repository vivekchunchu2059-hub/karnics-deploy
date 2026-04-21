import {Box, Table, TableCell, TableRow, IconButton, TextField} from '@mui/material';
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
}));

export const TabsContainer = styled(Box)(({ theme }) => ({
  marginBottom: '0',
}));

export const SearchField = styled(TextField)(({ theme }) => ({
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
  color: '#424242',
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

export const ExpandedRowContainer = styled(Box)(({ theme }) => ({
  padding: '24px 40px',
  backgroundColor: '#ffffff',
  width: '100%',
}));

export const InstallmentDetailsCard = styled(Box)(({ theme }) => ({
  backgroundColor: 'transparent',
  borderRadius: '0',
  padding: '0',
  border: 'none',
  boxShadow: 'none',
}));

export const InstallmentTable = styled(Table)(({ theme }) => ({
  border: '1px solid #e0e0e0',
  borderRadius: '4px',
  overflow: 'hidden',
  '& .MuiTableCell-root': {
    fontSize: '13px',
    borderLeft: '1px solid #e0e0e0',
    borderRight: '1px solid #e0e0e0',
    '&:first-of-type': {
      borderLeft: 'none',
    },
    '&:last-of-type': {
      borderRight: 'none',
    },
  },
}));

export const InstallmentHeaderCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: '#f5f5f5',
  fontWeight: 600,
  fontSize: '13px',
  color: APP_COLORS.themePrimary,
  padding: '10px 12px',
  borderTop: '1px solid #e0e0e0',
  borderBottom: '1px solid #e0e0e0',
  borderLeft: '1px solid #e0e0e0',
  borderRight: '1px solid #e0e0e0',
  textAlign: 'left',
}));

export const InstallmentRow = styled(TableRow)(({ theme }) => ({
  '&:hover': {
    backgroundColor: '#fafafa',
  },
}));

export const AddInstallmentButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: '#4caf50',
  color: '#ffffff',
  width: '32px',
  height: '32px',
  borderRadius: '4px',
  padding: '6px',
  '&:hover': {
    backgroundColor: '#45a049',
  },
}));

export const SaveInvoiceButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: '#1976d2',
  color: '#ffffff',
  width: '32px',
  height: '32px',
  borderRadius: '4px',
  padding: '6px',
  '&:hover': {
    backgroundColor: '#1565c0',
  },
}));

// CustomerDetailsTab styles
export const customerTruncateStyle = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap' as const,
};

export const customerEmptyContainerSx = {
  border: '1px solid #e0e0e0',
  borderTop: 'none',
  borderRadius: '0 0 8px 8px',
  overflow: 'hidden',
};

export const customerPaginationContainerSx = {
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  gap: 2,
  mt: 3,
};

export const customerPaginationTypographySx = {
  fontSize: '13px',
  color: '#666',
};

export const customerPaginationSx = {
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
};

export const customerDeleteDialogContentSx = {
  padding: '40px',
  textAlign: 'center' as const,
};

export const customerDeleteIconContainerSx = {
  width: '60px',
  height: '60px',
  borderRadius: '50%',
  backgroundColor: '#ffebee',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 20px',
};

export const customerDeleteTitleTypographySx = {
  fontWeight: 600,
  fontSize: '18px',
  color: '#2c2c2c',
  marginBottom: '8px',
};

export const customerDeleteBodyTypographySx = {
  fontSize: '14px',
  color: '#757575',
};

export const customerDeleteDialogActionsSx = {
  padding: '0 40px 40px',
  justifyContent: 'center',
  gap: 2,
};

export const customerDeleteCancelButtonSx = {
  minWidth: '120px',
  backgroundColor: '#f5f5f5',
  color: '#424242',
  '&:hover': {
    backgroundColor: '#e0e0e0',
  },
};

export const customerDeleteConfirmButtonSx = {
  minWidth: '120px',
  backgroundColor: 'rgba(89, 12, 22, 1)',
  '&:hover': {
    backgroundColor: 'rgba(89, 12, 22, 0.9)',
  },
};

// Customer edit dialog styles
export const customerEditFormContainerSx = {
  p: 2.5,
};

export const customerEditFieldsContainerSx = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2.5,
};

export const customerEditActionsRowSx = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 1.5,
  mt: 3,
};

// Customer edit success dialog styles
export const customerSuccessDialogContentSx = {
  padding: '40px',
  textAlign: 'center' as const,
};

export const customerSuccessIconContainerSx = {
  width: 60,
  height: 60,
  borderRadius: '50%',
  backgroundColor: '#c8e6c9',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 20px',
};

export const customerSuccessCheckIconSx = {
  width: 24,
  height: 12,
  borderLeft: '3px solid #2e7d32',
  borderBottom: '3px solid #2e7d32',
  transform: 'rotate(-45deg)',
};

export const customerSuccessTitleTypographySx = {
  fontWeight: 600,
  fontSize: '18px',
  color: '#2c2c2c',
  marginBottom: '8px',
};

export const customerSuccessBodyTypographySx = {
  fontSize: '14px',
  color: '#757575',
};

export const customerSuccessDialogActionsSx = {
  padding: '0 40px 40px',
  justifyContent: 'center',
};

export const customerSuccessOkButtonSx = {
  minWidth: '120px',
};