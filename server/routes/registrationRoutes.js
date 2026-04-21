const express = require('express');
const { createRegistration, getRegistrations } = require('../controllers/registrationController');

const router = express.Router();

router.post('/', createRegistration);
router.get('/', getRegistrations);

module.exports = router;