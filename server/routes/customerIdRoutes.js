const express = require('express');
const { getCustomerId } = require('../controllers/customerIdController');

const router = express.Router();
router.get('/', getCustomerId);

module.exports = router;
