const express = require('express');
const { getDataSync, saveDataSync, getSyncLogs } = require('../controllers/dataSyncController');
const { pushLocalDataToSync, canSyncLocalData } = require('../controllers/dataSyncPushController');

const router = express.Router();

router.post('/push', pushLocalDataToSync);
router.get('/can-sync', canSyncLocalData);
/** Same log data as GET /sync/logs, but behind JWT (for SPA / packaged build — no sync token required). */
router.get('/logs', getSyncLogs);
router.get('/', getDataSync);
router.post('/', saveDataSync);

module.exports = router;
