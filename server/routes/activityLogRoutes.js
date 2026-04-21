const express = require('express');
const {
  getAllActivityLogs,
  getUserActivityLogs,
} = require('../controllers/activityLogController');

const router = express.Router();

router.get('/', getAllActivityLogs);
router.get('/:username', getUserActivityLogs);

module.exports = router;

