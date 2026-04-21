const fs = require('fs');
const path = require('path');
const { Blob } = require('buffer');
const { getDataRoot, dataPath } = require('../paths');
const log = require('../logger');

function walkFiles(dir, rootDir, out = []) {
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      walkFiles(full, rootDir, out);
    } else {
      const rel = path.relative(rootDir, full).replace(/\\/g, '/');
      out.push({ full, rel });
    }
  }
  return out;
}

function getSyncUploadUrl() {
  const raw =
    process.env.SYNC_UPLOAD_URL ||
    process.env.REACT_APP_API_SYNC_UPLOAD_URL ||
    '';
  return String(raw).replace(/\/$/, '');
}

function getSyncToken() {
  return (
    process.env.REACT_APP_SYNC_TOKEN ||
    process.env.SYNC_TOKEN ||
    'dummy-sync-token'
  );
}

function getSyncLogsUrl() {
  const explicit = process.env.SYNC_LOGS_URL || process.env.REACT_APP_API_SYNC_LOGS_URL || '';
  if (explicit) return String(explicit).replace(/\/$/, '');
  const uploadUrl = getSyncUploadUrl();
  if (!uploadUrl) return '';
  return uploadUrl.replace(/\/upload\/folder\/?$/, '/logs');
}

function readSyncLogs() {
  try {
    const SYNC_LOG_FILE = dataPath('DataSync', 'dataSync.json');
    if (!fs.existsSync(SYNC_LOG_FILE)) return [];
    const raw = fs.readFileSync(SYNC_LOG_FILE, 'utf8');
    if (!raw.trim()) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function isSuccessStatus(status) {
  const s = String(status || '').toLowerCase();
  return s === 'success' || s === 'completed';
}

function getRecordTimeMs(record) {
  if (record?.lastDataSyncTime) {
    const ts = new Date(record.lastDataSyncTime).getTime();
    if (!Number.isNaN(ts)) return ts;
  }
  if (record?.date || record?.syncTime) {
    const ts = new Date(`${record.date || ''} ${record.syncTime || ''}`.trim()).getTime();
    if (!Number.isNaN(ts)) return ts;
  }
  return 0;
}

function getLatestDataMTimeMs() {
  const root = getDataRoot();
  const files = walkFiles(root, root).filter((f) => {
    const rel = String(f.rel || '').replace(/\\/g, '/');
    // Exclude sync bookkeeping files, otherwise each sync updates these and keeps canSync=true.
    return !rel.startsWith('DataSync/');
  });
  if (files.length === 0) return 0;
  let max = 0;
  for (const f of files) {
    try {
      const m = fs.statSync(f.full).mtimeMs || 0;
      if (m > max) max = m;
    } catch (_) {
      // ignore unreadable file and continue
    }
  }
  return max;
}

async function getLatestRemoteSuccessSyncTimeMs(customerId) {
  const logsUrl = getSyncLogsUrl();
  if (!logsUrl) return 0;

  try {
    const params = new URLSearchParams();
    if (customerId) params.set('customerId', customerId);
    params.set('limit', '100');
    const url = `${logsUrl}?${params.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-sync-token': getSyncToken(),
      },
    });
    if (!response.ok) return 0;

    const payload = await response.json().catch(() => ({}));
    const logs = Array.isArray(payload?.logs) ? payload.logs : [];
    const successLogs = logs.filter((r) => isSuccessStatus(r?.status));
    if (successLogs.length === 0) return 0;
    return successLogs.reduce((max, r) => Math.max(max, getRecordTimeMs(r)), 0);
  } catch (_) {
    return 0;
  }
}

/**
 * GET /api/data-sync/can-sync?customerId=...
 * Returns whether local data has changed since last successful sync.
 */
async function canSyncLocalData(req, res) {
  try {
    const customerId = req.query?.customerId != null ? String(req.query.customerId).trim() : '';
    const latestDataMTimeMs = getLatestDataMTimeMs();

    if (latestDataMTimeMs === 0) {
      return res.json({
        canSync: false,
        reason: 'No data files found',
        latestDataMTimeMs,
        lastSuccessfulSyncTimeMs: 0,
      });
    }

    // Primary source: remote sync logs (same source used by UI table).
    let lastSuccessfulSyncTimeMs = await getLatestRemoteSuccessSyncTimeMs(customerId);
    // Fallback: local file-based logs if remote logs are unavailable.
    if (lastSuccessfulSyncTimeMs === 0) {
      const logs = readSyncLogs();
      const filtered = customerId
        ? logs.filter((r) => String(r?.customerId || '').trim() === customerId)
        : logs;
      const successLogs = filtered.filter((r) => isSuccessStatus(r?.status));
      lastSuccessfulSyncTimeMs = successLogs.reduce((max, r) => Math.max(max, getRecordTimeMs(r)), 0);
    }
    const canSync = lastSuccessfulSyncTimeMs === 0 || latestDataMTimeMs > lastSuccessfulSyncTimeMs;

    return res.json({
      canSync,
      reason: canSync ? 'Data changed' : 'No changes since last sync',
      latestDataMTimeMs,
      lastSuccessfulSyncTimeMs,
      customerId: customerId || null,
    });
  } catch (error) {
    return res.status(500).json({
      canSync: true,
      reason: 'Eligibility check failed',
      error: error.message,
    });
  }
}

/**
 * POST /api/data-sync/push
 * Reads all files under server/data and POSTs them to the configured sync upload URL
 * (same multipart contract as /sync/upload/folder).
 */
async function pushLocalDataToSync(req, res) {
  log.info('Push Local Data to Sync called...');
  const body = req.body || {};
  const customerIdRaw = body.customerId;
  const customerIdStr =
    typeof customerIdRaw === 'string'
      ? customerIdRaw.trim()
      : customerIdRaw != null && customerIdRaw !== ''
        ? String(customerIdRaw).trim()
        : '';

  const url = getSyncUploadUrl();
  if (!url) {
    return res.status(500).json({
      success: false,
      error:
        'Sync upload URL is not configured. Set REACT_APP_API_SYNC_UPLOAD_URL or SYNC_UPLOAD_URL in .env.',
    });
  }
  const dataRoot = getDataRoot();
  const files = walkFiles(dataRoot, dataRoot);
  if (files.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'No files found under the local data folder.',
    });
  }

  const form = new FormData();
  for (const { full, rel } of files) {
    const buf = fs.readFileSync(full);
    const blob = new Blob([buf]);
    form.append(rel, blob, rel);
  }
  if (customerIdStr) {
    form.append('customerId', customerIdStr);
  }

  const qs = customerIdStr ? `?customerId=${encodeURIComponent(customerIdStr)}` : '';
  const fetchUrl = `${url}${qs}`;

  try {
    const response = await fetch(fetchUrl, {
      method: 'POST',
      headers: {
        'x-sync-token': getSyncToken(),
      },
      body: form,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(response.status >= 400 ? response.status : 500).json({
        success: false,
        error: data.error || `Sync failed with status ${response.status}`,
        remote: data,
      });
    }
    log.info('Push Local Data to Sync completed successfully');
    return res.json(data);
  } catch (err) {
    log.error('Failed to Push Local Data to Sync:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Sync Request Failed',
    });
  }
}

module.exports = { pushLocalDataToSync, canSyncLocalData };
