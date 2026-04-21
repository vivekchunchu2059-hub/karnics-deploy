import axios from 'axios';
import log from './utils/logger';

export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL;

/** Filled by loadRuntimeConfig() from /api/config/env (launcher .exe reads .env at startup). */
export const runtimePublicConfig: Record<string, string> = {};

export function getRuntimePublicEnv(key: string): string | undefined {
  const rt = runtimePublicConfig[key];
  if (rt !== undefined && rt !== '') return rt;
  const bt = process.env[key];
  if (typeof bt === 'string' && bt !== '') return bt;
  return undefined;
}

/**
 * Headers for direct browser calls to REACT_APP_API_CUSTOMER_SERVICE_URL,
 * REACT_APP_API_SYNC_LOGS_URL, etc. Uses REACT_APP_SYNC_TOKEN only (x-sync-token).
 */
export function getSyncServiceHeaders(
  base: Record<string, string> = {}
): Record<string, string> {
  const headers = { ...base };
  const syncToken = getRuntimePublicEnv('REACT_APP_SYNC_TOKEN')?.trim();
  if (syncToken) {
    headers['x-sync-token'] = syncToken;
  }
  return headers;
}

export const AUTH_TOKEN_KEY = 'authToken';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT to every request; clear token and notify on 401
apiClient.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userRole');
        localStorage.removeItem('currentUserRole');
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }
    }
    return Promise.reject(error);
  }
);

/** Resolved at call time so desktop .exe runtime .env applies after loadRuntimeConfig. */
export function getSyncUploadUrl(): string {
  const u = getRuntimePublicEnv('REACT_APP_API_SYNC_UPLOAD_URL');
  if (u) return u;
  const base = apiClient.defaults.baseURL || API_BASE_URL || '';
  return `${String(base).replace(/\/$/, '')}/sync/upload/folder`;
}

export function getSyncLogsUrl(): string {
  const u = getRuntimePublicEnv('REACT_APP_API_SYNC_LOGS_URL');
  if (u) return u;
  const upload = getRuntimePublicEnv('REACT_APP_API_SYNC_UPLOAD_URL');
  if (upload) return upload.replace(/\/upload\/folder\/?$/, '/logs');
  const base = apiClient.defaults.baseURL || API_BASE_URL || '';
  return `${String(base).replace(/\/$/, '')}/sync/logs`;
}

/** @deprecated Use getSyncUploadUrl() for runtime .env support */
export const SYNC_UPLOAD_URL =
  process.env.REACT_APP_API_SYNC_UPLOAD_URL || `${API_BASE_URL}/sync/upload/folder`;

/** @deprecated Use getSyncLogsUrl() for runtime .env support */
export const SYNC_LOGS_URL =
  process.env.REACT_APP_API_SYNC_LOGS_URL ||
  (process.env.REACT_APP_API_SYNC_UPLOAD_URL
    ? process.env.REACT_APP_API_SYNC_UPLOAD_URL.replace(/\/upload\/folder\/?$/, '/logs')
    : `${API_BASE_URL}/sync/logs`);

/**
 * Fetch sync logs for the Data Sync UI.
 * Uses JWT-backed `/api/data-sync/logs` so packaged/production builds work without `x-sync-token`.
 * Falls back to `/sync/logs` + sync token when explicitly configured (remote sync service).
 */
export async function getSyncLogs(options?: {
  customerId?: string;
  id?: string | number;
  limit?: number;
}): Promise<{ logs: unknown[]; count: number }> {
  const customerIdTrimmed = options?.customerId?.trim() || '';

  const params: Record<string, string> = {};
  if (customerIdTrimmed) params.customerId = customerIdTrimmed;
  if (options?.id != null && String(options.id).trim()) params.id = String(options.id).trim();
  if (options?.limit != null && Number.isFinite(options.limit) && options.limit > 0) {
    params.limit = String(Math.floor(options.limit));
  }

  const fetchViaApiClient = async (p: Record<string, string>) => {
    const response = await apiClient.get<{ logs?: unknown[]; count?: number }>('/api/data-sync/logs', {
      params: p,
    });
    return response.data;
  };

  const fetchViaSyncService = async (p: Record<string, string>) => {
    const headers = getSyncServiceHeaders({ 'Content-Type': 'application/json' });
    const baseLogs = getSyncLogsUrl();
    const searchParams = new URLSearchParams();
    Object.entries(p).forEach(([k, v]) => {
      if (v !== undefined && v !== '') searchParams.set(k, v);
    });
    const q = searchParams.toString();
    const url = `${q ? `${baseLogs}?${q}` : baseLogs}${q ? '&' : '?'}t=${Date.now()}`;
    const response = await axios.get<{ logs?: unknown[]; count?: number }>(url, { headers });
    return response.data;
  };

  const useRemoteSyncLogsOnly =
    Boolean(getRuntimePublicEnv('REACT_APP_API_SYNC_LOGS_URL')?.trim()) ||
    Boolean(getRuntimePublicEnv('REACT_APP_API_SYNC_UPLOAD_URL')?.trim());

  let data: { logs?: unknown[]; count?: number };
  try {
    if (useRemoteSyncLogsOnly) {
      data = await fetchViaSyncService(params);
    } else {
      data = await fetchViaApiClient(params);
    }
  } catch (e) {
    log.error('Sync logs request failed:', e);
    throw e;
  }

  let logs = Array.isArray(data?.logs) ? data.logs : [];

  // When customerId filter returns nothing, retry without it and filter client-side (registration vs log ids).
  if (customerIdTrimmed && logs.length === 0 && !options?.id) {
    const broad = { limit: '100' };
    try {
      const broadData = useRemoteSyncLogsOnly
        ? await fetchViaSyncService(broad)
        : await fetchViaApiClient(broad);
      const all = Array.isArray(broadData?.logs) ? broadData.logs : [];
      logs = all.filter((row: unknown) => {
        if (!row || typeof row !== 'object') return false;
        const cid = String((row as { customerId?: string }).customerId || '').trim();
        return cid === customerIdTrimmed;
      });
      data = { ...broadData, logs };
    } catch (e) {
      log.warn('Sync logs broad fetch skipped:', e);
    }
  }

  log.info('Sync Logs Response:', { count: logs.length, sample: logs[0] });
  return { logs, count: logs.length };
}

export interface UploadFolderResponse {
  success: boolean;
  filesWritten?: number;
  dataDir?: string;
  paths?: string[];
  timeToTakeMs?: number;
  status?: string;
  syncLogRecorded?: boolean;
  error?: string;
}

export interface DataSyncEligibilityResponse {
  canSync: boolean;
  reason?: string;
}

export async function getDataSyncEligibility(options?: {
  customerId?: string;
}): Promise<DataSyncEligibilityResponse> {
  const response = await apiClient.get<DataSyncEligibilityResponse>('/api/data-sync/can-sync', {
    params: {
      customerId: options?.customerId?.trim() || undefined,
    },
  });
  return response.data;
}

/**
 * Push local server/data to the sync server (multipart upload). Server reads disk and calls the same sync URL as before.
 */
export async function pushLocalDataSync(options?: {
  customerId?: string;
}): Promise<UploadFolderResponse> {
  try {
    const response = await apiClient.post<UploadFolderResponse>('/api/data-sync/push', {
      customerId: options?.customerId?.trim() || undefined,
    });
    const data = response.data;
    if (data && !data.success) {
      throw new Error(data.error || 'Data sync failed');
    }
    return data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response?.data && typeof err.response.data === 'object') {
      const d = err.response.data as { error?: string };
      if (d.error) throw new Error(d.error);
    }
    throw err instanceof Error ? err : new Error('Data sync failed');
  }
}

// Load runtime configuration from the server
// This allows the .exe to read config from .env file at runtime
export const loadRuntimeConfig = async (): Promise<void> => {
  const candidates: string[] = [];
  if (API_BASE_URL) {
    candidates.push(String(API_BASE_URL).replace(/\/$/, ''));
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname || 'localhost';
    candidates.push(`http://${host}:3001`);
    candidates.push('http://127.0.0.1:3001');
    candidates.push('http://localhost:3001');
  }
  const uniqueBases = Array.from(new Set(candidates.filter(Boolean)));

  for (const base of uniqueBases) {
    try {
      log.info('Loading runtime config from base');
      const tempClient = axios.create({
        baseURL: base,
        timeout: 5000,
      });
      const response = await tempClient.get('/api/config/env');
      const data = response.data || {};
      log.info('Runtime config loaded successfully');
      if (data.REACT_APP_API_BASE_URL) {
        apiClient.defaults.baseURL = data.REACT_APP_API_BASE_URL;
        Object.keys(data).forEach((k) => {
          const v = data[k];
          if (v !== undefined && v !== null && String(v).trim() !== '') {
            runtimePublicConfig[k] = String(v);
          }
        });
        return;
      }
    } catch {
      // try next candidate (e.g. web on :3000 has no /api/config/env)
    }
  }

  if (typeof window !== 'undefined') {
    const fallback = `http://${window.location.hostname || 'localhost'}:3001`;
    if (!apiClient.defaults.baseURL) {
      apiClient.defaults.baseURL = fallback;
    }
    log.error('Failed to load runtime config from /api/config/env; API base:', apiClient.defaults.baseURL || fallback);
  }
};