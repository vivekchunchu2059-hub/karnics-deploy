const fs = require('fs');
const path = require('path');
const { dataPath } = require('../paths');
const log = require('../logger');

const companyFilePath = () => dataPath('settings', 'company.json');

const ensureFile = (filePath, defaultContent = '{}') => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, defaultContent, 'utf8');
  }
};

const readCompanySettings = () => {
  const fp = companyFilePath();
  ensureFile(fp);
  const raw = fs.readFileSync(fp, 'utf8');
  return raw.trim() ? JSON.parse(raw) : {};
};

const writeCompanySettings = (data) => {
  const fp = companyFilePath();
  ensureFile(fp);
  fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
};

/**
 * GET /api/settings/company
 * Returns stored company logo (base64) and company name.
 */
const getCompanySettings = (req, res) => {
  log.info('Get Company Settings called...');
  try {
    const data = readCompanySettings();
    log.info('Company settings fetched successfully');
    return res.status(200).json({
      success: true,
      data: {
        companyLogo: data.companyLogo || null,
        companyName: data.companyName || '',
      },
    });
  } catch (error) {
    log.error('Failed to Get Company Settings:', error);
    return res.status(500).json({
      error: 'Failed to Get Company Settings',
      details: error.message,
    });
  }
};

/**
 * PUT /api/settings/company
 * Body: { companyLogo?: string, companyName?: string }
 * Stores company logo (base64) and/or company name.
 */
const putCompanySettings = (req, res) => {
  log.info('Save Company Settings called...');
    try {
    const payload = req.body || {};
    const current = readCompanySettings();
    const updated = {
      companyLogo: payload.companyLogo !== undefined ? payload.companyLogo : current.companyLogo,
      companyName: payload.companyName !== undefined ? payload.companyName : current.companyName,
    };
    writeCompanySettings(updated);
    log.info('Company settings saved successfully');
    return res.status(200).json({
      success: true,
      message: 'Company settings saved',
      data: updated,
    });
  } catch (error) {
    log.error('Failed to Save Company Settings:', error);
    return res.status(500).json({
      error: 'Failed to Save Company Settings',
      details: error.message,
    });
  }
};

module.exports = {
  getCompanySettings,
  putCompanySettings,
};
