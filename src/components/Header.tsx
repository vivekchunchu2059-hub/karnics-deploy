import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import { Toolbar, Typography, Box, IconButton, TextField, Menu, ListItemIcon, ListItemText, Snackbar, Alert } from '@mui/material';
import { validateImageFile, STORAGE_PROFILE_IMAGE, STORAGE_COMPANY_NAME, STORAGE_COMPANY_LOGO, PROFILE_LOGO_MAX_SIZE_MB, } from '../utils/uploadConstants';
import { APP_COLORS } from '../constants/colors';
import LogoutIcon from '@mui/icons-material/Logout';
import RefreshIcon from '@mui/icons-material/Refresh';
import ProfileDialog from '../pages/profile/Profile';
import { StyledAppBar, PriceBox, PriceLabel, PriceValue, UserSection, UserInfo, UserAvatar, UserInfoBox, UserNameText, UserRoleText, StyledArrowDropDownIcon, StyledMenuPaper, StyledMenuItem, StyledPersonOutlineIcon, StyledLockOutlinedIcon, MenuItemTypographyProps, LogoutButton } from './HeaderWidget';
import ChangePasswordDialog from './ChangePassword';
import { apiClient, API_BASE_URL } from '../api';
import { API_ENDPOINTS } from '../constants/common';
import log from '../utils/logger';

interface HeaderProps {
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  const [editingGoldPrice, setEditingGoldPrice] = useState<boolean>(false);
  const [editingSilverPrice, setEditingSilverPrice] = useState<boolean>(false);
  const [editingPlatinumPrice, setEditingPlatinumPrice] = useState<boolean>(false);
  const [goldPrice, setGoldPrice] = useState<string>('₹1,24,650/10gm');
  const [silverPrice, setSilverPrice] = useState<string>('₹2,410/10gm');
  const [platinumPrice, setPlatinumPrice] = useState<string>('₹5,000/10gm');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState<boolean>(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState<boolean>(false);
  const [refreshErrorOpen, setRefreshErrorOpen] = useState<boolean>(false);
  const [uploadSnackOpen, setUploadSnackOpen] = useState<boolean>(false);
  const [uploadSnackMessage, setUploadSnackMessage] = useState<string>('');
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_PROFILE_IMAGE);
    if (!raw) return null;
    if (raw.startsWith('data:') || raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    const base = API_BASE_URL;
    return `${base}/api/registration-images/${raw.replace(/^\//, '')}`;
  });
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>(
    typeof window !== 'undefined' ? localStorage.getItem(STORAGE_COMPANY_NAME) || '' : ''
  );
  const [shopName, setShopName] = useState<string>('');
  const profileInputRef = useRef<HTMLInputElement>(null);
  const goldPriceInputRef = useRef<HTMLInputElement>(null);
  const silverPriceInputRef = useRef<HTMLInputElement>(null);
  const platinumPriceInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState<string>(
    typeof window !== 'undefined' ? localStorage.getItem('currentUsername') || 'User' : 'User');
  const [userRole, setUserRole] = useState<string>('No Role Assigned');

  const [userId, setUserId] = useState<number | null>(
    typeof window !== 'undefined'
      ? Number(localStorage.getItem('currentUserId'))
      : null
  );

  // Fetch userRole from Roles.json only (via API); resolve current user's role from Users API
  const fetchUserRoleFromRoles = async () => {
    try {
      const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('currentUserId') : null;
      if (!currentUserId) {
        setUserRole('No Role Assigned');
        return;
      }
      const id = Number(currentUserId);
      if (!Number.isInteger(id)) {
        setUserRole('No Role Assigned');
        return;
      }
      const [rolesRes, usersRes] = await Promise.all([

        apiClient.get<{ id: number; role: string }[]>('/api/roles'),
        apiClient.get<{ users: { id: number; roles?: { id: number; role: string }[] }[] }>('/api/users', { params: { limit: 1000 } }),
      ]);
      const rolesList = Array.isArray(rolesRes.data) ? rolesRes.data : [];
      const users = usersRes.data?.users ?? [];
      const currentUser = users.find((u: { id: number }) => u.id === id);
      const userRoleName = currentUser?.roles?.[0]?.role;
      if (!userRoleName) {
        setUserRole('No Role Assigned');
        return;
      }
      const roleFromJson = rolesList.find(
        (r: { role: string }) => r.role === userRoleName || r.role?.toLowerCase().trim() === userRoleName.toLowerCase().trim()
      );
      setUserRole(roleFromJson?.role ?? 'No Role Assigned');
    } catch (error) {
      setUserRole('No Role Assigned');
      log.error('Failed to fetch user role:', error);
    }
  };

  // Listen for user info changes (username, userId); role is fetched from Roles.json only
  useEffect(() => {
    const syncUserInfo = () => {
      setUsername(typeof window !== 'undefined' ? localStorage.getItem('currentUsername') || 'User' : 'User');
      setUserId(typeof window !== 'undefined' ? Number(localStorage.getItem('currentUserId')) || null : null);
      fetchUserRoleFromRoles();
    };

    window.addEventListener('storage', syncUserInfo);
    window.addEventListener('userRoleUpdated', syncUserInfo);

    syncUserInfo();

    return () => {
      window.removeEventListener('storage', syncUserInfo);
      window.removeEventListener('userRoleUpdated', syncUserInfo);
    };
  }, []);

  const handleChangePasswordClick = () => {
    setChangePasswordOpen(true);
    handleUserMenuClose();
  };


  // Build full URL for registration.json image paths (logo, profilePicture) - path like "images/logo-1-xxx.png" or already full URL
  const registrationImageUrl = (path: string | undefined): string | null => {
    if (!path || path.startsWith('data:')) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const base = apiClient.defaults.baseURL || API_BASE_URL;
    return `${base}/api/registration-images/${path.replace(/^\//, '')}`;
  };

  /** Profile pics may be stored as paths, data URLs, or absolute URLs (users API / localStorage). */
  const resolveProfilePictureSrc = (raw: string | null | undefined): string | null => {
    if (!raw) return null;
    if (raw.startsWith('data:') || raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    return registrationImageUrl(raw);
  };

  // Fetch company logo/name from settings API (shared for all roles: superadmin, admin, user)
  const fetchCompanySettings = async () => {
    log.info('Fetching company settings...');
    try {
      const res = await apiClient.get<{ success: boolean; data: { companyLogo?: string; companyName?: string } }>(API_ENDPOINTS.SETTINGS_COMPANY);
      const data = res.data?.data;
      log.info('Company settings fetched successfully');
      if (data) {
        if (data.companyName) {
          localStorage.setItem(STORAGE_COMPANY_NAME, data.companyName);
          setCompanyName(data.companyName);
        }
        if (data.companyLogo) {
          localStorage.setItem(STORAGE_COMPANY_LOGO, data.companyLogo);
          if (data.companyLogo.startsWith('data:')) {
            setCompanyLogoUrl(data.companyLogo);
          } else {
            const url = registrationImageUrl(data.companyLogo);
            if (url) setCompanyLogoUrl(url);
          }
        }
      }
    } catch (error) {
      // Settings may not exist yet; keep existing localStorage/state
      log.error('Failed to fetch company settings:', error);
    }
  };

  // Fetch company logo/name and profile. Use central settings first so all roles (superadmin, admin, user) see logo/name; then override with current user's registration if any.
  const fetchLogoFromRegistration = async () => {
    const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('currentUserId') : null;
    try {
      await fetchCompanySettings();
      if (currentUserId) {
        const res = await apiClient.get<{ success: boolean; data: { userId: number; logo?: string; shopName?: string; profilePicture?: string }[] }>('/api/registration');
        const list = res.data?.data ?? [];
        const registration = list[0];
        if (registration?.logo) {
          const url = registrationImageUrl(registration.logo);
          if (url) setCompanyLogoUrl(url);
        }
        if (registration?.shopName) setShopName(registration.shopName);
        const usersRes = await apiClient.get<{ users: any[] }>('/api/users', { params: { limit: 1000 } });
        const users = usersRes.data?.users ?? [];
        const currentUser = users.find((u: any) => u.id === Number(currentUserId));
        const fromApi = resolveProfilePictureSrc(currentUser?.profilePicture);
        setProfileImageUrl(fromApi ?? null);
      } else {
        setShopName('');
      }
    } catch {
      setCompanyLogoUrl(null);
      setShopName('');
      await fetchCompanySettings();
    }
  };

  // Sync profile image (from registration.json profilePicture), company name, and company logo from localStorage / API
  useEffect(() => {
    const syncProfileAndCompany = () => {
      setCompanyName(localStorage.getItem(STORAGE_COMPANY_NAME) || '');
      fetchLogoFromRegistration();
    };
    const syncProfileImageFromStorage = () => {
      setProfileImageUrl(resolveProfilePictureSrc(localStorage.getItem(STORAGE_PROFILE_IMAGE)));
    };
    window.addEventListener('storage', syncProfileAndCompany);
    window.addEventListener('profileOrLogoUpdated', syncProfileAndCompany);
    window.addEventListener('registrationUpdated', syncProfileAndCompany);
    window.addEventListener('profileImageUpdated', syncProfileImageFromStorage);
    syncProfileAndCompany();
    return () => {
      window.removeEventListener('storage', syncProfileAndCompany);
      window.removeEventListener('profileOrLogoUpdated', syncProfileAndCompany);
      window.removeEventListener('registrationUpdated', syncProfileAndCompany);
      window.removeEventListener('profileImageUpdated', syncProfileImageFromStorage);
    };
  }, []);

  // Resolved company display: logo from API or localStorage (base64/path); name from registration or localStorage
  const displayCompanyName = shopName || companyName;
  const storedLogo = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_COMPANY_LOGO) : null;
  const displayLogoUrl = companyLogoUrl || storedLogo || null;

  const open = Boolean(anchorEl);

  // Parse price string to extract numeric value
  const parsePriceValue = (priceString: string): number => {
    if (!priceString) return 0;
    const cleaned = priceString.replace(/₹|,|\/10gm|\/gm/g, '').trim();
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Save prices to localStorage and trigger recalculation
  const savePricesToStorage = (goldPriceValue: number, silverPriceValue: number, platinumPriceValue?: number) => {
    try {
      const prices: any = {
        gold: {
          pricePer10gm: goldPriceValue,
          lastUpdated: new Date().toISOString(),
        },
        silver: {
          pricePer10gm: silverPriceValue,
          lastUpdated: new Date().toISOString(),
        },
      };
      if (platinumPriceValue !== undefined && platinumPriceValue > 0) {
        prices.platinum = {
          pricePer10gm: platinumPriceValue,
          lastUpdated: new Date().toISOString(),
        };
      }
      localStorage.setItem('metalPrices', JSON.stringify(prices));
      window.dispatchEvent(new CustomEvent('metalPricesUpdated', { detail: prices }));
    } catch (error) {
      log.error('Failed to save metal prices to localStorage:', error);
    }
  };

  // Load prices from localStorage on mount, or fetch from API
  useEffect(() => {
    const loadPricesFromStorage = () => {
      try {
        const stored = localStorage.getItem('metalPrices');
        if (stored) {
          const prices = JSON.parse(stored);
          if (prices.gold?.pricePer10gm) {
            setGoldPrice(`₹${Number(prices.gold.pricePer10gm).toLocaleString('en-IN')}/10gm`);
          }
          if (prices.silver?.pricePer10gm) {
            setSilverPrice(`₹${Number(prices.silver.pricePer10gm).toLocaleString('en-IN')}/10gm`);
          }
          if (prices.platinum?.pricePer10gm) {
            setPlatinumPrice(`₹${Number(prices.platinum.pricePer10gm).toLocaleString('en-IN')}/10gm`);
          }
        }
        // Always try to fetch latest prices from API on mount
        fetchMetalPrices();
      } catch (error) {
        log.error('Failed to load metal prices from localStorage:', error);
        // If localStorage fails, try to fetch from API
        fetchMetalPrices();
      }
    };
    loadPricesFromStorage();
  }, []);

  // Listen for refresh event from Dashboard
  useEffect(() => {
    const handleRefreshEvent = () => {
      fetchMetalPrices();
    };

    window.addEventListener('refreshMetalPrices', handleRefreshEvent);
    return () => {
      window.removeEventListener('refreshMetalPrices', handleRefreshEvent);
    };
  }, []);

  // Fetch metal prices via backend (token never sent to client)
  const fetchMetalPrices = async () => {
    setIsRefreshing(true);
    const DEFAULT_GOLD_PRICE = 124650;
    const DEFAULT_SILVER_PRICE = 2410;
    const DEFAULT_PLATINUM_PRICE = 50000;
    let goldPriceValue = parsePriceValue(goldPrice) || DEFAULT_GOLD_PRICE;
    let silverPriceValue = parsePriceValue(silverPrice) || DEFAULT_SILVER_PRICE;
    let platinumPriceValue = parsePriceValue(platinumPrice) || DEFAULT_PLATINUM_PRICE;
    let fetchSuccess = false;

    try {
      const res = await apiClient.get<{
        configured: boolean;
        goldPer10gm: number | null;
        silverPer10gm: number | null;
        platinumPer10gm: number | null;
      }>('/api/config/metal-prices');
      const data = res.data;
      if (data?.configured) {
        if (data.goldPer10gm != null && data.goldPer10gm > 0) {
          goldPriceValue = data.goldPer10gm;
          setGoldPrice(`₹${Number(goldPriceValue).toLocaleString('en-IN')}/10gm`);
          fetchSuccess = true;
        }
        if (data.silverPer10gm != null && data.silverPer10gm > 0) {
          silverPriceValue = data.silverPer10gm;
          setSilverPrice(`₹${Number(silverPriceValue).toLocaleString('en-IN')}/10gm`);
          fetchSuccess = true;
        }
        if (data.platinumPer10gm != null && data.platinumPer10gm > 0) {
          platinumPriceValue = data.platinumPer10gm;
          setPlatinumPrice(`₹${Number(platinumPriceValue).toLocaleString('en-IN')}/10gm`);
          fetchSuccess = true;
        }
      } else {
        setRefreshErrorOpen(true);
      }
    } catch (error) {
      log.warn('Error fetching metal prices. Using fallback.', error);
      setGoldPrice(`₹${Number(goldPriceValue).toLocaleString('en-IN')}/10gm`);
      setSilverPrice(`₹${Number(silverPriceValue).toLocaleString('en-IN')}/10gm`);
      setPlatinumPrice(`₹${Number(platinumPriceValue).toLocaleString('en-IN')}/10gm`);
      setRefreshErrorOpen(true);
    }

    if (goldPriceValue > 0 && silverPriceValue > 0) {
      savePricesToStorage(goldPriceValue, silverPriceValue, platinumPriceValue > 0 ? platinumPriceValue : undefined);
    }
    setIsRefreshing(false);
    return fetchSuccess;
  };

  const handleUserMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = () => {
    setProfileDialogOpen(true);
    handleUserMenuClose();
  };

  const handleProfileDialogClose = () => {
    setProfileDialogOpen(false);
  };

  const handleGoldPriceDoubleClick = () => {
    setEditingGoldPrice(true);
    setTimeout(() => {
      goldPriceInputRef.current?.focus();
      goldPriceInputRef.current?.select();
    }, 0);
  };

  const handleSilverPriceDoubleClick = () => {
    setEditingSilverPrice(true);
    setTimeout(() => {
      silverPriceInputRef.current?.focus();
      silverPriceInputRef.current?.select();
    }, 0);
  };

  const handleGoldPriceChange = (e: ChangeEvent<HTMLInputElement>) => {
    setGoldPrice(e.target.value);
  };

  const handleSilverPriceChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSilverPrice(e.target.value);
  };

  const handleGoldPriceBlur = () => {
    setEditingGoldPrice(false);
    const goldPriceValue = parsePriceValue(goldPrice);
    const silverPriceValue = parsePriceValue(silverPrice);
    const platinumPriceValue = parsePriceValue(platinumPrice);
    if (goldPriceValue > 0 && goldPriceValue < 1000000) {
      savePricesToStorage(goldPriceValue, silverPriceValue, platinumPriceValue);
    }
  };

  const handleSilverPriceBlur = () => {
    setEditingSilverPrice(false);
    const goldPriceValue = parsePriceValue(goldPrice);
    const silverPriceValue = parsePriceValue(silverPrice);
    const platinumPriceValue = parsePriceValue(platinumPrice);
    if (silverPriceValue > 0 && silverPriceValue < 100000) {
      savePricesToStorage(goldPriceValue, silverPriceValue, platinumPriceValue);
    }
  };

  const handleGoldPriceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setEditingGoldPrice(false);
      const goldPriceValue = parsePriceValue(goldPrice);
      const silverPriceValue = parsePriceValue(silverPrice);
      const platinumPriceValue = parsePriceValue(platinumPrice);
      if (goldPriceValue > 0 && goldPriceValue < 1000000) {
        savePricesToStorage(goldPriceValue, silverPriceValue, platinumPriceValue);
      }
    } else if (e.key === 'Escape') {
      setEditingGoldPrice(false);
    }
  };

  const handleSilverPriceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setEditingSilverPrice(false);
      const goldPriceValue = parsePriceValue(goldPrice);
      const silverPriceValue = parsePriceValue(silverPrice);
      const platinumPriceValue = parsePriceValue(platinumPrice);
      if (silverPriceValue > 0 && silverPriceValue < 100000) {
        savePricesToStorage(goldPriceValue, silverPriceValue, platinumPriceValue);
      }
    } else if (e.key === 'Escape') {
      setEditingSilverPrice(false);
    }
  };

  const handlePlatinumPriceDoubleClick = () => {
    setEditingPlatinumPrice(true);
    setTimeout(() => {
      platinumPriceInputRef.current?.focus();
      platinumPriceInputRef.current?.select();
    }, 0);
  };

  const handlePlatinumPriceChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPlatinumPrice(e.target.value);
  };

  const handlePlatinumPriceBlur = () => {
    setEditingPlatinumPrice(false);
    const goldPriceValue = parsePriceValue(goldPrice);
    const silverPriceValue = parsePriceValue(silverPrice);
    const platinumPriceValue = parsePriceValue(platinumPrice);
    if (platinumPriceValue > 0 && platinumPriceValue < 1000000) {
      savePricesToStorage(goldPriceValue, silverPriceValue, platinumPriceValue);
    }
  };

  const handlePlatinumPriceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setEditingPlatinumPrice(false);
      const goldPriceValue = parsePriceValue(goldPrice);
      const silverPriceValue = parsePriceValue(silverPrice);
      const platinumPriceValue = parsePriceValue(platinumPrice);
      if (platinumPriceValue > 0 && platinumPriceValue < 1000000) {
        savePricesToStorage(goldPriceValue, silverPriceValue, platinumPriceValue);
      }
    } else if (e.key === 'Escape') {
      setEditingPlatinumPrice(false);
    }
  };

  const showUploadSnack = (message: string) => {
    setUploadSnackMessage(message);
    setUploadSnackOpen(true);
  };

  const handleProfileImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const result = validateImageFile(file);
    if (!result.valid) {
      showUploadSnack(result.error || 'Invalid file');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const data = reader.result as string;
      localStorage.setItem(STORAGE_PROFILE_IMAGE, data);
      setProfileImageUrl(data);
      window.dispatchEvent(new Event('profileOrLogoUpdated'));
    };
    reader.readAsDataURL(file);
  };

  return (
    <StyledAppBar position="fixed">
      <Toolbar sx={{ minHeight: '80px', px: 4, py: 1 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginRight: '64px',
            transition: 'all 0.3s ease',
          }}
        >
          {displayLogoUrl && (
            <Box
              component="img"
              src={displayLogoUrl}
              alt="Company logo"
              sx={{
                width: 40,
                height: 40,
                objectFit: 'contain',
                flexShrink: 0,
              }}
            />
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {displayCompanyName ? (
              <Typography
                sx={{
                  fontSize: '20px',
                  fontWeight: 700,
                  fontFamily: '"Playfair Display", "Cormorant Garamond", "Georgia", serif',
                  background: `linear-gradient(135deg, ${APP_COLORS.gold} 0%, ${APP_COLORS.goldDark} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  letterSpacing: '1px',
                  lineHeight: 1.2,
                }}
              >
                {displayCompanyName}
              </Typography>
            ) : (
              <>
                <Typography
                  component="div"
                  sx={{
                    fontSize: '28px',
                    fontWeight: 700,
                    fontFamily: '"Playfair Display", "Cormorant Garamond", "Georgia", serif',
                    background: `linear-gradient(135deg, ${APP_COLORS.gold} 0%, ${APP_COLORS.goldDark} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    letterSpacing: '2px',
                    lineHeight: 1.1,
                  }}
                >
                  {displayCompanyName}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                  <Box sx={{ width: '16px', height: '1px', background: `linear-gradient(90deg, transparent 0%, ${APP_COLORS.gold}40 50%, transparent 100%)` }} />
                  <Typography sx={{ fontSize: '9px', fontWeight: 600, fontFamily: '"Inter", "Roboto", sans-serif', color: '#6b7280', letterSpacing: '1.2px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                    {displayCompanyName}
                  </Typography>
                  <Box sx={{ width: '16px', height: '1px', background: `linear-gradient(90deg, transparent 0%, ${APP_COLORS.gold}40 50%, transparent 100%)` }} />
                </Box>
              </>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <PriceBox className="gold">
            <PriceLabel>Current Gold Price</PriceLabel>
            {editingGoldPrice ? (
              <TextField
                inputRef={goldPriceInputRef}
                value={goldPrice}
                onChange={handleGoldPriceChange}
                onBlur={handleGoldPriceBlur}
                onKeyDown={handleGoldPriceKeyDown}
                size="small"
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    padding: '4px 8px',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: APP_COLORS.gold,
                    borderRadius: '8px',
                    '& fieldset': {
                      borderColor: `${APP_COLORS.gold}4D`,
                      borderWidth: '1.5px',
                    },
                    '&:hover fieldset': {
                      borderColor: `${APP_COLORS.gold}80`,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: APP_COLORS.gold,
                      borderWidth: '2px',
                    },
                  },
                  '& .MuiOutlinedInput-input': {
                    padding: '4px 0',
                  },
                }}
                autoFocus
              />
            ) : (
              <PriceValue
                className="gold"
                onDoubleClick={handleGoldPriceDoubleClick}
                sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
              >
                {goldPrice}
              </PriceValue>
            )}
          </PriceBox>

          <PriceBox className="silver">
            <PriceLabel>Current Silver Price</PriceLabel>
            {editingSilverPrice ? (
              <TextField
                inputRef={silverPriceInputRef}
                value={silverPrice}
                onChange={handleSilverPriceChange}
                onBlur={handleSilverPriceBlur}
                onKeyDown={handleSilverPriceKeyDown}
                size="small"
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    padding: '4px 8px',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#4b5563',
                    borderRadius: '8px',
                    '& fieldset': {
                      borderColor: 'rgba(75, 85, 99, 0.3)',
                      borderWidth: '1.5px',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(75, 85, 99, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#4b5563',
                      borderWidth: '2px',
                    },
                  },
                  '& .MuiOutlinedInput-input': {
                    padding: '4px 0',
                  },
                }}
                autoFocus
              />
            ) : (
              <PriceValue
                className="silver"
                onDoubleClick={handleSilverPriceDoubleClick}
                sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
              >
                {silverPrice}
              </PriceValue>
            )}
          </PriceBox>

          <PriceBox className="platinum">
            <PriceLabel>Current Platinum Price</PriceLabel>
            {editingPlatinumPrice ? (
              <TextField
                inputRef={platinumPriceInputRef}
                value={platinumPrice}
                onChange={handlePlatinumPriceChange}
                onBlur={handlePlatinumPriceBlur}
                onKeyDown={handlePlatinumPriceKeyDown}
                size="small"
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    padding: '4px 8px',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#3b82f6',
                    borderRadius: '8px',
                    '& fieldset': {
                      borderColor: 'rgba(59, 130, 246, 0.3)',
                      borderWidth: '1.5px',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(59, 130, 246, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#3b82f6',
                      borderWidth: '2px',
                    },
                  },
                  '& .MuiOutlinedInput-input': {
                    padding: '4px 0',
                  },
                }}
                autoFocus
              />
            ) : (
              <PriceValue
                className="platinum"
                onDoubleClick={handlePlatinumPriceDoubleClick}
                sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
              >
                {platinumPrice}
              </PriceValue>
            )}
          </PriceBox>

          <IconButton
            onClick={fetchMetalPrices}
            disabled={isRefreshing}
            size="medium"
            sx={{
              color: '#6b7280',
              backgroundColor: '#f8f9fa',
              border: '1px solid rgba(0,0,0,0.06)',
              borderRadius: '10px',
              padding: '10px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: '#e5e7eb',
                transform: 'rotate(180deg) scale(1.1)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              },
              '&.Mui-disabled': {
                color: '#9ca3af',
                backgroundColor: '#f3f4f6',
              }
            }}
            title="Refresh metal prices"
          >
            <RefreshIcon
              sx={{
                fontSize: '20px',
                animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': {
                    transform: 'rotate(0deg)',
                  },
                  '100%': {
                    transform: 'rotate(360deg)',
                  },
                },
              }}
            />
          </IconButton>
        </Box>

        <UserSection>
          <input
            ref={profileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            style={{ display: 'none' }}
            onChange={handleProfileImageUpload}
          />
          <UserInfo onClick={handleUserMenuClick}>
            <UserAvatar
              src={profileImageUrl || undefined}
              // onClick={(e) => { e.stopPropagation(); profileInputRef.current?.click(); }}
              sx={{ cursor: 'pointer' }}
              title={`Profile picture - click to upload (JPEG/PNG, max ${PROFILE_LOGO_MAX_SIZE_MB}MB)`}
            >
              {!profileImageUrl && (username ? username.charAt(0).toUpperCase() : 'U')}
            </UserAvatar>
            <UserInfoBox>
              <UserNameText>
                {username}
              </UserNameText>
              {userRole && userRole.trim() !== "" && (

                <UserRoleText>
                  {userRole}
                </UserRoleText>
              )}
            </UserInfoBox>
            <StyledArrowDropDownIcon open={open} />
          </UserInfo>

          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleUserMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            PaperProps={{
              elevation: 0,
              sx: StyledMenuPaper,
            }}
          >
            <StyledMenuItem onClick={handleProfileClick}>
              <ListItemIcon>
                <StyledPersonOutlineIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Profile"
                primaryTypographyProps={MenuItemTypographyProps}
              />
            </StyledMenuItem>

            <StyledMenuItem onClick={handleChangePasswordClick}>
              <ListItemIcon>
                <StyledLockOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Change Password"
                primaryTypographyProps={MenuItemTypographyProps}
              />
            </StyledMenuItem>
          </Menu>

          <LogoutButton
            size="small"
            onClick={onLogout}
          >
            <LogoutIcon />
          </LogoutButton>
        </UserSection>
      </Toolbar>

      <ProfileDialog open={profileDialogOpen} onClose={handleProfileDialogClose} />

      <ChangePasswordDialog
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
        userId={userId ?? 0}
        mode='change'
      />

      <Snackbar
        open={refreshErrorOpen}
        autoHideDuration={5000}
        onClose={() => setRefreshErrorOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setRefreshErrorOpen(false)}
          severity="error"
          variant="filled"
          sx={{ width: '100%' }}
        >
          Please check internet connectivity. Could not fetch latest metal prices.
        </Alert>
      </Snackbar>

      <Snackbar
        open={uploadSnackOpen}
        autoHideDuration={4000}
        onClose={() => setUploadSnackOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setUploadSnackOpen(false)} severity="warning" variant="filled">
          {uploadSnackMessage}
        </Alert>
      </Snackbar>
    </StyledAppBar>
  );
};

export default Header;