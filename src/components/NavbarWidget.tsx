import { styled } from '@mui/material/styles';
import { Box, List, ListItem, Typography } from '@mui/material';

export const drawerWidth = 280;

export const StyledDrawer = styled(Box)(({ theme }) => ({
  width: drawerWidth,
  boxSizing: 'border-box',
  background: 'linear-gradient(180deg, #2C0B2A 0%, #250723 100%)',
  color: '#fff',
  display: 'flex',
  flexDirection: 'column',
  height: 'calc(100vh - 70px)',
  position: 'fixed',
  top: 70,
  left: 0,
  overflow: 'hidden',
}));

/** Scrollable area for nav items; keeps logo pinned at bottom. Thin scrollbar to avoid breaking UI. */
export const NavScrollArea = styled(Box)({
  flex: '1 1 auto',
  minHeight: 0,
  overflowY: 'auto',
  overflowX: 'hidden',
  scrollbarWidth: 'thin',
  scrollbarColor: 'rgba(255, 255, 255, 0.3) transparent',
  '&::-webkit-scrollbar': {
    width: '4px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'rgba(255, 255, 255, 0.25)',
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-thumb:hover': {
    background: 'rgba(255, 255, 255, 0.4)',
  },
});

export interface StyledListItemProps {
  selected?: boolean;
}

export const StyledListItem = styled(ListItem, {
  shouldForwardProp: (prop) => prop !== 'selected',
})<StyledListItemProps>(({ theme, selected }) => ({
  padding: '14px 24px',
  marginBottom: '2px',
  cursor: 'pointer',
  backgroundColor: selected ? 'rgba(89, 12, 22, 1)' : 'transparent',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: 'rgba(89, 12, 22, 1)',
  },
  '& .MuiListItemIcon-root': {
    color: selected ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
    minWidth: '40px',
    backgroundColor: 'transparent',
    '& *': {
      backgroundColor: 'transparent',
    },
  },
  '& .MuiListItemText-primary': {
    fontSize: '13px',
    fontWeight: selected ? 600 : 500,
    color: selected ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
    letterSpacing: '0.5px',
  },
}));

export const LogoContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '2px 2px 30px 20px',
  marginTop: 'auto',
  flexShrink: 0,
});

export const LogoImage = styled('img')({
  width: '90px',
  height: '90px',
  objectFit: 'contain',
});

export const SectionTitle = styled(Typography)({
  fontSize: '11px',
  fontWeight: 700,
  color: 'rgba(255, 255, 255, 0.4)',
  letterSpacing: '1.5px',
  marginTop: '32px',
  marginBottom: '12px',
  marginLeft: '24px',
  textTransform: 'uppercase',
});

export const VersionText = styled(Typography)({
  fontSize: '11px',
  color: 'rgba(255, 255, 255, 0.5)',
  marginTop: '12px',
  fontWeight: 400,
});

export const StyledList = styled(List)({
  paddingTop: '16px',
});

