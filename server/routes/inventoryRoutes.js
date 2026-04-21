const express = require('express');
const { getInventory, addProduct, updateProduct, deleteProduct, getProductImage } = require('../controllers/inventoryController');

const router = express.Router();

router.get('/', getInventory);
router.get('/images/:filename', getProductImage);
router.post('/add', addProduct);
router.put('/update/:sku', updateProduct);
router.delete('/delete/:sku', deleteProduct);

module.exports = router;