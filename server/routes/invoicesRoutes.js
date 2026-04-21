const express = require('express');
const {
  createInvoice,
  updateInvoice,
  getInvoice,
  listInvoices,
  deleteInvoice,
  getCreditInvoices,
  getChequeInvoices,
  updateChequeStatus,
  listInvoicesByDate,} = require('../controllers/invoiceController');

const router = express.Router();

router.get('/', listInvoices);
router.get('/getCustomerByCredit', getCreditInvoices);
router.get('/getChequesByCheck', getChequeInvoices);
router.get('/:id', getInvoice);
router.post('/', createInvoice);
router.put('/:id/cheque-status', updateChequeStatus);
router.put('/:id', updateInvoice);
router.delete('/:id', deleteInvoice);
router.get("/invoices", listInvoicesByDate);


module.exports = router;