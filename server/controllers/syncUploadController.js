const fs = require('fs');
const path = require('path');
const { addSyncRecord } = require('./dataSyncController');
const { getDataRoot } = require('../paths');
const log = require('../logger');
/**
 * POST /sync/upload/folder
 * Multipart form: each file part's field name = relative path (e.g. inventory/cust1.json).
 * Optional: customerId as query param (or form text field if parsed) for sync log.
 * Writes files under server/data, creates nested dirs as needed.
 */
function uploadFolder(req, res) {
  log.info('Upload Folder called...');
  const start = Date.now();

  try {
    const files = req.files;
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({
        success: false,
        error:
          'No files in request. Send multipart/form-data: one part per file with field name = relative path (e.g. inventory/cust1.json). Optional field: customerId.',
      });
    }

    const pathsWritten = [];
    for (const file of files) {
      const relativePath = file.fieldname;
      if (!relativePath || relativePath === 'customerId') continue;

      const safePath = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
      const absolutePath = path.join(getDataRoot(), safePath);
      const dir = path.dirname(absolutePath);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(absolutePath, file.buffer, 'utf8');
      pathsWritten.push(safePath.replace(/\\/g, '/'));
    }

    if (pathsWritten.length === 0) {
      return res.status(400).json({
        success: false,
        error:
          'No files in request. Send multipart/form-data: one part per file with field name = relative path (e.g. inventory/cust1.json). Optional field: customerId.',
      });
    }

    const customerId = req.query.customerId || (req.body && req.body.customerId) || '';
    let syncLogRecorded = false;
    if (customerId) {
      try {
        addSyncRecord({
          id: Date.now(),
          date: new Date().toISOString().split('T')[0],
          customerId: String(customerId),
          syncTime: new Date().toLocaleTimeString(),
          status: 'Success',
        });
        syncLogRecorded = true;
      } catch (e) {
        log.error('Sync log record failed:', e);
      }
    }

    const timeToTakeMs = Date.now() - start;
    log.info('Folder uploaded successfully');
    return res.status(200).json({
      success: true,
      filesWritten: pathsWritten.length,
      dataDir: './data',
      paths: pathsWritten,
      timeToTakeMs,
      status: 'success',
      syncLogRecorded,
    });
  } catch (err) {
      log.error('Failed to Upload Folder:', err);
    const timeToTakeMs = Date.now() - start;
    return res.status(500).json({
      success: false,
      error: 'Failed to Upload Folder',
      timeToTakeMs,
      status: 'fail',
    });
  }
}

module.exports = { uploadFolder };
