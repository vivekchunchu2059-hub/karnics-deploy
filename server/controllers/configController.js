const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { getMetalsConfigPath } = require('../paths');
const log = require('../logger');

const metalsPath = () => getMetalsConfigPath();
const defaultMetalsPath = () => path.join(__dirname, '..', 'config', 'metals.json');

const seedMetalsFromDefault = (targetPath) => {
  try {
    const src = defaultMetalsPath();
    if (!fs.existsSync(src)) return false;
    const raw = fs.readFileSync(src, 'utf8');
    if (!raw.trim()) return false;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return false;
    fs.writeFileSync(targetPath, JSON.stringify(parsed, null, 2), 'utf8');
    return true;
  } catch {
    return false;
  }
};

// Gold API: use server-side env only (never REACT_APP_* in client)
const GOLD_API_BASE = process.env.GOLD_API_BASE_URL || process.env.REACT_APP_GOLD_API_BASE_URL || '';
const GOLD_API_TOKEN = process.env.GOLD_API_ACCESS_TOKEN || process.env.REACT_APP_GOLD_API_ACCESS_TOKEN || '';

const ensureConfigFile = () => {
  const mp = metalsPath();
  const dir = path.dirname(mp);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(mp)) {
    if (!seedMetalsFromDefault(mp)) {
      fs.writeFileSync(mp, '[]', 'utf8');
    }
  }
};

const getMetals = (req, res) => {
  log.info('Get Metals called...');
  try {
    ensureConfigFile();
    const mp = metalsPath();
    const raw = fs.readFileSync(mp, 'utf8');
    let metals = raw.trim() ? JSON.parse(raw) : [];

    if (Array.isArray(metals) && metals.length === 0) {
      if (seedMetalsFromDefault(mp)) {
        const seededRaw = fs.readFileSync(mp, 'utf8');
        metals = seededRaw.trim() ? JSON.parse(seededRaw) : [];
      }
    }

    log.info('Metals fetched successfully');
    return res.json(metals);
  } catch (error) {
    log.error('Failed to read Metals:', error);
    return res.status(500).json({
      error: 'Failed to read metals config',
      details: error.message,
    });
  }
};

/**
 * Returns runtime env for the client (matches launcher.js /api/config/env).
 * Used by loadRuntimeConfig() — same shape for `npm start` + server and for .exe + .env.
 */
const getEnv = (req, res) => {
  log.info('Get Env called...');
  try {
    const apiPort = parseInt(process.env.API_PORT, 10) || 3001;
    const webPort = parseInt(process.env.WEB_PORT, 10) || 3000;
    const baseUrl =
      process.env.REACT_APP_API_BASE_URL || process.env.API_BASE_URL || '';
    const resolved =
      !baseUrl || baseUrl.includes('${')
        ? `http://localhost:${apiPort}`
        : baseUrl;

    const payload = {
      REACT_APP_API_BASE_URL: resolved,
      API_BASE_URL: resolved,
      API_PORT: apiPort,
      WEB_PORT: webPort,
      APP_NAME: process.env.APP_NAME || 'Jewellery Management System',
      APP_VERSION: process.env.APP_VERSION || '0.1.0',
    };

    const passthroughKeys = [
      'REACT_APP_API_CUSTOMER_SERVICE_URL',
      'REACT_APP_API_SYNC_UPLOAD_URL',
      'REACT_APP_API_SYNC_LOGS_URL',
      'REACT_APP_COMPANY_URL',
      'REACT_APP_GOLD_API_BASE_URL',
      'REACT_APP_GOLD_API_ACCESS_TOKEN',
      'REACT_APP_SYNC_TOKEN',
    ];
    passthroughKeys.forEach((k) => {
      if (process.env[k] != null && String(process.env[k]).trim() !== '') {
        payload[k] = process.env[k];
      }
    });
    Object.keys(process.env).forEach((k) => {
      if (k.startsWith('REACT_APP_') && payload[k] === undefined) {
        payload[k] = process.env[k];
      }
    });

    // Packaged .exe: Data sync UI must hit this API (port API_PORT), not a separate dev-only sync host.
    if (process.env.APP_DISTRIBUTION_EXE === '1') {
      const apiBase = String(resolved).replace(/\/$/, '');
      payload.REACT_APP_API_SYNC_UPLOAD_URL = `${apiBase}/sync/upload/folder`;
      payload.REACT_APP_API_SYNC_LOGS_URL = `${apiBase}/sync/logs`;
    }

    log.info('Env fetched successfully');
    res.json(payload);
  } catch (error) {
    log.error('Failed to read Env:', error);
    res.status(500).json({
      error: 'Failed to read env config',
      details: error.message,
    });
  }
};

/**
 * Fetches live metal prices from GoldAPI.io server-side (token never sent to client).
 * Returns { goldPer10gm, silverPer10gm, platinumPer10gm } or error.
 */
const fetchJson = (url, token) => {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, {
      headers: { 'x-access-token': token, 'Content-Type': 'application/json' },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data || '{}'));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
  });
};

const getMetalPrices = async (req, res) => {
  log.info('Get Metal Prices called...');
  try {
    if (!GOLD_API_BASE || !GOLD_API_TOKEN) {
      return res.status(200).json({
        configured: false,
        goldPer10gm: null,
        silverPer10gm: null,
        platinumPer10gm: null,
      });
    }
    const base = GOLD_API_BASE.replace(/\/$/, '');
    const [goldData, silverData, platinumData] = await Promise.all([
      fetchJson(`${base}/XAU/INR`, GOLD_API_TOKEN),
      fetchJson(`${base}/XAG/INR`, GOLD_API_TOKEN),
      fetchJson(`${base}/XPT/INR`, GOLD_API_TOKEN),
    ]);
    const toPer10gm = (raw) => {
      if (!raw || raw.error) return null;
      const perGram = raw.price_gram_24k ?? raw.price;
      return perGram != null ? parseFloat((Number(perGram) * 10).toFixed(2)) : null;
    };
    res.json({
      configured: true,
      goldPer10gm: toPer10gm(goldData),
      silverPer10gm: toPer10gm(silverData),
      platinumPer10gm: toPer10gm(platinumData),
    });
    log.info('Metal Prices fetched successfully');
  } catch (error) {
    log.error('Failed to fetch Metal Prices:', error);
    res.status(500).json({
      error: 'Failed to fetch Metal Prices',
      details: error.message,
    });
  }
};

module.exports = {
  getMetals,
  getEnv,
  getMetalPrices,
};
