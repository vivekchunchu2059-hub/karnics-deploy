import React, { createContext, useCallback, useContext, useState } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';

export type NotificationSeverity = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  message: string;
  severity: NotificationSeverity;
  duration?: number;
  createdAt: number;
}

interface NotificationContextValue {
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

/** For non-React code (e.g. utils): set by NotificationProvider on mount. */
let globalNotifier: NotificationContextValue | null = null;
export function setGlobalNotifier(notifier: NotificationContextValue | null) {
  globalNotifier = notifier;
}
export function getGlobalNotifier(): NotificationContextValue | null {
  return globalNotifier;
}

const SIDEBAR_ACCENT = 'rgba(89, 12, 22, 1)';
const SIDEBAR_DARK = '#2C0B2A';

const severityConfig = {
  success: {
    bg: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)',
    icon: CheckCircleIcon,
    borderLeft: '#43a047',
  },
  error: {
    bg: 'linear-gradient(135deg, #b71c1c 0%, #c62828 100%)',
    icon: ErrorIcon,
    borderLeft: '#e53935',
  },
  warning: {
    bg: 'linear-gradient(135deg, #e65100 0%, #f57c00 100%)',
    icon: WarningIcon,
    borderLeft: '#ff9800',
  },
  info: {
    bg: `linear-gradient(135deg, ${SIDEBAR_DARK} 0%, ${SIDEBAR_ACCENT} 100%)`,
    icon: InfoIcon,
    borderLeft: SIDEBAR_ACCENT,
  },
};

let idCounter = 0;
const generateId = () => `notif-${Date.now()}-${++idCounter}`;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addNotification = useCallback(
    (message: string, severity: NotificationSeverity, duration = 4000) => {
      const id = generateId();
      const notification: Notification = { id, message, severity, duration, createdAt: Date.now() };
      setNotifications((prev) => [...prev.slice(-4), notification]); // keep max 5

      if (duration > 0) {
        setTimeout(() => removeNotification(id), duration);
      }
    },
    [removeNotification]
  );

  const showSuccess = useCallback((message: string, duration?: number) => {
    addNotification(message, 'success', duration ?? 4000);
  }, [addNotification]);

  const showError = useCallback((message: string, duration?: number) => {
    addNotification(message, 'error', duration ?? 5000);
  }, [addNotification]);

  const showWarning = useCallback((message: string, duration?: number) => {
    addNotification(message, 'warning', duration ?? 4500);
  }, [addNotification]);

  const showInfo = useCallback((message: string, duration?: number) => {
    addNotification(message, 'info', duration ?? 4000);
  }, [addNotification]);

  const api = { showSuccess, showError, showWarning, showInfo, removeNotification };
  React.useEffect(() => {
    setGlobalNotifier(api);
    return () => setGlobalNotifier(null);
  }, [showSuccess, showError, showWarning, showInfo, removeNotification]);

  return (
    <NotificationContext.Provider value={api}>
      {children}
      <Box
        sx={{
          position: 'fixed',
          top: 80,
          right: 24,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          maxWidth: 380,
          pointerEvents: 'none',
        }}
      >
        {notifications.map((n) => {
          const config = severityConfig[n.severity];
          const Icon = config.icon;
          return (
            <Box
              key={n.id}
              sx={{
                pointerEvents: 'auto',
                background: config.bg,
                color: '#fff',
                borderRadius: '10px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                borderLeft: `4px solid ${config.borderLeft}`,
                overflow: 'hidden',
                animation: 'slideIn 0.3s ease',
                '@keyframes slideIn': {
                  from: { transform: 'translateX(100%)', opacity: 0 },
                  to: { transform: 'translateX(0)', opacity: 1 },
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 1.5, pr: 0.5 }}>
                <Icon sx={{ fontSize: 22, mt: 0.25, flexShrink: 0 }} />
                <Typography sx={{ flex: 1, fontSize: '14px', fontWeight: 500, lineHeight: 1.4 }}>
                  {n.message}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => removeNotification(n.id)}
                  sx={{ color: 'rgba(255,255,255,0.9)', p: 0.25, '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          );
        })}
      </Box>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return ctx;
}
