const express = require('express');
const { addInstallment, updateInstallment } = require("../controllers/InstallmentController");

const router = express.Router();

router.post('/:id', addInstallment);
router.put('/:invoiceId/:installmentNo', updateInstallment);

module.exports = router;