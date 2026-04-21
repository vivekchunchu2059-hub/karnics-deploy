const express = require('express');
const { getMetals, getEnv, getMetalPrices } = require('../controllers/configController');

const router = express.Router();

router.get('/metals', getMetals);
router.get('/env', getEnv);
router.get('/metal-prices', getMetalPrices);

module.exports = router;
