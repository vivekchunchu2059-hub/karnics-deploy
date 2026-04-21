/** Duration unit from API (optional). */
export type SyncDurationUnit = 'ms' | 's' | 'min' | 'minute' | 'minutes';

/** Sync log entry from GET /sync/logs (logs array item). */
export interface SyncLog {
  id: number;
  customerId: string;
  lastDataSyncTime: string;
  syncDuration: string;
  /** Optional: 'ms' | 's' | 'min' | 'minute' | 'minutes'. If omitted, displayed as "ms". */
  syncDurationUnit?: SyncDurationUnit;
  status: string;
}

/** Response shape from GET /sync/logs */
export interface SyncLogsResponse {
  logs: SyncLog[];
  count: number;
}

/** @deprecated Use SyncLog for /sync/logs API */
export interface SyncRecord {
  id: number;
  date: string;
  customerId: string;
  syncTime: string;
  status: 'Success' | 'Failed' | 'Pending';
}