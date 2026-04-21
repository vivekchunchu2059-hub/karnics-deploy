import React, { useEffect, useRef, useState } from 'react';
import { ListItemIcon, ListItemText, Typography } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DescriptionIcon from '@mui/icons-material/Description';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import InventoryIcon from '@mui/icons-material/Inventory';
import PeopleIcon from '@mui/icons-material/People';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import GroupIcon from '@mui/icons-material/Group';
import SyncIcon from '@mui/icons-material/Sync';
import HistoryIcon from '@mui/icons-material/History';
import iconSunarKhata from '../assests/icons/mainlogo.png';
import { apiClient, getRuntimePublicEnv } from '../api';
import { Role } from '../models/Role';
import { canAccessPage } from '../utils/roleAccess';
import { StyledDrawer, StyledListItem, LogoContainer, LogoImage, SectionTitle, StyledList, NavScrollArea } from './NavbarWidget';
import log from '../utils/logger';


interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface NavbarProps {
  selectedItem?: string;
  onItemClick?: (itemId: string) => void;
  shouldFocusDashboard?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ selectedItem = 'DASHBOARD', onItemClick, shouldFocusDashboard = false }) => {
  const dashboardRef = useRef<HTMLLIElement>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [currentRole, setCurrentRole] = useState<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('userRole') : null
  );
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(
    () => getRuntimePublicEnv('REACT_APP_COMPANY_URL') ?? null
  );

  // Reload roles when currentRole changes (e.g., after login)
  useEffect(() => {
    if (currentRole) {
      const loadRoles = async () => {
        try {
          const response = await apiClient.get('/api/roles');
          const rolesData = Array.isArray(response.data) ? response.data : [];
          setRoles(rolesData);
        } catch (error) {
          log.error('Failed to load roles:', error);
        }
      };
      loadRoles();
    }
  }, [currentRole]);

  // Listen for role changes
  useEffect(() => {
    const syncRole = () => {
      const newRole = localStorage.getItem('userRole');
      setCurrentRole(newRole);
    };

    window.addEventListener('storage', syncRole);
    
    // Also listen for custom events
    const handleRoleChange = () => {
      syncRole();
    };
    window.addEventListener('storage', handleRoleChange);

    return () => {
      window.removeEventListener('storage', syncRole);
      window.removeEventListener('storage', handleRoleChange);
    };
  }, []);

  const userRole = localStorage.getItem('userRole')?.trim() ?? 'superAdmin';

  const allMenuItems: MenuItem[] = [
    { id: 'DASHBOARD', label: 'DASHBOARD', icon: <DashboardIcon /> },
    { id: 'INVOICES', label: 'INVOICES', icon: <DescriptionIcon /> },
    { id: 'SALES', label: 'SALES', icon: <ShoppingCartIcon /> },
    { id: 'INVENTORY', label: 'INVENTORY', icon: <InventoryIcon /> },
    { id: 'CUSTOMERS', label: 'CUSTOMERS', icon: <PeopleIcon /> },
  ];

  // Filter menu items based on user role permissions
  const menuItems = allMenuItems.filter((item) => 
    canAccessPage(userRole, item.id, roles)
  );

  // Sync company URL from .env (REACT_APP_COMPANY_URL) and company name from localStorage
  useEffect(() => {
    const syncCompany = () => {
      const urlFromEnv = getRuntimePublicEnv('REACT_APP_COMPANY_URL');
      if (urlFromEnv) setCompanyLogoUrl(urlFromEnv);
    };
    window.addEventListener('storage', syncCompany);
    window.addEventListener('profileOrLogoUpdated', syncCompany);
    syncCompany();
    return () => {
      window.removeEventListener('storage', syncCompany);
      window.removeEventListener('profileOrLogoUpdated', syncCompany);
    };
  }, []);

  // Focus on dashboard icon when shouldFocusDashboard is true
  useEffect(() => {
    if (shouldFocusDashboard && dashboardRef.current) {
      // Use setTimeout to ensure the DOM is ready
      setTimeout(() => {
        dashboardRef.current?.focus();
      }, 100);
    }
  }, [shouldFocusDashboard]);

  const allAdminItems: MenuItem[] = [
    { id: 'ROLES', label: 'ROLES', icon: <AdminPanelSettingsIcon /> },
    { id: 'USERS', label: 'USERS', icon: <GroupIcon /> },
    { id: 'DATA SYNC', label: 'DATA SYNC', icon: <SyncIcon /> },
    { id: 'ACTIVITY LOG', label: 'ACTIVITY LOG', icon: <HistoryIcon /> },
  ];

  // Filter admin items based on user role permissions
  const adminItems = allAdminItems.filter((item) => 
    canAccessPage(userRole, item.id, roles)
  );

  const currentRoleObj = roles.find(
    (r) =>
      (r.role || "")
        .toLowerCase()
        .replace(/\s+/g, "") ===
      (userRole || "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "")
  );
  
  const canSeeAdmin =
    currentRoleObj?.permissions?.includes("ROLES") ||
    currentRoleObj?.permissions?.includes("USERS") ||
    currentRoleObj?.permissions?.includes("DATA SYNC");

  return (
    <StyledDrawer>
      <NavScrollArea>
        <StyledList>
          {menuItems.map((item) => (
            <StyledListItem
              key={item.id}
              ref={item.id === 'DASHBOARD' ? dashboardRef : null}
              selected={selectedItem === item.id}
              onClick={() => onItemClick && onItemClick(item.id)}
              tabIndex={item.id === 'DASHBOARD' ? 0 : -1}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </StyledListItem>
          ))}
        </StyledList>

        {(canSeeAdmin || canSeeAdmin===undefined) && (
          <SectionTitle sx={{ marginTop: '0px', marginBottom: '4px' }}>ADMINISTRATOR</SectionTitle>
        )}

        {adminItems.length > 0 && (
          <StyledList sx={{ mt: -3 }}>
            {adminItems.map((item) => (
              <StyledListItem
                key={item.id}
                selected={selectedItem === item.id}
                onClick={() => onItemClick && onItemClick(item.id)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </StyledListItem>
            ))}
          </StyledList>
        )}
      </NavScrollArea>

      <LogoContainer>
        {companyLogoUrl ? (
          <a
            href={companyLogoUrl ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'block', cursor: 'pointer' }}
          >
            <LogoImage src={iconSunarKhata} alt="Sunar Khata" />
          </a>
        ) : (
          <LogoImage src={iconSunarKhata} alt="Sunar Khata" />
        )}
        <Typography
          sx={{
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.5)',
            marginTop: '2px',
            fontWeight: 400,
          }}>
          Version 0.1
        </Typography>
      </LogoContainer>
    </StyledDrawer>
  );
};

export default Navbar; 


