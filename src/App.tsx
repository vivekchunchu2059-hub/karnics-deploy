import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Navbar from './components/Navbar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard/Dashboard';
import Invoices from './pages/Invoice/Invoices';
import Billing from './pages/BillingPage/Billing';
import EditBill from './pages/EditBill/EditBill';
import Sales from './pages/Sales/Sales';
import Inventory from './pages/Inventory/Inventory';
import Customers from './pages/Customer/Customers';
import Roles from './pages/Roles/Roles';
import Users from './pages/Users/Users';
import DataSync from './pages/DataSync/DataSync';
import ActivityLog from './pages/ActivityLog/ActivityLog';
import ActivityLogDetails from './pages/ActivityLog/ActivityLogDetails';
import Login from './pages/Login/Login';
import Unauthorized from './pages/Unauthorized/Unauthorized';
import { apiClient, AUTH_TOKEN_KEY } from './api';
import { Role } from './models/Role';
import { canAccessPage } from './utils/roleAccess';
import { API_ENDPOINTS } from './constants/common';
import { STORAGE_COMPANY_LOGO, STORAGE_COMPANY_NAME } from './utils/uploadConstants';
import { NotificationProvider } from './services/notificationService';
import log from './utils/logger';

// Create custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#3f51b5',
      light: '#7986cb',
      dark: '#303f9f',
    },
    secondary: {
      main: '#ffa726',
      light: '#ffb74d',
      dark: '#f57c00',
    },
    grey: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#eeeeee',
      300: '#e0e0e0',
      400: '#bdbdbd',
      500: '#9e9e9e',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 600,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          textTransform: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

// Protected Route Component
interface ProtectedRouteProps {
  pageName: string;
  roles: Role[];
  component: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps & { currentRole: string | null; rolesLoading: boolean }> = ({ 
  pageName, 
  roles, 
  component,
  currentRole,
  rolesLoading
}) => {
  const effectiveRole =
    currentRole ??
    (typeof window !== 'undefined' ? localStorage.getItem('userRole') : null);

  // If roles are still loading, allow temporary access to prevent race condition
  // Access will be re-checked once roles finish loading
  // This prevents "Access Denied" flash when roles haven't loaded yet after login
  if (rolesLoading) {
    return component;
  }

  // Allow access when roles array is empty (first user scenario - JSON files are empty)
  // Role can be assigned later manually from Users page
  if (roles.length === 0) {
    return component;
  }

  if (!canAccessPage(effectiveRole, pageName, roles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return component;
};

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialAuth =
    typeof window !== 'undefined' && localStorage.getItem('isLoggedIn') === 'true';
  const [selectedMenuItem, setSelectedMenuItem] = useState<string>('DASHBOARD');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(initialAuth);
  const [shouldFocusDashboard, setShouldFocusDashboard] = useState<boolean>(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState<boolean>(false);
  const [currentRole, setCurrentRole] = useState<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('userRole') : null
  );

  // Sync authentication state on mount to ensure it persists across reloads
  useEffect(() => {
    // Double-check authentication state on mount to prevent redirects on reload
    const checkAuthOnMount = () => {
      if (typeof window !== 'undefined') {
        const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
        if (loggedIn && !isAuthenticated) {
          setIsAuthenticated(true);
        }
      }
    };
    checkAuthOnMount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load roles to check permissions
  useEffect(() => {
    const loadRoles = async () => {
      log.info('Fetching roles...');
      setRolesLoading(true);
      try {
        const response = await apiClient.get('/api/roles');
        const rolesData = Array.isArray(response.data) ? response.data : [];
        setRoles(rolesData);
        log.info('Roles fetched successfully');
      } catch (error) {
        log.error('Failed to fetch roles:', error);
      } finally {
        setRolesLoading(false);
      }
    };
    if (isAuthenticated) {
      loadRoles();
    }
  }, [isAuthenticated]);

  // Load company logo and name from server into localStorage (so header, sidebar, billing PDF use it)
  useEffect(() => {
    const loadCompanySettings = async () => {
      log.info('Fetching company settings...');
      try {
        const response = await apiClient.get<{ success: boolean; data: { companyLogo?: string; companyName?: string } }>(API_ENDPOINTS.SETTINGS_COMPANY);
        const data = response.data?.data;
        if (data) {
          if (data.companyLogo) localStorage.setItem(STORAGE_COMPANY_LOGO, data.companyLogo);
          if (data.companyName) localStorage.setItem(STORAGE_COMPANY_NAME, data.companyName);
          window.dispatchEvent(new Event('profileOrLogoUpdated'));
        }
        log.info('Company settings fetched successfully');
      } catch (error) {
        log.error('Failed to fetch company settings:', error);
        // Server may not have settings yet; ignore
      }
    };
    if (isAuthenticated) {
      loadCompanySettings();
    }
  }, [isAuthenticated]);

  // Global role listener - sync role state when localStorage changes
  useEffect(() => {
    const syncRole = () => {
      const newRole = localStorage.getItem('userRole');
      setCurrentRole(newRole);
    };

    window.addEventListener('userRoleUpdated', syncRole);

    return () => {
      window.removeEventListener('userRoleUpdated', syncRole);
    };
  }, []);

  // When API returns 401, clear session and redirect to login
  useEffect(() => {
    const onAuthLogout = () => {
      handleLogout();
    };
    window.addEventListener('auth:logout', onAuthLogout);
    return () => window.removeEventListener('auth:logout', onAuthLogout);
  }, []);

  const pathToMenu: Record<string, string> = {
    '/dashboard': 'DASHBOARD',
    '/invoices': 'INVOICES',
    '/billing': 'INVOICES',
    '/sales': 'SALES',
    '/inventory': 'INVENTORY',
    '/customers': 'CUSTOMERS',
    '/roles': 'ROLES',
    '/users': 'USERS',
    '/data-sync': 'DATA SYNC',
    '/activity-log': 'ACTIVITY LOG',
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    const menu = pathToMenu[location.pathname];
    if (menu) setSelectedMenuItem(menu);
  }, [isAuthenticated, location.pathname]);

  const handleLogin = () => {
    localStorage.setItem('isLoggedIn', 'true');
    setIsAuthenticated(true);
    setSelectedMenuItem('DASHBOARD'); // Reset to dashboard on login
    setShouldFocusDashboard(true);
    navigate('/dashboard');
    // Reset the flag after a short delay to allow focus
    setTimeout(() => {
      setShouldFocusDashboard(false);
    }, 200);
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('currentUserRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('currentUserId');
    localStorage.removeItem('currentUserEmail');
    localStorage.removeItem('currentUsername');
    setIsAuthenticated(false);
    navigate('/login');
  };

  const handleMenuItemClick = (itemId: string) => {
    setSelectedMenuItem(itemId);
    
    // Navigate to the appropriate route
    const routes: Record<string, string> = {
      'DASHBOARD': '/dashboard',
      'INVOICES': '/invoices',
      'SALES': '/sales',
      'INVENTORY': '/inventory',
      'CUSTOMERS': '/customers',
      'ROLES': '/roles',
      'USERS': '/users',
      'DATA SYNC': '/data-sync',
      'ACTIVITY LOG': '/activity-log'
    };
    
    navigate(routes[itemId] || '/dashboard');
  };

  // Double-check localStorage before redirecting to prevent losing session on reload
  // This ensures users stay logged in even if React state hasn't synced yet
  const localStorageAuth = typeof window !== 'undefined' && localStorage.getItem('isLoggedIn') === 'true';
  const isActuallyAuthenticated = isAuthenticated || localStorageAuth;

  if (!isActuallyAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Header onLogout={handleLogout} />
      <Box sx={{ display: 'flex', flexGrow: 1, paddingTop: '70px' }}>
        <Navbar 
          selectedItem={selectedMenuItem} 
          onItemClick={handleMenuItemClick}
          shouldFocusDashboard={shouldFocusDashboard}
        />
        <Box component="main" sx={{ flexGrow: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute 
                  pageName="DASHBOARD" 
                  roles={roles}
                  currentRole={currentRole}
                  rolesLoading={rolesLoading}
                  component={<Dashboard />} 
                />
              } 
            />
            <Route 
              path="/invoices" 
              element={
                <ProtectedRoute 
                  pageName="INVOICES" 
                  roles={roles}
                  currentRole={currentRole}
                  rolesLoading={rolesLoading}
                  component={<Invoices />} 
                />
              } 
            />
            <Route 
              path="/billing" 
              element={
                <ProtectedRoute 
                  pageName="INVOICES" 
                  roles={roles}
                  currentRole={currentRole}
                  rolesLoading={rolesLoading}
                  component={<Billing />} 
                />
              } 
            />
            <Route 
              path="/edit-bill/:id" 
              element={
                <ProtectedRoute 
                  pageName="INVOICES" 
                  roles={roles}
                  currentRole={currentRole}
                  rolesLoading={rolesLoading}
                  component={<EditBill />} 
                />
              } 
            />
            <Route 
              path="/sales" 
              element={
                <ProtectedRoute 
                  pageName="SALES" 
                  roles={roles}
                  currentRole={currentRole}
                  rolesLoading={rolesLoading}
                  component={<Sales />} 
                />
              } 
            />
            <Route 
              path="/inventory" 
              element={
                <ProtectedRoute 
                  pageName="INVENTORY" 
                  roles={roles}
                  currentRole={currentRole}
                  rolesLoading={rolesLoading}
                  component={<Inventory />} 
                />
              } 
            />
            <Route 
              path="/customers" 
              element={
                <ProtectedRoute 
                  pageName="CUSTOMERS" 
                  roles={roles}
                  currentRole={currentRole}
                  rolesLoading={rolesLoading}
                  component={<Customers />} 
                />
              } 
            />
            <Route 
              path="/roles" 
              element={
                <ProtectedRoute 
                  pageName="ROLES" 
                  roles={roles}
                  currentRole={currentRole}
                  rolesLoading={rolesLoading}
                  component={<Roles />} 
                />
              } 
            />
            <Route 
              path="/users" 
              element={
                <ProtectedRoute 
                  pageName="USERS" 
                  roles={roles}
                  currentRole={currentRole}
                  rolesLoading={rolesLoading}
                  component={<Users />} 
                />
              } 
            />
            <Route 
              path="/data-sync" 
              element={
                <ProtectedRoute 
                  pageName="DATA SYNC" 
                  roles={roles}
                  currentRole={currentRole}
                  rolesLoading={rolesLoading}
                  component={<DataSync />} 
                />
              } 
            />
            <Route 
              path="/activity-log" 
              element={
                <ProtectedRoute 
                  pageName="ACTIVITY LOG" 
                  roles={roles}
                  currentRole={currentRole}
                  rolesLoading={rolesLoading}
                  component={<ActivityLog />} 
                />
              } 
            />
            <Route
              path="/activity-log/:username"
              element={
                <ProtectedRoute
                  pageName="ACTIVITY LOG"
                  roles={roles}
                  currentRole={currentRole}
                  rolesLoading={rolesLoading}
                  component={<ActivityLogDetails />}
                />
              }
            />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Box>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;

