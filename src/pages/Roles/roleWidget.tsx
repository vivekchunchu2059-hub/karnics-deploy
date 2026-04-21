import { styled } from "@mui/material/styles";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Checkbox,
  FormControlLabel,
  Alert,
  Table,
  TableCell,
  TableRow,
} from "@mui/material";
import { APP_COLORS } from "../../constants/colors";
import { Delete as DeleteIcon } from "@mui/icons-material";

// Container and Layout
export const PageContainer = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
}));

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
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  [theme.breakpoints.up('md')]: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  justifyContent: 'space-between',
  gap: 16,
  marginBottom: 8,
}));

export const HeaderTitle = styled(Box)(() => ({
  fontSize: '24px',
  fontWeight: 600,
  marginBottom: 4,
  lineHeight: 1.2,
}));

export const HeaderSubtitle = styled(Box)(() => ({
  fontSize: '13px',
  color: '#757575',
  margin: 0,
}));

// Search and Actions
export const SearchContainer = styled(Box)(() => ({
  display: 'flex',
  gap: 16,
  alignItems: 'center',
  marginBottom: 16,
}));

export const SearchFieldWrapper = styled(Box)(() => ({
  maxWidth: '400px',
  flex: 1,
}));

export const NewRoleButton = styled(Button)<{ isSuperAdmin?: boolean }>(({ isSuperAdmin }) => ({
  textTransform: 'none',
  backgroundColor: isSuperAdmin ? 'rgba(89, 12, 22, 1)' : '#cccccc',
  color: '#ffffff',
  '&:disabled': {
    backgroundColor: '#cccccc',
    color: '#666666',
  },
}));

export const AddRoleButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#2e2d47',
  color: '#ffffff',
  textTransform: 'none',
  fontSize: '14px',
  fontWeight: 500,
  padding: '8px 20px',
  borderRadius: '6px',
  height: '40px',
  '&:hover': {
    backgroundColor: '#3a3855',
  },
}));

// Loading and Grid
export const LoadingContainer = styled(Box)(() => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '200px',
}));

export const RolesGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: 16,
  [theme.breakpoints.up('sm')]: {
    gridTemplateColumns: 'repeat(2, 1fr)',
  },
}));

// Role Card
export const RoleCard = styled(Card)(() => ({
  borderRadius: '8px',
  border: '1px solid rgba(89, 12, 22, 1)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  transition: 'box-shadow 0.2s',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  '&:hover': {
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
}));

export const RoleCardContent = styled(CardContent)(() => ({
  padding: 16,
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
}));

export const RoleCardHeader = styled(Box)(() => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 12,
}));

export const RoleCardTitleSection = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 8,
  flex: 1,
}));

export const RoleTitleBox = styled(Box)(() => ({
  flex: 1,
}));

export const RoleTitle = styled(Box)(() => ({
  fontSize: '16px',
  fontWeight: 500,
  margin: 0,
  marginBottom: 4,
  lineHeight: 1.3,
}));

export const StatusChip = styled(Chip)<{ status?: string }>(({ status }) => ({
  backgroundColor: status === "ACTIVE" ? '#e3f2fd' : '#f5f5f5',
  color: status === "ACTIVE" ? '#1976d2' : '#757575',
  fontSize: '11px',
  height: '20px',
  fontWeight: 500,
  '& .MuiChip-label': {
    padding: '0 8px',
  },
}));

export const RoleDescription = styled(Box)(() => ({
  fontSize: '13px',
  color: '#757575',
  marginBottom: 12,
  margin: 0,
  lineHeight: 1.4,
}));

export const PermissionsChipContainer = styled(Box)(() => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
  marginBottom: 12,
}));

export const PermissionChip = styled(Chip)(() => ({
  fontSize: '11px',
  height: '22px',
  '& .MuiChip-label': {
    padding: '0 6px',
  },
}));

export const RoleCardFooter = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingTop: 12,
  borderTop: '1px solid #e0e0e0',
  marginTop: 'auto',
}));

export const UserCountBox = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  fontSize: '13px',
  color: '#757575',
}));

export const ActionButtonsBox = styled(Box)(() => ({
  display: 'flex',
  gap: 6,
}));

export const EditButton = styled(Button)<{ isSuperAdmin?: boolean }>(({ isSuperAdmin }) => ({
  fontSize: '12px',
  padding: '4px 12px',
  minWidth: 'auto',
  textTransform: 'none',
  opacity: isSuperAdmin ? 1 : 0.5,
  cursor: isSuperAdmin ? 'pointer' : 'not-allowed',
}));

export const DeleteButton = styled(Button)<{ isSuperAdmin?: boolean }>(({ isSuperAdmin }) => ({
  fontSize: '12px',
  padding: '4px 12px',
  minWidth: 'auto',
  textTransform: 'none',
  opacity: isSuperAdmin ? 1 : 0.5,
  cursor: isSuperAdmin ? 'pointer' : 'not-allowed',
}));

export const DeleteConfirmButton = styled(Button)(() => ({
  textTransform: 'none',
  fontSize: '14px',
  fontWeight: 500,
  padding: '10px 24px',
  borderRadius: '6px',
}));

// Dialog Components
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
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px 24px',
  backgroundColor: APP_COLORS.themeHeaderBg,
}));

export const DialogCloseIcon = styled(IconButton)(() => ({
  color: 'rgba(255, 255, 255, 0.9)',
  padding: '4px',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
}));

export const DialogContentStyled = styled(DialogContent)(() => ({
  padding: '24px',
}));

export const DialogActionsStyled = styled(DialogActions)(() => ({
  padding: '16px 24px',
}));

export const DialogActionsCentered = styled(DialogActions)(() => ({
  padding: '0 40px 40px',
  justifyContent: 'center',
}));

export const DialogContentCentered = styled(DialogContent)(() => ({
  padding: '40px',
  textAlign: 'center',
}));

// Form Components
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

export const FormSection = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
}));

export const FormFieldWrapper = styled(Box)(() => ({}));

export const FormLabel = styled(Typography)(() => ({
  fontSize: '14px',
  fontWeight: 500,
  color: '#424242',
  marginBottom: '8px',
}));

export const FormNote = styled(Typography)(() => ({
  fontSize: '12px',
  color: '#757575',
  marginTop: 4,
}));

export const StatusCheckboxContainer = styled(Box)(() => ({
  display: 'flex',
  gap: 16,
}));

export const CheckboxStyled = styled(Checkbox)(() => ({
  color: 'rgba(89, 12, 22, 1)',
  '&.Mui-checked': {
    color: 'rgba(89, 12, 22, 1)',
  },
}));

export const FormControlLabelStyled = styled(FormControlLabel)(() => ({
  fontSize: '14px',
  '& .MuiFormControlLabel-label': {
    fontSize: '14px',
  },
}));

export const PermissionsGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '12px',
  marginTop: '16px',
}));

// Buttons
export const SaveButton = styled(Button)(({ theme }) => ({
  backgroundColor: 'rgba(89, 12, 22, 1)',
  color: '#ffffff',
  textTransform: 'none',
  fontSize: '14px',
  fontWeight: 500,
  padding: '10px 24px',
  borderRadius: '6px',
  '&:hover': {
    backgroundColor: 'rgba(89, 12, 22, 0.9)',
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

// Alert Components
export const AlertStyled = styled(Alert)(() => ({
  marginBottom: 16,
}));

export const AlertWarning = styled(Alert)(() => ({
  marginBottom: 16,
}));

// Icon Styling
export const SearchIconStyled = styled(Box)(() => ({
  fontSize: 20,
  color: '#9e9e9e',
}));

export const ShieldIconStyled = styled(Box)(() => ({
  color: 'rgba(89, 12, 22, 1)',
  fontSize: 18,
  marginTop: 4,
}));

export const SettingsIconStyled = styled(Box)(() => ({
  fontSize: 16,
}));

export const UsersIconStyled = styled(Box)(() => ({
  fontSize: 14,
}));

export const IconButtonStyled = styled(IconButton)(() => ({
  color: '#9e9e9e',
  padding: 4,
  marginLeft: 8,
}));

// Typography
export const DeleteConfirmText = styled(Typography)(() => ({
  fontSize: '14px',
  color: '#424242',
}));

// Delete Confirmation Dialog (Roles)
export const DeleteRoleDialogContentStyled = styled(DialogContent)(() => ({
  padding: '40px',
  textAlign: 'center',
}));

export const DeleteRoleIconContainer = styled(Box)(() => ({
  width: '60px',
  height: '60px',
  borderRadius: '50%',
  backgroundColor: '#ffebee',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 20px',
}));

export const DeleteRoleConfirmIcon = styled(DeleteIcon)(() => ({
  fontSize: 30,
  color: '#c62828',
}));

export const DeleteRoleConfirmTitle = styled(Typography)(() => ({
  fontWeight: 600,
  fontSize: '18px',
  color: '#2c2c2c',
  marginBottom: '8px',
}));

export const DeleteRoleConfirmBody = styled(Typography)(() => ({
  fontSize: '14px',
  color: '#757575',
}));

export const DeleteRoleDialogActionsStyled = styled(DialogActions)(() => ({
  padding: '0 40px 40px',
  justifyContent: 'center',
  gap: 2,
}));

export const DeleteRoleCancelButton = styled(CancelButton)(() => ({
  minWidth: '120px',
  backgroundColor: '#f5f5f5',
  color: '#424242',
  '&:hover': {
    backgroundColor: '#e0e0e0',
  },
}));

export const DeleteRoleDeleteButton = styled(DeleteConfirmButton)(() => ({
  minWidth: '120px',
  backgroundColor: 'rgba(89, 12, 22, 1)',
  color: '#ffffff',
  '&:hover': {
    backgroundColor: 'rgba(89, 12, 22, 0.9)',
  },
}));

// Button Overrides
export const SaveButtonWithMinWidth = styled(SaveButton)(() => ({
  minWidth: '120px',
}));

// Success Dialog
export const SuccessIconContainer = styled(Box)(() => ({
  width: '60px',
  height: '60px',
  borderRadius: '50%',
  backgroundColor: '#c8e6c9',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 20px',
}));

export const SuccessIcon = styled(Box)(() => ({
  width: '24px',
  height: '12px',
  borderLeft: '3px solid #2e7d32',
  borderBottom: '3px solid #2e7d32',
  transform: 'rotate(-45deg)',
}));

export const SuccessTitle = styled(Typography)(() => ({
  fontWeight: 600,
  fontSize: '18px',
  color: '#2c2c2c',
  marginBottom: '8px',
}));

export const SuccessMessage = styled(Typography)(() => ({
  fontSize: '14px',
  color: '#757575',
}));

// Table Components (from RoleStyled.ts)
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

