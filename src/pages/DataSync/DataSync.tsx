import { useEffect, useMemo, useState } from 'react';
import {Box, Chip, CircularProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import { apiClient, getDataSyncEligibility, getSyncLogs, pushLocalDataSync } from '../../api';
import { PageLayout } from '../../components/PageLayout';
import { EmptyState } from '../../components/EmptyState';
import { getStatusColor } from '../../constants/common';
import { APP_COLORS } from '../../constants/colors';
import { SyncLog } from '../../models/DataSync';
import { useNotification } from '../../services/notificationService';
import AddProductButton from '../../components/Button/Button';
import log from '../../utils/logger';

/** Use the registration row for the logged-in user; avoid list[0] when multiple shops exist. */
function pickRegistrationCustomerId(registrations: unknown[]): string {
  if (!Array.isArray(registrations) || registrations.length === 0) return '';

  const uidRaw = typeof window !== 'undefined' ? localStorage.getItem('currentUserId') : null;
  const uid = uidRaw != null && uidRaw !== '' ? Number(uidRaw) : NaN;

  if (Number.isFinite(uid)) {
    const match = registrations.find(
      (r) =>
        r &&
        typeof r === 'object' &&
        Number((r as { userId?: number }).userId) === uid &&
        String((r as { customerId?: string }).customerId || '').trim()
    ) as { customerId?: string } | undefined;
    if (match?.customerId) return String(match.customerId).trim();
  }

  if (registrations.length === 1) {
    const only = registrations[0] as { customerId?: string };
    const cid = String(only?.customerId || '').trim();
    if (cid) return cid;
  }

  const withCid = registrations.filter(
    (r) => r && typeof r === 'object' && String((r as { customerId?: string }).customerId || '').trim()
  );
  if (withCid.length === 0) return '';
  const last = withCid[withCid.length - 1] as { customerId?: string };
  return String(last.customerId || '').trim();
}

const loadSyncLogs = async (customerId?: string): Promise<SyncLog[]> => {
  const { logs } = await getSyncLogs({ customerId });
  return (logs || []) as SyncLog[];
};

const formatDateTime = (iso: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
};

const DURATION_UNIT_LABEL: Record<string, string> = {
  ms: 'ms',
  s: 's',
  min: 'min',
  minute: 'min',
  minutes: 'min',
};

const formatDurationWithUnit = (record: SyncLog): string => {
  const value = record.syncDuration ?? '';
  const unit = record.syncDurationUnit?.toLowerCase();
  const label = unit && DURATION_UNIT_LABEL[unit] ? DURATION_UNIT_LABEL[unit] : 'ms';
  return value ? `${value} ${label}` : '—';
};

export default function DataSync() {
  const { showSuccess, showError } = useNotification();
  const [syncRecords, setSyncRecords] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [customerIdLoaded, setCustomerIdLoaded] = useState(false);
  const [canSync, setCanSync] = useState(true);
  const [canSyncReason, setCanSyncReason] = useState('');

  const refreshSyncRecords = async () => {
    log.info("CALLING SYNC LOGS API"); 
    try {
      setLoading(true);
      const logs = await loadSyncLogs(customerId || undefined);
      setSyncRecords(Array.isArray(logs) ? logs : []);
      log.info("Logs Received:", logs);
    } catch (error) {
      log.error('Error loading sync logs:', error);
      setSyncRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshSyncEligibility = async () => {
    try {
      const result = await getDataSyncEligibility({ customerId: customerId || undefined });
      setCanSync(Boolean(result?.canSync));
      setCanSyncReason(result?.reason || '');
    } catch (error) {
      log.error('Error checking sync eligibility:', error);
      // Fail-open so users are not blocked when eligibility endpoint has issues.
      setCanSync(true);
      setCanSyncReason('');
    }
  };

  useEffect(() => {
    const loadCustomerId = async () => {
      try {
        const res = await apiClient.get('/api/registration');
        const list = res?.data?.data;
        const cid = pickRegistrationCustomerId(Array.isArray(list) ? list : []);
        if (cid) setCustomerId(cid);
      } catch (error) {
        log.error('Error loading customer ID:', error);
        // Keep empty; logs call will fall back without customerId
      } finally {
        setCustomerIdLoaded(true);
      }
    };
    loadCustomerId();
  }, []);

  useEffect(() => {
    if (!customerIdLoaded) return;
    refreshSyncRecords();
    refreshSyncEligibility();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerIdLoaded, customerId]);

  const handleDataSync = async () => {
    setSyncing(true);
    try {
      const result = await pushLocalDataSync({ customerId: customerId || undefined });
      const msg =
        result.filesWritten != null
          ? `Synced ${result.filesWritten} file(s) in ${result.timeToTakeMs ?? 0}ms.`
          : 'Data sync completed successfully.';

      showSuccess(msg);
      await refreshSyncRecords();
      await refreshSyncEligibility();
    } catch (err) {
      log.error('Error syncing data:', err);
      showError(err instanceof Error ? err.message : 'Data sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const sortedSyncRecords = useMemo(() => {
    if (!syncRecords?.length) return [];
    return [...syncRecords].sort(
      (a, b) => new Date(b.lastDataSyncTime).getTime() - new Date(a.lastDataSyncTime).getTime()
    );
  }, [syncRecords]);

  return (
    <PageLayout
      title="Data Sync"
      icon={<SyncIcon sx={{ fontSize: 26 }} />}
      headerRight={
        <AddProductButton
          startIcon={syncing ? <CircularProgress size={16} color="inherit" /> : <SyncIcon />}
          onClick={handleDataSync}
          disabled={syncing || !canSync}
          sx={
            !canSync
              ? {
                  backgroundColor: '#e0e0e0 !important',
                  color: '#000000 !important',
                  '& .MuiButton-startIcon': { color: '#000000 !important' },
                }
              : undefined
          }
        >
          {syncing ? 'Syncing...' : !canSync ? 'No changes' : 'Data sync'}
        </AddProductButton>
      }
    >
      {!canSync && canSyncReason ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {canSyncReason}
        </Typography>
      ) : null}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <CircularProgress />
        </Box>
      ) : syncRecords.length === 0 ? (
        <EmptyState
          title="No sync records"
          message="No sync records found. Data sync history will appear here."
        />
      ) : (
        <TableContainer
          component={Paper}
          sx={{
            borderRadius: 2,
            border: '1px solid rgba(89, 12, 22, 0.2)',
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    backgroundColor: '#fafafa',
                    color: APP_COLORS.themePrimary,
                    fontSize: '13px',
                    padding: '14px 16px',
                    borderBottom: '2px solid #e0e0e0',
                  }}
                >
                  S.No.
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    backgroundColor: '#fafafa',
                    color: APP_COLORS.themePrimary,
                    fontSize: '13px',
                    padding: '14px 16px',
                    borderBottom: '2px solid #e0e0e0',
                  }}
                >
                  Customer ID
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    backgroundColor: '#fafafa',
                    color: APP_COLORS.themePrimary,
                    fontSize: '13px',
                    padding: '14px 16px',
                    borderBottom: '2px solid #e0e0e0',
                  }}
                >
                  Last Sync Time
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    backgroundColor: '#fafafa',
                    color: APP_COLORS.themePrimary,
                    fontSize: '13px',
                    padding: '14px 16px',
                    borderBottom: '2px solid #e0e0e0',
                  }}
                >
                  Duration (ms)
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    backgroundColor: '#fafafa',
                    color: APP_COLORS.themePrimary,
                    fontSize: '13px',
                    padding: '14px 16px',
                    borderBottom: '2px solid #e0e0e0',
                  }}
                >
                  Status
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedSyncRecords.map((record, index) => {
                const statusColors = getStatusColor(record.status);
                return (
                  <TableRow key={record.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{record.customerId}</TableCell>
                    <TableCell>{formatDateTime(record.lastDataSyncTime)}</TableCell>
                    <TableCell>{formatDurationWithUnit(record)}</TableCell>
                    <TableCell>
                      <Chip
                        label={record.status}
                        size="small"
                        sx={{
                          backgroundColor: statusColors.bg,
                          color: statusColors.color,
                          fontWeight: 500,
                          fontSize: '12px',
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </PageLayout>
  );
}