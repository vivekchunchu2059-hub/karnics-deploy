import {
  Dialog,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Avatar,
  Snackbar,
  Alert,
  styled,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

export const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: '8px',
    maxWidth: '1100px',
    width: '90%',
    maxHeight: '90vh',
    height: '90vh',
    margin: '5vh auto',
    padding: 0,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    minHeight: 0,
  },
  '& .MuiDialog-paper > *': {
    minHeight: 0,
  },
}));

export const DialogHeader = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '20px 28px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
  backgroundColor: 'rgba(89, 12, 22, 1)',
  flexShrink: 0,
  '& .MuiTypography-root': { color: '#ffffff' },
  '& .MuiIconButton-root': { color: 'rgba(255, 255, 255, 0.9)' },
  '& .MuiIconButton-root:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
});

export const DialogContent = styled(Box)({
  display: 'flex',
  alignItems: 'flex-start',
  padding: '24px 32px 32px',
  gap: '40px',
  overflow: 'hidden',
  flex: '1 1 auto',
  minHeight: 0,
});

export const LeftSection = styled(Box)({
  flex: '1 1 60%',
  minWidth: 0,
  minHeight: 0,
  maxHeight: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  overflowY: 'auto',
  overflowX: 'hidden',
  WebkitOverflowScrolling: 'touch',
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
  '&::-webkit-scrollbar': {
    display: 'none',
  },
});

export const RightSection = styled(Box)({
  flex: '0 0 auto',
  width: '40%',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
  paddingLeft: '40px',
  borderLeft: '1px solid #e0e0e0',
});

export const FormRow = styled(Box)({
  display: 'flex',
  gap: '16px',
  width: '100%',
});

export const FormField = styled(Box)({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
});

export const FieldLabel = styled(Typography)({
  fontSize: '14px',
  fontWeight: 500,
  color: '#212121',
  marginBottom: '4px',
});

export const StyledTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    '& fieldset': {
      borderColor: '#e0e0e0',
    },
    '&:hover fieldset': {
      borderColor: '#bdbdbd',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#5B1A47',
      borderWidth: '2px',
    },
  },
  '& .MuiOutlinedInput-input': {
    padding: '12px 14px',
    fontSize: '14px',
    color: '#424242',
    '&::placeholder': {
      color: '#bdbdbd',
      opacity: 1,
    },
  },
});

export const ImageUploadSection = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '12px',
});

export const SectionTitle = styled(Typography)({
  fontSize: '16px',
  fontWeight: 600,
  color: '#212121',
  marginBottom: '4px',
  textAlign: 'center',
});

export const AvatarContainer = styled(Box)({
  position: 'relative',
  width: '110px',
  height: '110px',
});

export const StyledAvatar = styled(Avatar)({
  width: '110px',
  height: '110px',
  border: '3px solid #f5f5f5',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
});

export const EditIconButton = styled(IconButton)({
  position: 'absolute',
  bottom: '0',
  right: '0',
  backgroundColor: '#4caf50',
  width: '36px',
  height: '36px',
  border: '3px solid #ffffff',
  '&:hover': {
    backgroundColor: '#45a049',
  },
});

export const LogoContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '12px',
  marginTop: '4px',
});

export const LogoImage = styled('img')({
  width: '160px',
  height: 'auto',
  maxHeight: '70px',
  objectFit: 'contain',
});

export const BrowseButton = styled(Button)({
  textTransform: 'none',
  fontSize: '12px',
  fontWeight: 400,
  color: '#757575',
  backgroundColor: '#f5f5f5',
  padding: '8px 16px',
  borderRadius: '4px',
  border: '1px solid #e0e0e0',
  minWidth: '80px',
  '&:hover': {
    backgroundColor: '#eeeeee',
    borderColor: '#bdbdbd',
  },
});

export const UploadProfileImageButton = styled(Button)({
  textTransform: 'none',
  fontSize: '13px',
  fontWeight: 500,
  color: '#5B1A47',
  backgroundColor: '#f5f5f5',
  padding: '8px 20px',
  borderRadius: '6px',
  border: '1px solid #e0e0e0',
  marginTop: '8px',
  '&:hover': {
    backgroundColor: '#ede7ec',
    borderColor: '#5B1A47',
  },
});

export const UploadLogoButton = styled(Button)({
  textTransform: 'none',
  fontSize: '13px',
  fontWeight: 500,
  color: '#ffffff',
  backgroundColor: '#5B1A47',
  padding: '8px 20px',
  borderRadius: '6px',
  marginTop: '8px',
  width: '100%',
  '&:hover': {
    backgroundColor: '#4a1539',
  },
});

export const FileInputContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  width: '100%',
});

export const DialogFooter = styled(Box)({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '12px',
  padding: '16px 32px',
  borderTop: '1px solid #e0e0e0',
  flexShrink: 0,
  backgroundColor: '#fff',
});

export const SaveButton = styled(Button)({
  textTransform: 'none',
  fontSize: '14px',
  fontWeight: 500,
  color: '#ffffff',
  backgroundColor: '#5B1A47',
  padding: '10px 32px',
  borderRadius: '6px',
  minWidth: '120px',
  '&:hover': {
    backgroundColor: '#4a1539',
  },
});

export const CancelButton = styled(Button)({
  textTransform: 'none',
  fontSize: '14px',
  fontWeight: 500,
  color: '#757575',
  backgroundColor: '#f5f5f5',
  padding: '10px 32px',
  borderRadius: '6px',
  minWidth: '120px',
  border: '1px solid #e0e0e0',
  '&:hover': {
    backgroundColor: '#eeeeee',
  },
});

export const SubmitButton = SaveButton;

export const StyledSnackbar = styled(Snackbar)({
  marginTop: '64px',
});

export const StyledAlert = styled(Alert)({
  width: '100%',
  minWidth: '350px',
  backgroundColor: '#4caf50',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 500,
  boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)',
  '& .MuiAlert-icon': {
    color: '#ffffff',
  },
});

// Header styled components
export const HeaderContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
});

export const DialogTitle = styled(Typography)({
  fontSize: '18px',
  fontWeight: 600,
  color: '#ffffff',
});

export const HeaderRightSection = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
});

export const UserRoleBlock = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: '2px',
});

export const UsernameText = styled(Typography)({
  fontSize: '14px',
  fontWeight: 600,
  color: 'rgba(255,255,255,0.95)',
});

export const RoleText = styled(Typography)({
  fontSize: '13px',
  fontWeight: 600,
  color: '#444',
});

export const CustomerIdBox = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: 500,
});

export const CustomerIdLabel = styled(Typography)({
  fontSize: '12px',
  fontWeight: 500,
  color: '#9e9e9e',
});

export const CustomerIdValue = styled(Typography)({
  fontSize: '13px',
  fontWeight: 600,
  color: '#424242',
});

export const CloseButton = styled(IconButton)({
  color: '#9e9e9e',
  '&:hover': {
    backgroundColor: '#f5f5f5',
    color: '#757575',
  },
});

// Avatar with dynamic background color
export interface StyledAvatarWithPropsProps {
  hasImage?: boolean;
}

export const StyledAvatarWithProps = styled(Avatar)<StyledAvatarWithPropsProps>(({ hasImage }) => ({
  width: '110px',
  height: '110px',
  border: '3px solid #f5f5f5',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  backgroundColor: hasImage ? 'transparent' : '#e3f2fd',
  fontSize: '40px',
  fontWeight: 600,
  color: '#1976d2',
}));

export const StyledEditIcon = styled(EditIcon)({
  fontSize: '18px',
  color: '#ffffff',
});

export const HiddenInput = styled('input')({
  display: 'none',
});

// Logo upload section
export const LogoUploadContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '10px',
  width: '100%',
  paddingLeft: '16px',
  paddingRight: '16px',
});

export const UploadText = styled(Typography)({
  fontSize: '13px',
  color: '#757575',
  fontWeight: 400,
});

export const LogoFileNameInput = styled(StyledTextField)({
  '& .MuiOutlinedInput-input': {
    padding: '8px 12px',
    fontSize: '13px',
  },
});