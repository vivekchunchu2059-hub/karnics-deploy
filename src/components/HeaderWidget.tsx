import { styled } from "@mui/material/styles";
import { AppBar, Box, Typography, IconButton, TextField, MenuItem, Avatar, Toolbar } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { APP_COLORS } from "../constants/colors";

// AppBar Styling
export const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: '#ffffff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
  color: '#333',
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  zIndex: theme.zIndex.drawer + 1,
  width: '100%',
  borderBottom: '1px solid rgba(0,0,0,0.06)',
  backdropFilter: 'blur(10px)',
  background: 'linear-gradient(to bottom, #ffffff 0%, #fafafa 100%)',
}));

// Toolbar Styling
export const StyledToolbar = styled(Toolbar)(() => ({
  minHeight: '70px',
  paddingLeft: '24px',
  paddingRight: '24px',
}));

// Logo Section
export const LogoContainer = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  marginRight: '60px',
  cursor: 'pointer',
  '&:hover': {
    opacity: 0.8,
  },
}));

export const LogoTitle = styled(Box)(() => ({
  fontSize: '45px',
  fontWeight: 700,
  fontFamily: '"Playfair Display", "Cormorant Garamond", "Georgia", serif',
  color: '#BB9B4F',
  letterSpacing: '1px',
  backgroundClip: 'text',
  lineHeight: 1.2,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

export const LogoSubtitleContainer = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '5px',
}));

export const LogoLine = styled(Box)(() => ({
  width: '30px',
  height: '2px',
}));

export const LogoLineLeft = styled(LogoLine)(() => ({
  background: 'linear-gradient(90deg, rgba(207, 211, 99, 0.2) 0%, rgba(85, 83, 36, 0.32) 100%)',
}));

export const LogoLineRight = styled(LogoLine)(() => ({
  background: 'linear-gradient(90deg, rgba(85, 83, 36, 0.32) 0%, rgba(207, 211, 99, 0.2) 100%)',
}));

export const LogoSubtitle = styled(Typography)(() => ({
  fontSize: '8px',
  fontWeight: 600,
  fontFamily: '"Arial", "Helvetica", sans-serif',
  color: '#000000',
  letterSpacing: '0.5px',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
}));

// Price Section
export const PriceBox = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  marginRight: '24px',
  padding: '12px 20px',
  borderRadius: '12px',
  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
  border: '1px solid rgba(0,0,0,0.06)',
  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  minWidth: '140px',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    borderColor: 'rgba(0,0,0,0.1)',
  },
  '&.gold': {
    background: `linear-gradient(135deg, ${APP_COLORS.goldSoft} 0%, #fff5d6 100%)`,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    '&:hover': {
      borderColor: 'rgba(212, 175, 55, 0.4)',
      boxShadow: '0 4px 12px rgba(212, 175, 55, 0.15)',
    }
  },
  '&.silver': {
    background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)',
    borderColor: 'rgba(117, 117, 117, 0.2)',
    '&:hover': {
      borderColor: 'rgba(117, 117, 117, 0.4)',
      boxShadow: '0 4px 12px rgba(117, 117, 117, 0.15)',
    }
  },
  '&.platinum': {
    background: 'linear-gradient(135deg, #e8f4f8 0%, #d1e7dd 100%)',
    borderColor: 'rgba(59, 130, 246, 0.2)',
    '&:hover': {
      borderColor: 'rgba(59, 130, 246, 0.4)',
      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
    }
  }
});

export const PriceLabel = styled(Typography)({
  fontSize: '11px',
  color: '#6b7280',
  fontWeight: 500,
  marginBottom: '6px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  fontFamily: '"Inter", "Roboto", sans-serif',
});

export const PriceValue = styled(Typography)({
  fontSize: '16px',
  fontWeight: 600,
  fontFamily: '"Inter", "Roboto", sans-serif',
  transition: 'all 0.2s ease',
  '&.gold': {
    color: APP_COLORS.gold,
    background: `linear-gradient(135deg, ${APP_COLORS.gold} 0%, ${APP_COLORS.goldDark} 100%)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  '&.silver': {
    color: '#4b5563',
  },
  '&.platinum': {
    color: '#3b82f6',
  }
});

export const PriceValueClickable = styled(PriceValue)(() => ({
  cursor: 'pointer',
}));

export const PriceContainer = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
}));

// Price Input Fields
export const GoldPriceInput = styled(TextField)(() => ({
  '& .MuiOutlinedInput-root': {
    padding: '2px 8px',
    fontSize: '14px',
    fontWeight: 500,
    color: APP_COLORS.gold,
    '& fieldset': {
      borderColor: APP_COLORS.gold,
    },
    '&:hover fieldset': {
      borderColor: APP_COLORS.gold,
    },
    '&.Mui-focused fieldset': {
      borderColor: APP_COLORS.gold,
    },
  },
  '& .MuiOutlinedInput-input': {
    padding: '4px',
  },
}));

export const SilverPriceInput = styled(TextField)(() => ({
  '& .MuiOutlinedInput-root': {
    padding: '2px 8px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#757575',
    '& fieldset': {
      borderColor: '#757575',
    },
    '&:hover fieldset': {
      borderColor: '#757575',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#757575',
    },
  },
  '& .MuiOutlinedInput-input': {
    padding: '4px',
  },
}));

// Refresh Button
export const RefreshButton = styled(IconButton)(() => ({
  marginLeft: '-76px',
  color: '#757575',
  '&:hover': {
    backgroundColor: '#f5f5f5',
  },
  '&.Mui-disabled': {
    color: '#bdbdbd',
  }
}));

// User Section
export const UserSection = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  marginLeft: 'auto',
  gap: '16px',
});

export const UserInfo = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  cursor: 'pointer',
  padding: '8px 12px',
  borderRadius: '8px',
  paddingLeft: '24px',
  borderLeft: '1px solid #e0e0e0',
  borderRight: '1px solid #e0e0e0',
  '&:hover': {
    backgroundColor: '#f5f5f5',
  }
});

export const UserAvatar = styled(Avatar)(() => ({
  width: 36,
  height: 36,
  backgroundColor: '#e3f2fd',
  color: '#1976d2',
  fontSize: '14px',
  fontWeight: 600
}));

export const UserInfoBox = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
}));

export const UserNameText = styled(Typography)(() => ({
  fontSize: '14px',
  color: '#424242',
  fontWeight: 600,
}));

export const UserRoleText = styled(Typography)(() => ({
  fontSize: '12px',
  color: '#424242',
  opacity: 0.7,
}));

export const DropdownIcon = styled(Box)<{ open?: boolean }>(({ open }) => ({
  color: '#424242',
  fontSize: '24px',
  transition: 'transform 0.2s',
  transform: open ? 'rotate(180deg)' : 'rotate(0deg)'
}));

// Menu Styling
export const StyledMenuPaper = {
  overflow: 'visible',
  filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
  mt: 1.5,
  minWidth: 200,
  borderRadius: '8px',
  '&:before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    top: 0,
    right: 14,
    width: 10,
    height: 10,
    bgcolor: 'background.paper',
    transform: 'translateY(-50%) rotate(45deg)',
    zIndex: 0,
  },
};

export const StyledMenuItem = styled(MenuItem)(() => ({
  paddingTop: '12px',
  paddingBottom: '12px',
  paddingLeft: '16px',
  paddingRight: '16px',
  '&:hover': {
    backgroundColor: '#f5f5f5',
  }
}));

// Logout Button
export const LogoutButton = styled(IconButton)(() => ({
  color: '#757575',
}));

// Icons
export const StyledRefreshIcon = styled(RefreshIcon)<{ isRefreshing?: boolean }>(({ isRefreshing }) => ({
  fontSize: '27px',
  animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
  '@keyframes spin': {
    '0%': {
      transform: 'rotate(0deg)',
    },
    '100%': {
      transform: 'rotate(360deg)',
    },
  },
}));

export const StyledArrowDropDownIcon = styled(ArrowDropDownIcon)<{ open?: boolean }>(({ open }) => ({
  color: '#424242',
  fontSize: '24px',
  transition: 'transform 0.2s',
  transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
}));

export const StyledPersonOutlineIcon = styled(PersonOutlineIcon)(() => ({
  color: '#616161',
}));

export const StyledLockOutlinedIcon = styled(LockOutlinedIcon)(() => ({
  color: '#616161',
}));

// Typography Props Constants
export const MenuItemTypographyProps = {
  fontSize: '14px',
  fontWeight: 400,
  color: '#424242',
};



