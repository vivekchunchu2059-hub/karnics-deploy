const express = require('express');
const { 
  getStockTotals, 
  getTotalSales, 
  getSalesTrend, 
  getCategoryMonthlySales, 
  getStockSplit,
  getStockValues,
  getMonthlySalesByCategory,
  getTodaySales,
  getRecentSales
} = require('../controllers/dashboardController');

const router = express.Router();

router.get('/stock', getStockTotals);
router.get('/sales', getTotalSales);
router.get('/sales-trend', getSalesTrend);
router.get('/category-monthly-sales', getCategoryMonthlySales);
router.get('/stock-split', getStockSplit);
router.get('/stock-values', getStockValues);
router.get('/monthly-sales-by-category', getMonthlySalesByCategory);
router.get('/today-sales', getTodaySales);
router.get('/recent-sales', getRecentSales);

module.exports = router;