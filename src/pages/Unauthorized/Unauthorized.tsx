import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LockIcon from '@mui/icons-material/Lock';

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 70px)',
        padding: '24px',
        textAlign: 'center',
      }}
    >
      <LockIcon sx={{ fontSize: 80, color: '#9e9e9e', mb: 2 }} />
      <Typography variant="h4" sx={{ fontWeight: 600, color: '#2c2c2c', mb: 1 }}>
        Access Denied
      </Typography>
      <Typography variant="body1" sx={{ color: '#757575', mb: 3, maxWidth: '500px' }}>
        You don't have permission to access this page. Please contact your administrator if you believe this is an error.
      </Typography>
      <Button
        variant="contained"
        onClick={() => navigate('/dashboard')}
        sx={{
          backgroundColor: '#2c2c2c',
          '&:hover': {
            backgroundColor: '#424242',
          },
        }}
      >
        Go to Dashboard
      </Button>
    </Box>
  );
};

export default Unauthorized;

