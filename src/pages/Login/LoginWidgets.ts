import { Box, TextField, Button, Typography, styled, IconButton } from '@mui/material';

export const LoginContainer = styled(Box)(({ theme }) => ({
  height: '100vh',
  minHeight: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  position: 'relative',
  overflow: 'hidden',
  padding: '40px 80px 40px 40px',
  boxSizing: 'border-box',
  '@media (max-width: 1200px)': {
    justifyContent: 'center',
    padding: '40px',
  },
  '@media (max-width: 768px)': {
    padding: '20px',
  },
}));

export const BackgroundImage = styled('div')<{ isActive: boolean }>(({ isActive }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  opacity: isActive ? 1 : 0,
  transition: 'opacity 1s ease-in-out',
  zIndex: 0,
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
}));

export const LoginCard = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  backgroundColor: 'transparent',
  borderRadius: '0',
  overflow: 'visible',
  maxWidth: '520px',
  width: '100%',
  maxHeight: 'calc(100vh - 48px)',
  minHeight: 'min-content',
  position: 'relative',
  zIndex: 1,
  gap: 'clamp(12px, 2.5vh, 25px)',
  flexShrink: 0,
  '@media (max-width: 1200px)': {
    maxWidth: '550px',
  },
  '@media (max-width: 968px)': {
    maxHeight: 'calc(100vh - 24px)',
  },
}));

export const TopSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'transparent',
  width: '100%',
  gap: '10px',
  flexShrink: 0,
  minHeight: 0,
}));

export const LogoContainer = styled(Box)(({ theme }) => ({
  width: '140px',
  height: '140px',
  backgroundColor: 'transparent',
  borderRadius: '20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '0',
  '& img': {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
}));

export const FormSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  padding: 'clamp(28px, 4.5vh, 56px) clamp(28px, 4vw, 56px)',
  background: 'linear-gradient(180deg, #2C0B2A 0%, #250723 100%)',
  border: '1px solid #1A0218',
  borderRadius: '20px',
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
  position: 'relative',
  minHeight: 'min-content',
  flex: '0 0 auto',
  overflow: 'visible',
  '@media (max-width: 968px)': {
    padding: 'clamp(24px, 3.5vh, 48px) clamp(24px, 3vw, 40px)',
  },
  '@media (max-width: 480px)': {
    padding: 'clamp(20px, 3vh, 44px) clamp(20px, 2.5vw, 32px)',
  },
}));

export const WelcomeText = styled(Typography)(({ theme }) => ({
  fontSize: '22px',
  fontWeight: 600,
  color: '#ffffff',
  textAlign: 'center',
  marginBottom: '25px',
  letterSpacing: '4px',
  position: 'relative',
  display: 'inline-block',
  whiteSpace: 'nowrap',
}));

export const WelcomeLine = styled('div')(({ theme }) => ({
  position: 'relative',
  width: '150px',
  height: '3px',
  '&.left': {
    background: 'linear-gradient(90deg, rgba(212, 175, 55, 0.2) 0%, #d4af37 100%)',
    '&::before': {
      content: '""',
      position: 'absolute',
      left: '0',
      top: '50%',
      transform: 'translateY(-50%)',
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      backgroundColor: '#d4af37',
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      right: '0',
      top: '50%',
      transform: 'translateY(-50%)',
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      backgroundColor: '#d4af37',
    },
  },
  '&.right': {
    background: 'linear-gradient(90deg, #d4af37 0%, rgba(212, 175, 55, 0.2) 100%)',
    '&::before': {
      content: '""',
      position: 'absolute',
      left: '0',
      top: '50%',
      transform: 'translateY(-50%)',
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      backgroundColor: '#d4af37',
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      right: '0',
      top: '50%',
      transform: 'translateY(-50%)',
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      backgroundColor: '#d4af37',
    },
  },
}));

export const AppTitle = styled(Typography)(({ theme }) => ({
  fontSize: '28px',
  fontWeight: 600,
  color: '#ffffff',
  textAlign: 'center',
  marginBottom: '48px',
}));

export const SignInTitle = styled(Typography)(({ theme }) => ({
  fontSize: '28px',
  fontWeight: 500,
  color: '#ffffff',
  marginTop: '10px',
  textAlign: 'center',
}));

export const FormField = styled(TextField)(({ error }) => ({
  marginBottom: '28px',
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    color: '#ffffff',
    '& fieldset': {
      borderColor: error ? '#ff6b6b' : 'rgba(255, 255, 255, 0.3)',
      borderWidth: '1px',
    },
    '&:hover fieldset': {
      borderColor: error ? '#ff6b6b' : 'rgba(255, 255, 255, 0.5)',
    },
    '&.Mui-focused fieldset': {
      borderColor: error ? '#ff6b6b' : '#d4af37',
      borderWidth: '2px',
    },
  },
  '& .MuiInputLabel-root': {
    fontSize: '15px',
    fontWeight: 400,
    color: 'rgba(255, 255, 255, 0.7)',
    '&.Mui-focused': {
      color: '#d4af37',
    },
  },
  '& .MuiOutlinedInput-input': {
    fontSize: '15px',
    padding: '16px 14px',
    color: '#ffffff',
    '&::placeholder': {
      color: 'rgba(255, 255, 255, 0.5)',
      opacity: 1,
    },
    // Override browser autofill styles - transparent background
    '&:-webkit-autofill': {
      WebkitBoxShadow: '0 0 0 100px transparent inset !important',
      WebkitTextFillColor: '#ffffff !important',
      caretColor: '#ffffff',
      borderRadius: '10px',
      transition: 'background-color 5000s ease-in-out 0s',
    },
    '&:-webkit-autofill:hover': {
      WebkitBoxShadow: '0 0 0 100px transparent inset !important',
      WebkitTextFillColor: '#ffffff !important',
    },
    '&:-webkit-autofill:focus': {
      WebkitBoxShadow: '0 0 0 100px transparent inset !important',
      WebkitTextFillColor: '#ffffff !important',
    },
    '&:-webkit-autofill:active': {
      WebkitBoxShadow: '0 0 0 100px transparent inset !important',
      WebkitTextFillColor: '#ffffff !important',
    },
  },
  '& .MuiInputAdornment-root': {
    color: 'rgba(255, 255, 255, 0.6)',
    marginRight: '8px',
  },
}));

export const SubmitButton = styled(Button)(({ theme }) => ({
  backgroundColor: 'rgba(255, 255, 255, 0.15)',
  color: '#ffffff',
  textTransform: 'none',
  fontSize: '18px',
  fontWeight: 600,
  padding: '16px',
  borderRadius: '10px',
  marginTop: '20px',
  marginBottom: '30px',
  minWidth: '140px',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  backdropFilter: 'blur(10px)',
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)',
  },
  '&:active': {
    transform: 'translateY(0)',
  },
}));

export const LinksContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  marginTop: '20px',
}));

export const LinkText = styled(Typography)(({ theme }) => ({
  fontSize: '15px',
  color: '#ffffff',
  cursor: 'pointer',
  position: 'relative',
  transition: 'all 0.3s ease',
  whiteSpace: 'nowrap',
  '&:hover': {
    color: '#d4af37',
    transform: 'scale(1.05)',
  },
}));

export const RegisterLine = styled('div')(({ theme }) => ({
  position: 'relative',
  width: '50px',
  height: '2px',
  transition: 'all 0.3s ease',
  '&.left': {
    background: 'linear-gradient(90deg, rgba(212, 175, 55, 0.2) 0%, #d4af37 100%)',
    '&::before': {
      content: '""',
      position: 'absolute',
      left: '0',
      top: '50%',
      transform: 'translateY(-50%)',
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      backgroundColor: '#d4af37',
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      right: '0',
      top: '50%',
      transform: 'translateY(-50%)',
      width: '4px',
      height: '4px',
      borderRadius: '50%',
      backgroundColor: '#d4af37',
    },
  },
  '&.right': {
    background: 'linear-gradient(90deg, #d4af37 0%, rgba(212, 175, 55, 0.2) 100%)',
    '&::before': {
      content: '""',
      position: 'absolute',
      left: '0',
      top: '50%',
      transform: 'translateY(-50%)',
      width: '4px',
      height: '4px',
      borderRadius: '50%',
      backgroundColor: '#d4af37',
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      right: '0',
      top: '50%',
      transform: 'translateY(-50%)',
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      backgroundColor: '#d4af37',
    },
  },
}));

export const ErrorMessage = styled(Typography)(({ theme }) => ({
  fontSize: '13px',
  color: '#ff6b6b',
  marginTop: '-20px',
  marginBottom: '16px',
}));

export const LogoImageContainer = styled(Box)(({ theme }) => ({
  width: '130px',
  height: '130px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 0',
  '& img': {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
}));

export const ForgotPasswordLink = styled(Typography)(({ theme }) => ({
  fontSize: '14px',
  color: 'rgba(255, 255, 255, 0.7)',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  textAlign: 'right',
  '&:hover': {
    color: '#ffffff',
    textDecoration: 'underline',
  },
}));

// Modal Components
export const ModalContainer = styled(Box)(({ theme }) => ({
  padding: '40px',
  background: 'linear-gradient(180deg, #2C0B2A 0%, #250723 100%)',
  border: '1px solid #1A0218',
  position: 'relative',
  borderRadius: '16px',
}));

export const ModalHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '32px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  paddingBottom: '16px',
}));

export const ModalTitle = styled(Typography)(({ theme }) => ({
  fontSize: '28px',
  fontWeight: 500,
  color: '#ffffff',
}));

export const CloseButton = styled(IconButton)(({ theme }) => ({
  color: 'rgba(255, 255, 255, 0.6)',
  padding: '8px',
  '&:hover': {
    color: '#ffffff',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
}));

export const OTPContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: '16px',
  justifyContent: 'center',
  marginBottom: '24px',
}));

export const OTPInput = styled('input')(({ theme }) => ({
  width: '64px',
  height: '64px',
  fontSize: '32px',
  textAlign: 'center',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  borderRadius: '10px',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
  outline: 'none',
  fontWeight: 600,
  color: '#ffffff',
  '&:focus': {
    borderColor: '#d4af37',
    borderWidth: '2px',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  '&::placeholder': {
    color: 'rgba(255, 255, 255, 0.5)',
  },
}));

export const DialogButtonContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: '16px',
  justifyContent: 'flex-end',
  marginTop: '24px',
}));

export const DialogButton = styled(Button)(({ theme }) => ({
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  color: '#ffffff',
  textTransform: 'none',
  fontSize: '16px',
  fontWeight: 500,
  padding: '14px',
  borderRadius: '8px',
  minWidth: '140px',
  flex: 1,
  border: '1px solid rgba(255, 255, 255, 0.3)',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
}));

export const ConfirmationTitle = styled(Typography)(({ theme }) => ({
  fontSize: '24px',
  fontWeight: 500,
  color: '#ffffff',
}));

export const ConfirmationMessage = styled(Typography)(({ theme }) => ({
  fontSize: '20px',
  fontWeight: 400,
  color: 'rgba(255, 255, 255, 0.9)',
  textAlign: 'left',
}));

// Registration Modal Components
export const RegistrationModalContainer = styled(Box)(({ theme }) => ({
  padding: '30px 40px 35px',
  background: '#ffffff',
  position: 'relative',
  borderRadius: '16px',
  maxHeight: 'none',
  overflowY: 'visible',
}));

export const RegistrationModalHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '25px',
  padding: '16px 20px',
  paddingBottom: '20px',
  margin: '-30px -40px 25px -40px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
  backgroundColor: 'rgba(89, 12, 22, 1)',
  borderRadius: '16px 16px 0 0',
}));

export const RegistrationModalTitle = styled(Typography)(({ theme }) => ({
  fontSize: '24px',
  fontWeight: 500,
  color: '#ffffff',
}));

export const RegistrationCloseButton = styled(IconButton)(({ theme }) => ({
  color: 'rgba(255, 255, 255, 0.9)',
  padding: '8px',
  '&:hover': {
    color: '#ffffff',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
}));

export const RegistrationFormRow = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '1fr 2px 1.8fr',
  gap: '0',
  marginBottom: '0',
  '@media (max-width: 768px)': {
    gridTemplateColumns: '1fr',
    gap: '20px',
  },
}));

export const RegistrationFormColumn = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  '&:first-of-type': {
    paddingRight: '25px',
  },
  '&:last-of-type': {
    paddingLeft: '25px',
  },
}));

export const RegistrationDivider = styled(Box)(({ theme }) => ({
  width: '1px',
  height: '100%',
  borderLeft: '2px dashed #d0d0d0',
  margin: '0',
  '@media (max-width: 768px)': {
    width: '100%',
    height: '1px',
    borderLeft: 'none',
    borderTop: '2px dashed #d0d0d0',
    margin: '20px 0',
  },
}));

export const RegistrationFormField = styled(TextField)(({ error }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    '& fieldset': {
      borderColor: error ? '#ff6b6b' : '#e0e0e0',
      borderWidth: '1px',
    },
    '&:hover fieldset': {
      borderColor: error ? '#ff6b6b' : '#b0b0b0',
    },
    '&.Mui-focused fieldset': {
      borderColor: error ? '#ff6b6b' : '#7a1970',
      borderWidth: '2px',
    },
  },
  '& .MuiInputLabel-root': {
    fontSize: '13px',
    fontWeight: 500,
    color: '#2c2c2c',
    '&.Mui-focused': {
      color: '#7a1970',
    },
  },
  '& .MuiOutlinedInput-input': {
    fontSize: '13px',
    padding: '12px 14px',
    color: '#2c2c2c',
    '&::placeholder': {
      color: '#b0b0b0',
      opacity: 1,
    },
    // Override browser autofill styles - transparent background
    '&:-webkit-autofill': {
      WebkitBoxShadow: '0 0 0 100px transparent inset !important',
      WebkitTextFillColor: '#2c2c2c !important',
      caretColor: '#2c2c2c',
      borderRadius: '8px',
      transition: 'background-color 5000s ease-in-out 0s',
    },
    '&:-webkit-autofill:hover': {
      WebkitBoxShadow: '0 0 0 100px transparent inset !important',
      WebkitTextFillColor: '#2c2c2c !important',
    },
    '&:-webkit-autofill:focus': {
      WebkitBoxShadow: '0 0 0 100px transparent inset !important',
      WebkitTextFillColor: '#2c2c2c !important',
    },
    '&:-webkit-autofill:active': {
      WebkitBoxShadow: '0 0 0 100px transparent inset !important',
      WebkitTextFillColor: '#2c2c2c !important',
    },
  },
  '& .MuiInputAdornment-root': {
    color: '#7a1970',
    marginRight: '8px',
  },
}));

export const FileUploadContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
}));

export const FileUploadLabel = styled(Typography)(({ theme }) => ({
  fontSize: '13px',
  fontWeight: 500,
  color: '#2c2c2c',
  marginBottom: '6px',
}));

export const FileUploadBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  border: '1px solid #e0e0e0',
  borderRadius: '8px',
  padding: '12px 14px',
  backgroundColor: '#ffffff',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: '#7a1970',
    backgroundColor: '#fafafa',
  },
}));

export const FileUploadButton = styled(Button)(({ theme }) => ({
  backgroundColor: 'transparent',
  color: '#9e9e9e',
  textTransform: 'none',
  fontSize: '13px',
  fontWeight: 400,
  padding: '0',
  minWidth: 'auto',
  '&:hover': {
    backgroundColor: 'transparent',
    color: '#7a1970',
  },
}));

export const RegistrationButtonContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: '16px',
  justifyContent: 'flex-end',
  marginTop: '30px',
  paddingTop: '25px',
  borderTop: '1px solid #e0e0e0',
}));

export const RegistrationSubmitButton = styled(Button)(({ theme }) => ({
  backgroundColor: 'rgba(89, 12, 22, 1)',
  color: '#ffffff',
  textTransform: 'none',
  fontSize: '16px',
  fontWeight: 500,
  padding: '12px 40px',
  borderRadius: '8px',
  minWidth: '120px',
  '&:hover': {
    backgroundColor: 'rgba(89, 12, 22, 1)',
  },
}));

export const RegistrationCancelButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#e0e0e0',
  color: '#2c2c2c',
  textTransform: 'none',
  fontSize: '16px',
  fontWeight: 500,
  padding: '12px 40px',
  borderRadius: '8px',
  minWidth: '120px',
  '&:hover': {
    backgroundColor: '#d0d0d0',
  },
}));

export const IconContainer = styled(Box)(({ theme }) => ({
  width: '55px',
  height: '55px',
  borderRadius: '50%',
  backgroundColor: '#f0f0f0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '0',
  '& svg': {
    fontSize: '28px',
    color: '#7a1970',
  },
}));

export const SectionHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '15px',
  marginBottom: '0',
}));