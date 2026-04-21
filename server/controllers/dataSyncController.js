const fs = require('fs');
const path = require('path');
const { dataPath } = require('../paths');
const log = require('../logger');

const dataSyncFilePath = () => dataPath('DataSync', 'dataSync.json');

const ensureDataSyncFile = () => {
  const fp = dataSyncFilePath();
  const dir = path.dirname(fp);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(fp)) {
    fs.writeFileSync(fp, '[]', 'utf8');
  }
};

const readDataSyncFile = () => {
  ensureDataSyncFile();

  const raw = fs.readFileSync(dataSyncFilePath(), 'utf8');
  if (!raw.trim()) {
    return [];
  }

  return JSON.parse(raw);
};

const writeDataSyncFile = (dataSyncData) => {
  ensureDataSyncFile();
  fs.writeFileSync(dataSyncFilePath(), JSON.stringify(dataSyncData, null, 2), 'utf8');
};

const getDataSync = (req, res) => {
  log.info('Get Data Sync called...');
  try {
    const dataSync = readDataSyncFile();
    log.info('Data Sync fetched successfully');
    return res.json(dataSync);
  } catch (error) {
    log.error('Failed to Fetch Data Sync:', error);
    return res.status(500).json({
      error: 'Failed to Fetch Data Sync',
      details: error.message,
    });
  }
};

const toSortableTime = (record) => {
  if (record?.lastDataSyncTime) {
    const ts = new Date(record.lastDataSyncTime).getTime();
    if (!Number.isNaN(ts)) return ts;
  }

  // Backward compatibility for older log shape: { date, syncTime }
  if (record?.date || record?.syncTime) {
    const joined = `${record.date || ''} ${record.syncTime || ''}`.trim();
    const ts = new Date(joined).getTime();
    if (!Number.isNaN(ts)) return ts;
  }

  // Final fallback keeps higher IDs first
  return Number(record?.id) || 0;
};

/**
 * GET /sync/logs
 * Query params:
 *  - customerId (optional)
 *  - id (optional)
 *  - limit (optional, default 20)
 * Response: { logs, count }
 */
const getSyncLogs = (req, res) => {
  try {
    const raw = readDataSyncFile();
    const allLogs = Array.isArray(raw) ? raw : [];

    const customerId = req.query?.customerId != null ? String(req.query.customerId).trim() : '';
    const id = req.query?.id != null ? String(req.query.id).trim() : '';
    const limitRaw = Number(req.query?.limit);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.floor(limitRaw) : 20;

    let logs = [...allLogs];

    if (customerId) {
      logs = logs.filter((log) => String(log?.customerId || '').trim() === customerId);
    }

    if (id) {
      logs = logs.filter((log) => String(log?.id) === id);
    }

    logs.sort((a, b) => toSortableTime(b) - toSortableTime(a));

    if (!id) {
      logs = logs.slice(0, limit);
    }

    return res.json({
      logs,
      count: logs.length,
    });
  } catch (error) {
    log.error('Error reading sync logs:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to read sync logs',
      details: error.message,
    });
  }
};

const saveDataSync = (req, res) => {
  log.info('Save Data Sync called...');
  try {
    const dataSyncData = req.body;

    if (!Array.isArray(dataSyncData)) {
      return res.status(400).json({
        error: 'Invalid payload: expected an array of dataSync records',
      });
    }

    writeDataSyncFile(dataSyncData);
    log.info('Data Sync saved successfully'); 
    return res.json({
      success: true,
      message: 'DataSync data saved successfully',
      count: dataSyncData.length,
    });
  } catch (error) {
    log.error('Failed to Save Data Sync:', error);
    return res.status(500).json({
      error: 'Failed to write dataSync data',
      details: error.message,
    });
  }
};

const addSyncRecord = (record) => {
  const data = readDataSyncFile();
  data.push(record);
  writeDataSyncFile(data);
};

module.exports = {
  getDataSync,
  getSyncLogs,
  saveDataSync,
  addSyncRecord,

};
