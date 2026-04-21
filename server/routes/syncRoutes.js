const express = require('express');
const multer = require('multer');
const { syncAuth } = require('../middleware/syncAuth');
const { uploadFolder } = require('../controllers/syncUploadController');
const { getSyncLogs } = require('../controllers/dataSyncController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/** GET /sync/logs – sync log records; auth via x-sync-token / Bearer (REACT_APP_SYNC_TOKEN / SYNC_TOKEN). */
router.get('/logs', syncAuth, getSyncLogs);

router.post(
  '/upload/folder',
  syncAuth,
  upload.any(),
  uploadFolder
);

module.exports = router;
