const express = require('express');
const { getRoles, saveRoles } = require('../controllers/roleController');

const router = express.Router();

router.get('/', getRoles);
router.post('/', saveRoles);

module.exports = router;

