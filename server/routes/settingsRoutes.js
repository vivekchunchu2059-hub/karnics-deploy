const express = require('express');
const { getCompanySettings, putCompanySettings } = require('../controllers/settingsController');

const router = express.Router();

router.get('/company', getCompanySettings);
router.put('/company', putCompanySettings);

module.exports = router;
