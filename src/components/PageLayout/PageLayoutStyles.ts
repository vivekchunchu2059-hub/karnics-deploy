import { Box, Card, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { APP_COLORS } from '../../constants/colors';

export const PageContainer = styled(Box)({
  marginLeft: 280,
  padding: '24px',
  backgroundColor: '#f0f2f5',
  minHeight: 0,
  flex: 1,
  width: 'calc(100% - 280px)',
  overflowY: 'auto',
  overflowX: 'hidden',
  WebkitOverflowScrolling: 'touch',
});

export const PageHeader = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '24px',
  flexWrap: 'wrap',
  gap: '16px',
  minWidth: 0, /* allow flex children to shrink in all browsers */
});

export const PageHeaderLeft = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '14px',
  minWidth: 0,
  flexShrink: 0,
});

export const PageIconWrapper = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 48,
  height: 48,
  borderRadius: 12,
  background: 'rgba(89, 12, 22, 1)',
  color: '#fff',
  boxShadow: '0 4px 14px rgba(46, 45, 71, 0.25)',
});

export const PageTitle = styled(Typography)({
  fontWeight: 700,
  fontSize: '22px',
  color: APP_COLORS.themePrimary,
  letterSpacing: '-0.02em',
  lineHeight: 1.3,
});

export const PageHeaderRight = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  flexWrap: 'wrap',
  minWidth: 0,
  flex: '1 1 auto',
  justifyContent: 'flex-end',
});

export const MainCard = styled(Card)({
  borderRadius: 16,
  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  overflow: 'hidden',
  border: '1px solid rgba(0,0,0,0.06)',
});

export const MainCardContent = styled(Box)({
  padding: '24px',
});
