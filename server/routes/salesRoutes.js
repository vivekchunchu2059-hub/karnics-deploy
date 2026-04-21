const express = require('express');
const { getSalesSummary, getSalesDetails } = require('../controllers/salesController');

const router = express.Router();

router.get('/', getSalesSummary);
router.get('/details', getSalesDetails);

module.exports = router;