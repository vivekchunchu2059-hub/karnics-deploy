const fs = require('fs');
const path = require('path');
const { readAllInvoices } = require('./invoiceController');
const { dataPath, getMetalsConfigPath } = require('../paths');
const log = require('../logger');

const inventoryFilePath = () => dataPath('Inventory', 'Inventory.json');
const metalsConfigPath = () => getMetalsConfigPath();

const ensureFile = (filePath, fallback = '[]') => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, fallback, 'utf8');
  }
};

const readJson = (filePath) => {
  ensureFile(filePath);
  const raw = fs.readFileSync(filePath, 'utf8');
  return raw.trim() ? JSON.parse(raw) : [];
};

const getMetalPricesFromRequest = (req) => {
  // Get prices from query params or use defaults
  const goldPrice = parseFloat(req.query.goldPrice) || parseFloat(req.body?.goldPrice) || 124650;
  const silverPrice = parseFloat(req.query.silverPrice) || parseFloat(req.body?.silverPrice) || 2410;
  const platinumPrice = parseFloat(req.query.platinumPrice) || parseFloat(req.body?.platinumPrice) || 50000;
  return {
    gold: { pricePer10gm: goldPrice },
    silver: { pricePer10gm: silverPrice },
    platinum: { pricePer10gm: platinumPrice },
  };
};

const getStockTotals = (req, res) => {
  log.info('Get Stock Totals called...');
  try {
    const metalsConfig = readJson(metalsConfigPath());
    const inventory = readJson(inventoryFilePath());
    const metalPrices = getMetalPricesFromRequest(req);

    // First, collect all unique metals from inventory
    const metalsInInventory = new Set();
    inventory.forEach((group) => {
      if (group.metal && group.category && Array.isArray(group.category) && group.category.length > 0) {
        // Check if this metal group has any items with quantity > 0
        const hasStock = group.category.some((item) => (Number(item.quantity) || 0) > 0);
        if (hasStock) {
          metalsInInventory.add((group.metal || '').toLowerCase());
        }
      }
    });

    // Process all metals from config; include those with no stock so dashboard shows 0
    const metalTotals = metalsConfig
      .map((metal) => {
        const name = metal.name || '';
        const metalLower = name.toLowerCase();

        // Handle nested inventory structure: [{metal, categoryName, category: [{weight, quantity, ...}]}]
        let totalUnits = 0;
        let totalWeightGrams = 0;
        let totalValue = 0;

        inventory.forEach((group) => {
          const groupMetal = (group.metal || '').toLowerCase();
          if (groupMetal === metalLower && group.category && Array.isArray(group.category)) {
            group.category.forEach((item) => {
              const quantity = Number(item.quantity) || 0; // number of units in stock

              // Parse weight - handle both number and string formats
              let weightValue = 0;
              let weightUnit = 'gm';

              if (typeof item.weight === 'string') {
                // Parse string like "5 gm" or "2.5 ct"
                const weightStr = item.weight.trim();
                const match = weightStr.match(/^([\d.]+)\s*(gm|g|kg|kilogram|ct|carat|ratti)?$/i);
                if (match) {
                  weightValue = parseFloat(match[1]) || 0;
                  weightUnit = (match[2] || 'gm').toLowerCase();
                } else {
                  // Try to extract number
                  const numMatch = weightStr.match(/[\d.]+/);
                  weightValue = numMatch ? parseFloat(numMatch[0]) : 0;
                  // Determine unit based on metal type if not specified
                  if (metalLower === 'diamond' || metalLower === 'gems' || metalLower.includes('gem')) {
                    weightUnit = 'ct';
                  }
                }
              } else {
                weightValue = Number(item.weight) || 0;
                // Determine unit based on metal type
                if (metalLower === 'diamond' || metalLower === 'gems' || metalLower.includes('gem')) {
                  weightUnit = 'ct';
                }
              }

              // Convert weight to grams based on unit
              let weightInGrams = 0;
              if (weightUnit === 'kg' || weightUnit === 'kilogram') {
                weightInGrams = weightValue * 1000;
              } else if (weightUnit === 'ct' || weightUnit === 'carat') {
                weightInGrams = weightValue * 0.2; // 1 carat = 0.2 grams
              } else if (weightUnit === 'ratti') {
                weightInGrams = weightValue * 0.182; // 1 ratti ≈ 0.182 grams
              } else {
                weightInGrams = weightValue; // Already in grams
              }

              totalUnits += quantity;

              // Calculate weight and value based on metal type
              let itemTotalWeightGrams = 0;

              if (metalLower === 'gold' || metalLower === 'silver') {
                // For Gold and Silver: item.weight represents weight per unit, so multiply by quantity
                itemTotalWeightGrams = weightInGrams * quantity;
                totalWeightGrams += itemTotalWeightGrams;

                // Use metal price calculation: (total weight in grams / 10) * pricePer10gm
                // Formula: (itemTotalWeightGrams / 10) × pricePer10gm
                const pricePer10gm = metalLower === 'gold'
                  ? (metalPrices.gold?.pricePer10gm || 124650)
                  : (metalPrices.silver?.pricePer10gm || 2410);
                totalValue += (itemTotalWeightGrams / 10) * pricePer10gm;
              } else if (metalLower === 'platinum') {
                // For Platinum: weight per unit × quantity, but price is already total
                itemTotalWeightGrams = weightInGrams * quantity;
                totalWeightGrams += itemTotalWeightGrams;

                // Platinum: use product price directly (price already represents total price, not per unit)
                const price = typeof item.price === 'string'
                  ? parseFloat(item.price)
                  : (Number(item.price) || 0);
                totalValue += price;
              } else {
                // For Diamond, Gemstones, Gems: weight represents weight per unit in carats
                // Multiply by quantity to get total weight, then convert to grams for storage
                // Example: 12 ct × 7 = 84 ct total, 9 ct × 8 = 72 ct total
                itemTotalWeightGrams = weightInGrams * quantity;
                totalWeightGrams += itemTotalWeightGrams;

                // Price is already total price for that item/category, so sum directly (don't multiply by quantity)
                const price = typeof item.price === 'string'? parseFloat(item.price) : (Number(item.price) || 0);
                totalValue += price;
              }
            });
          }
        });

        // For Diamond/Gems, preserve precision by using more decimal places
        // This prevents rounding errors when converting back to carats
        const weightPrecision = (metalLower === 'diamond' || metalLower === 'gems' || metalLower.includes('gem')) ? 4 : 3;

        return {
          name,
          color: metal.color,
          totalUnits,
          totalWeightKg: Number((totalWeightGrams / 1000).toFixed(weightPrecision)),
          totalValue: Math.round(totalValue),
        };
      });

    const totals = metalTotals.reduce(
      (acc, metal) => {
        acc.totalUnits += metal.totalUnits;
        acc.totalWeightKg = Number((acc.totalWeightKg + metal.totalWeightKg).toFixed(3));
        acc.totalValue += metal.totalValue || 0;
        return acc;
      },
      { totalUnits: 0, totalWeightKg: 0, totalValue: 0 }
    );

    log.info('Stock Totals fetched successfully');
    return res.json({
      metals: metalTotals,
      totals,
    });
  } catch (error) {
    log.error('Failed to Fetch Stock Totals:', error);
    return res.status(500).json({
      error: 'Failed to Fetch Stock Totals',
      details: error.message,
    });
  }
};

/**
 * Parses currency string to number
 * @param {string} amountStr - Amount string like "₹60,770.00" or "₹1,40,757.74"
 * @returns {number} - Numeric value
 */
const parseAmount = (amountStr) => {
  if (!amountStr) return 0;

  // Handle both string and number types
  if (typeof amountStr === 'number') {
    return isNaN(amountStr) ? 0 : amountStr;
  }

  if (typeof amountStr !== 'string') return 0;

  // Remove currency symbols (₹, various encodings), commas, and parse
  // Match Indian number format: ₹1,23,456.78 or 1,23,456.78
  // Try multiple approaches to handle different encodings
  let cleaned = amountStr
    .replace(/₹/g, '')                    // Remove ₹ symbol
    .replace(/\u20B9/g, '')              // Remove ₹ Unicode
    .replace(/[₹\u20B9\u00A2-\u00A5]/g, '') // Remove various currency symbols
    .replace(/,/g, '')                    // Remove commas
    .trim();

  // If still contains non-numeric characters, try extracting just numbers and decimal point
  if (!/^\d+\.?\d*$/.test(cleaned)) {
    cleaned = cleaned.replace(/[^\d.]/g, '');
  }

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Gets all sales records matching the same filtering logic as listSales
 * but without pagination - returns all matching records
 * @param {object} req - Express request object
 * @returns {Array} - All filtered sales records
 */

/**
 * Calculate sales totals from invoices using the same logic as calculateSalesByMetal
 * This ensures accurate totals that match the expected values
 */
const calculateSalesFromInvoices = (invoices, metalFilter = '') => {
  const metalTotals = {};

  invoices.forEach((invoice) => {
    const items = invoice.items || [];
    const totals = invoice.totals || {};
    const billDate = invoice.billDate || invoice.billDetails?.billDate || '';
    const dateObj = billDate ? new Date(billDate) : null;
    const month = dateObj ? dateObj.toLocaleDateString('en-US', { month: 'short' }) : '';

    const cgstAmount = totals.cgstAmount || 0;
    const sgstAmount = totals.sgstAmount || 0;
    const gstDeduction = cgstAmount + sgstAmount;
    const subtotal = totals.subtotal || 0;
    const discount = totals.discount || 0;

    items.forEach((item) => {
      const metal = (item.metal || '').trim();
      if (!metal) return;

      // Filter by metal if provided
      if (metalFilter && metal !== metalFilter) {
        return;
      }

      if (!metalTotals[metal]) {
        metalTotals[metal] = {
          totalAmount: 0,
          monthlyAmount: 0,
        };
      }

      const weight = parseFloat(item.weight) || 0;
      const quantity = parseInt(item.quantity, 10) || 0;
      const price = parseFloat(item.price) || 0;
      const makingCharge = parseFloat(item.makingCharge) || 0;
      const itemSubtotal = price * quantity + makingCharge;

      // Calculate proportional values for this metal based on item contribution
      const itemProportion = subtotal > 0 ? itemSubtotal / subtotal : 0;

      // totalAmount = subtotal + GST - discount (distributed proportionally)
      const metalItemTotal = itemSubtotal + (gstDeduction * itemProportion) - (discount * itemProportion);
      const metalTotalAmount = Math.max(0, metalItemTotal);

      metalTotals[metal].totalAmount += metalTotalAmount;

      // Check if invoice is from current month
      const currentDate = new Date();
      const currentMonth = currentDate.toLocaleDateString('en-US', { month: 'short' });
      const currentYear = currentDate.getFullYear();
      let invoiceYear = currentYear;

      if (billDate) {
        const billDateObj = new Date(billDate);
        invoiceYear = billDateObj.getFullYear();
      }

      if (month === currentMonth && invoiceYear === currentYear) {
        metalTotals[metal].monthlyAmount += metalTotalAmount;
      }
    });
  });

  return metalTotals;
};

/**
 * Gets total sales amount from sales data, optionally filtered by metal
 * Uses the same filtering logic as listSales but returns all records (no pagination)
 * and calculates totals from totalAmount field in Sales.json
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const getTotalSales = (req, res) => {
  log.info('Get Total Sales called...');
  try {
    const invoices = readAllInvoices();
    const metalFilter = req.query.metal ? String(req.query.metal).trim() : '';

    const metalTotals = calculateSalesFromInvoices(invoices, metalFilter);

    if (metalFilter) {
      const totals = metalTotals[metalFilter] || { totalAmount: 0, monthlyAmount: 0 };
      return res.json({
        totalSales: parseFloat(totals.totalAmount.toFixed(2)),
        monthlySales: parseFloat(totals.monthlyAmount.toFixed(2)),
      });
    }

    let totalSales = 0;
    let monthlySales = 0;

    Object.values(metalTotals).forEach((totals) => {
      totalSales += totals.totalAmount;
      monthlySales += totals.monthlyAmount;
    });

    log.info('Total Sales fetched successfully');
    return res.json({
      totalSales: parseFloat(totalSales.toFixed(2)),
      monthlySales: parseFloat(monthlySales.toFixed(2)),
    });
  } catch (error) {
    log.error('Failed to Fetch Total Sales:', error);
    return res.status(500).json({
      error: 'Failed to Fetch Total Sales',
      details: error.message,
    });
  }
};

/**
 * Get monthly sales trend data (last 12 months)
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
/**
 * Get weekly sales trend (last 7 days)
 * Uses invoice.totals.grandTotal exactly as before
 */
const getSalesTrend = (req, res) => {
  log.info('Get Sales Trend called...');
  try {
    const invoices = readAllInvoices();

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // Find latest invoice date
    const allDates = invoices
      .map(inv => new Date(inv.billDate))
      .filter(d => !isNaN(d));

    if (allDates.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const latestDate = new Date(Math.max(...allDates));
    latestDate.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(latestDate);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const dayTotals = {};
    const days = [];

    // Prepare last 7 days structure
    for (let i = 0; i < 7; i++) {
      const date = new Date(sevenDaysAgo);
      date.setDate(sevenDaysAgo.getDate() + i);

      const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
      const key = date.toISOString().split("T")[0];

      dayTotals[key] = { day: dayName, value: 0, };
      days.push(key);
    }

    // Calculate totals
    invoices.forEach((invoice) => {
      const billDate =
        invoice.billDate || invoice.billDetails?.billDate;

      if (!billDate) return;

      const date = new Date(billDate);
      if (isNaN(date)) return;

      date.setHours(0, 0, 0, 0);

      if (date >= sevenDaysAgo && date <= latestDate) {
        const key = date.toISOString().split("T")[0];
        const totalAmount = Number(invoice.totals?.grandTotal) || 0;

        if (dayTotals[key]) {
          dayTotals[key].value += totalAmount / 100000; // keep lakhs conversion
        }
      }
    });

    const trendData = days.map((key) => ({
      day: dayTotals[key].day,
      value: Number(dayTotals[key].value.toFixed(2)),
    }));
    log.info('Sales Trend fetched successfully');
    return res.json({ data: trendData });
  } catch (error) {
    log.error("Failed to Fetch Sales Trend:", error);
    return res.status(500).json({
      error: "Failed to Fetch Sales Trend",
      details: error.message,
    });
  }
};

/**
 * Get category-wise monthly sales (current year)
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const getCategoryMonthlySales = (req, res) => {
  log.info('Get Category Monthly Sales called...');
  try {

    const invoices = readAllInvoices();
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();

    // Category color mappings
    const categoryColors = {
      'Gold': '#D4AF37',
      'Silver': '#9CA3AF',
      'Platinum': '#92A8D1',
      'Diamond': '#6CB4EE',
      'Gems & Stones': '#88B04B',
      'Gems': '#6B5B95',
    };

    const categoryTotals = {};

    // Calculate totals by metal/category
    invoices.forEach((invoice) => {
      const billDate = invoice.billDate || invoice.billDetails?.billDate;
      if (!billDate) return;

      const date = new Date(billDate);
      const saleYear = date.getFullYear();

      if (saleYear !== currentYear) return;

      (invoice.items || []).forEach((item) => {
        const metal = (item.metal || '').trim();
        if (!metal) return;

        if (!categoryTotals[metal]) {
          categoryTotals[metal] = 0;
        }

        const price = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 0;
        const makingCharge = Number(item.makingCharge) || 0;

        const itemSubtotal = price * quantity + makingCharge;
        categoryTotals[metal] += itemSubtotal;
      });
    });

    // Ensure all metals are included, even with 0 sales
    const allMetals = ['Gold', 'Silver', 'Platinum', 'Diamond', 'Gems & Stones', 'Gems'];
    const categoryData = allMetals.map((metal) => ({
      name: metal,
      value: (categoryTotals[metal] || 0) / 100000, // Convert to lakhs for display, default to 0
      color: categoryColors[metal] || '#6b7280',
    })).sort((a, b) => b.value - a.value); // Sort by value descending

    log.info('Category Monthly Sales fetched successfully');
    return res.json({ data: categoryData });
  } catch (error) {
    log.error('Failed to Fetch Category Monthly Sales:', error);
    return res.status(500).json({
      error: 'Failed to Fetch Category Monthly Sales',
      details: error.message,
    });
  }
};

/**
 * Get stock values for popup (actual values, not percentages)
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const getStockValues = (req, res) => {
  log.info('Get Stock Values called...');
  try {
    const inventory = readJson(inventoryFilePath());
    const metalsConfig = readJson(metalsConfigPath());
    const metalPrices = getMetalPricesFromRequest(req);

    // Category color mappings
    const categoryColors = {
      'Gold': '#D4AF37',
      'Silver': '#9CA3AF',
      'Platinum': '#92A8D1',
      'Diamond': '#6CB4EE',
      'Gems & Stones': '#88B04B',
      'Gems': '#6B5B95',
    };

    const stockValues = {};

    // Calculate stock values using same logic as getStockTotals
    metalsConfig.forEach((metal) => {
      const name = metal.name || '';
      const metalLower = name.toLowerCase();

      let totalValue = 0;

      inventory.forEach((group) => {
        const groupMetal = (group.metal || '').toLowerCase();
        if (groupMetal === metalLower && group.category && Array.isArray(group.category)) {
          group.category.forEach((item) => {
            const quantity = Number(item.quantity) || 0;
            if (quantity === 0) return;

            // Parse weight
            let weightValue = 0;
            let weightUnit = 'gm';

            if (typeof item.weight === 'string') {
              const weightStr = item.weight.trim();
              const match = weightStr.match(/^([\d.]+)\s*(gm|g|kg|kilogram|ct|carat|ratti)?$/i);
              if (match) {
                weightValue = parseFloat(match[1]) || 0;
                weightUnit = (match[2] || 'gm').toLowerCase();
              } else {
                const numMatch = weightStr.match(/[\d.]+/);
                weightValue = numMatch ? parseFloat(numMatch[0]) : 0;
                if (metalLower === 'diamond' || metalLower === 'gems' || metalLower.includes('gem')) {
                  weightUnit = 'ct';
                }
              }
            } else {
              weightValue = Number(item.weight) || 0;
              if (metalLower === 'diamond' || metalLower === 'gems' || metalLower.includes('gem')) {
                weightUnit = 'ct';
              }
            }

            // Convert weight to grams
            let weightInGrams = 0;
            if (weightUnit === 'kg' || weightUnit === 'kilogram') {
              weightInGrams = weightValue * 1000;
            } else if (weightUnit === 'ct' || weightUnit === 'carat') {
              weightInGrams = weightValue * 0.2;
            } else if (weightUnit === 'ratti') {
              weightInGrams = weightValue * 0.182;
            } else {
              weightInGrams = weightValue;
            }

            // Calculate value based on metal type
            if (metalLower === 'gold' || metalLower === 'silver' || metalLower === 'platinum') {
              const itemTotalWeightGrams = weightInGrams * quantity;
              let pricePer10gm = 0;
              if (metalLower === 'gold') {
                pricePer10gm = metalPrices.gold?.pricePer10gm || 124650;
              } else if (metalLower === 'silver') {
                pricePer10gm = metalPrices.silver?.pricePer10gm || 2410;
              } else if (metalLower === 'platinum') {
                pricePer10gm = metalPrices.platinum?.pricePer10gm || 50000;
              }
              totalValue += (itemTotalWeightGrams / 10) * pricePer10gm;
            } else {
              // For Diamond, Gemstones, Gems
              const price = typeof item.price === 'string'
                ? parseFloat(item.price)
                : (Number(item.price) || 0);
              totalValue += price;
            }
          });
        }
      });

      if (totalValue > 0 || name.toLowerCase() === 'gold' || name.toLowerCase() === 'silver' ||
        name.toLowerCase() === 'platinum' || name.toLowerCase() === 'diamond' ||
        name.toLowerCase() === 'gems' || name.toLowerCase().includes('gem')) {
        stockValues[name] = {
          value: totalValue,
          color: categoryColors[name] || '#6b7280',
        };
      }
    });

    // Format response with all metals, even if 0
    const allMetals = ['Gold', 'Silver', 'Platinum', 'Diamond', 'Gems & Stones', 'Gems'];
    const stockData = allMetals.map((metal) => ({
      name: metal.toUpperCase(),
      value: Math.round(stockValues[metal]?.value || 0),
      color: stockValues[metal]?.color || categoryColors[metal] || '#6b7280',
    }));

    log.info('Stock Values fetched successfully');
    return res.json({ data: stockData });
  } catch (error) {
    log.error('Failed to Fetch Stock Values:', error);
    return res.status(500).json({
      error: 'Failed to Fetch Stock Values',
      details: error.message,
    });
  }
};

/**
 * Get stock split data from inventory
 * Uses the same calculation as getStockTotals to ensure consistency
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const getStockSplit = (req, res) => {
  log.info('Get Stock Split called...');
  try {
    const inventory = readJson(inventoryFilePath());
    const metalsConfig = readJson(metalsConfigPath());
    const metalPrices = getMetalPricesFromRequest(req);

    // Category color mappings
    const categoryColors = {
      'Gold': '#D4AF37',
      'Silver': '#9CA3AF',
      'Platinum': '#92A8D1',
      'Diamond': '#6CB4EE',
      'Gems & Stones': '#88B04B',
      'Gems': '#6B5B95',
    };

    const stockSplit = {};

    // Calculate stock values using same logic as getStockTotals
    metalsConfig.forEach((metal) => {
      const name = metal.name || '';
      const metalLower = name.toLowerCase();

      let totalValue = 0;

      inventory.forEach((group) => {
        const groupMetal = (group.metal || '').toLowerCase();
        if (groupMetal === metalLower && group.category && Array.isArray(group.category)) {
          group.category.forEach((item) => {
            const quantity = Number(item.quantity) || 0;
            if (quantity === 0) return;

            // Parse weight
            let weightValue = 0;
            let weightUnit = 'gm';

            if (typeof item.weight === 'string') {
              const weightStr = item.weight.trim();
              const match = weightStr.match(/^([\d.]+)\s*(gm|g|kg|kilogram|ct|carat|ratti)?$/i);
              if (match) {
                weightValue = parseFloat(match[1]) || 0;
                weightUnit = (match[2] || 'gm').toLowerCase();
              } else {
                const numMatch = weightStr.match(/[\d.]+/);
                weightValue = numMatch ? parseFloat(numMatch[0]) : 0;
                if (metalLower === 'diamond' || metalLower === 'gems' || metalLower.includes('gem')) {
                  weightUnit = 'ct';
                }
              }
            } else {
              weightValue = Number(item.weight) || 0;
              if (metalLower === 'diamond' || metalLower === 'gems' || metalLower.includes('gem')) {
                weightUnit = 'ct';
              }
            }

            // Convert weight to grams
            let weightInGrams = 0;
            if (weightUnit === 'kg' || weightUnit === 'kilogram') {
              weightInGrams = weightValue * 1000;
            } else if (weightUnit === 'ct' || weightUnit === 'carat') {
              weightInGrams = weightValue * 0.2;
            } else if (weightUnit === 'ratti') {
              weightInGrams = weightValue * 0.182;
            } else {
              weightInGrams = weightValue;
            }

            // Calculate value based on metal type
            if (metalLower === 'gold' || metalLower === 'silver' || metalLower === 'platinum') {
              const itemTotalWeightGrams = weightInGrams * quantity;
              let pricePer10gm = 0;
              if (metalLower === 'gold') {
                pricePer10gm = metalPrices.gold?.pricePer10gm || 124650;
              } else if (metalLower === 'silver') {
                pricePer10gm = metalPrices.silver?.pricePer10gm || 2410;
              } else if (metalLower === 'platinum') {
                pricePer10gm = metalPrices.platinum?.pricePer10gm || 50000;
              }
              totalValue += (itemTotalWeightGrams / 10) * pricePer10gm;
            } else {
              // For Diamond, Gemstones, Gems
              const price = typeof item.price === 'string'
                ? parseFloat(item.price)
                : (Number(item.price) || 0);
              totalValue += price;
            }
          });
        }
      });

      // Always include each metal (0 when no stock) so dashboard shows Gold, Silver, Platinum etc. with 0
      stockSplit[name] = totalValue;
    });

    // Format response
    const totalStockValue = Object.values(stockSplit).reduce((sum, val) => sum + val, 0);
    const stockSplitData = Object.keys(stockSplit).map((metal) => {
      const value = stockSplit[metal];
      const percentage = totalStockValue > 0 ? (value / totalStockValue * 100) : 0;
      return {
        name: metal,
        value: Math.round(percentage),
        color: categoryColors[metal] || '#6b7280',
        percentage: `${Math.round(percentage)}%`,
      };
    }).sort((a, b) => b.value - a.value);

    log.info('Stock Split fetched successfully');
    return res.json({
      data: stockSplitData,
      totalValue: totalStockValue,
    });
  } catch (error) {
    log.error('Failed to Fetch Stock Split:', error);
    return res.status(500).json({
      error: 'Failed to Fetch Stock Split',
      details: error.message,
    });
  }
};

/**
 * Get monthly sales breakdown by category from invoices
 * Supports date range filtering and returns totals with GST
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const getMonthlySalesByCategory = (req, res) => {
  log.info('Get Monthly Sales by Category called...');
  try {
    const invoices = readAllInvoices();

    // Get date range from query params
    const fromDateStr = req.query.fromDate;
    const toDateStr = req.query.toDate;

    let fromDate = null;
    let toDate = null;

    if (fromDateStr) {
      fromDate = new Date(fromDateStr);
      fromDate.setHours(0, 0, 0, 0);
    }
    if (toDateStr) {
      toDate = new Date(toDateStr);
      toDate.setHours(23, 59, 59, 999);
    }

    // If no date range provided, default to current year
    if (!fromDate || !toDate) {
      const currentDate = new Date();
      fromDate = new Date(currentDate.getFullYear(), 0, 1);
      toDate = new Date(currentDate.getFullYear(), 11, 31, 23, 59, 59, 999);
    }

    // Category color mappings
    const categoryColors = {
      'Gold': '#D4AF37',
      'Silver': '#9CA3AF',
      'Platinum': '#92A8D1',
      'Diamond': '#6CB4EE',
      'Gems & Stones': '#88B04B',
      'Gems': '#6B5B95',
    };

    // Initialize all months and categories
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const allMetals = ['Gold', 'Silver', 'Platinum', 'Diamond', 'Gems & Stones', 'Gems'];
    const monthlyData = {};

    // Initialize structure
    months.forEach(month => {
      monthlyData[month] = {};
      allMetals.forEach(metal => {
        monthlyData[month][metal] = 0;
      });
    });

    let totalAmount = 0;
    let totalGST = 0;

    // Process invoices within date range
    invoices.forEach((invoice) => {
      const billDate = invoice.billDate || invoice.createdAt;
      if (!billDate) return;

      const invoiceDate = new Date(billDate);

      // Filter by date range
      if (invoiceDate < fromDate || invoiceDate > toDate) {
        return;
      }

      const invoiceYear = invoiceDate.getFullYear();
      const invoiceMonth = invoiceDate.getMonth();
      const monthKey = months[invoiceMonth];

      if (invoice.items && Array.isArray(invoice.items)) {
        // Calculate GST per invoice
        let invoiceGST = 0;
        if (invoice.totals) {
          const cgst = Number(invoice.totals.cgstAmount) || 0;
          const sgst = Number(invoice.totals.sgstAmount) || 0;
          invoiceGST = cgst + sgst;
          totalGST += invoiceGST;
        }

        // Calculate invoice subtotal
        const invoiceSubtotal = invoice.totals ? (Number(invoice.totals.subtotal) || 0) : 0;
        totalAmount += invoiceSubtotal;

        // Distribute GST proportionally to items and add to monthly data
        invoice.items.forEach((item) => {
          const metal = (item.metal || '').trim();
          if (!metal || !allMetals.includes(metal)) return;

          // Calculate item total (price + making charge)
          const itemPrice = Number(item.price) || 0;
          const makingCharge = Number(item.makingCharge) || 0;
          const quantity = Number(item.quantity) || 0;
          const itemSubtotal = (itemPrice * quantity) + makingCharge;

          // Calculate item's share of GST (proportional to subtotal)
          let itemGST = 0;
          if (invoiceSubtotal > 0 && invoiceGST > 0) {
            itemGST = (itemSubtotal / invoiceSubtotal) * invoiceGST;
          }

          // Total including GST - this is what should be shown in the chart
          const itemTotalWithGST = itemSubtotal + itemGST;

          monthlyData[monthKey][metal] += itemTotalWithGST;
        });
      }
    });

    // Format response - return data for each metal with monthly breakdown
    const categoryData = allMetals.map((metal) => ({
      name: metal,
      monthlyBreakdown: months.map(month => ({
        month,
        value: monthlyData[month][metal] / 100000, // Convert to lakhs
      })),
      color: categoryColors[metal] || '#6b7280',
    }));

    log.info('Monthly Sales by Category fetched successfully');
      return res.json({
      data: categoryData,
      totalAmount: totalAmount,
      totalGST: totalGST,
    });
  } catch (error) {
    log.error('Failed to Fetch Monthly Sales by Category:', error);
    return res.status(500).json({
      error: 'Failed to Fetch Monthly Sales by Category',
      details: error.message,
    });
  }
};

/**
 * Get today's sales by category (from invoices with billDate = today).
 * Uses invoice.totals.grandTotal (same as Invoices screen) and allocates
 * proportionally by item subtotal so dashboard total matches Invoices list.
 */
const getTodaySales = (req, res) => {
  log.info('Get Today Sales called...');
  try {
    const invoices = readAllInvoices();
    const now = new Date();
    const todayStr = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('-');

    const categoryColors = {
      'Gold': '#D4AF37',
      'Silver': '#9CA3AF',
      'Platinum': '#92A8D1',
      'Diamond': '#6CB4EE',
      'Gems & Stones': '#88B04B',
      'Gems': '#6B5B95',
    };
    const categoryTotals = {};

    invoices.forEach((invoice) => {
      const billDate = invoice.billDate || invoice.billDetails?.billDate;
      if (!billDate) return;
      const invDateStr = typeof billDate === 'string'
        ? billDate.split('T')[0]
        : new Date(billDate).toISOString().split('T')[0];
      if (invDateStr !== todayStr) return;

      const grandTotal = Number(invoice.totals?.grandTotal) || 0;
      const invoiceSubtotal = Number(invoice.totals?.subtotal) || 0;
      const items = invoice.items || [];

      if (items.length === 0) return;

      if (invoiceSubtotal > 0) {
        items.forEach((item) => {
          const metal = (item.metal || '').trim();
          if (!metal) return;
          const price = Number(item.price) || 0;
          const quantity = Number(item.quantity) || 0;
          const makingCharge = Number(item.makingCharge) || 0;
          const itemSubtotal = price * quantity + makingCharge;
          const itemShareOfGrandTotal = (itemSubtotal / invoiceSubtotal) * grandTotal;
          if (!categoryTotals[metal]) categoryTotals[metal] = 0;
          categoryTotals[metal] += itemShareOfGrandTotal;
        });
      } else {
        const perItem = grandTotal / items.length;
        items.forEach((item) => {
          const metal = (item.metal || '').trim();
          if (!metal) return;
          if (!categoryTotals[metal]) categoryTotals[metal] = 0;
          categoryTotals[metal] += perItem;
        });
      }
    });

    const allMetals = ['Gold', 'Silver', 'Platinum', 'Diamond', 'Gems & Stones', 'Gems'];
    const data = allMetals.map((metal) => ({
      name: metal,
      value: Math.round(categoryTotals[metal] || 0),
      color: categoryColors[metal] || '#6b7280',
    })).filter((row) => row.value > 0).sort((a, b) => b.value - a.value);

    log.info('Today Sales fetched successfully');
    return res.json({ data });
  } catch (error) {
    log.error('Failed to Fetch Today Sales:', error);
    return res.status(500).json({
      error: 'Failed to Fetch Today Sales',
      details: error.message,
    });
  }
};

/**
 * Gets the latest 5 sales from Sales.json (same as sales page)
 * Tries to match with invoices to get customer information
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const getRecentSales = (req, res) => {
  log.info('Get Recent Sales called...');
  try {
    const userId = req.user?.userId || '';
    const role = (req.user?.role || '').toLowerCase().replace(/\s+/g, '');

    let invoices = readAllInvoices();

    if (role !== 'superadmin') {
      invoices = invoices.filter((inv) => inv.createdBy === userId);
    }
    
    const customers = readJson(dataPath('Customers', 'Customer.json'));

    const getCustomerName = (customerId) => {
      if (!customerId) return 'Walk-in Customer';
      const customer = customers.find((c) => c.id === customerId || c.srNo === customerId);
      if (!customer) return 'Walk-in Customer';
      const title = customer.customerTitle || '';
      const name = customer.customerName || '';
      return title ? `${title} ${name}`.trim() : name;
    };

    const sortedInvoices = [...invoices].sort((a, b) => {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    const recentInvoices = sortedInvoices.slice(0, 5);

    const getIsNewCustomer = (invoice) => {
      const customerId = invoice.customerId;
      if (!customerId) return false; // Walk-in: not "new" in the returning sense
      const thisCreated = new Date(invoice.createdAt || 0).getTime();
      const earlierCount = invoices.filter(
        (inv) =>
          (inv.customerId === customerId || String(inv.customerId) === String(customerId)) &&
          new Date(inv.createdAt || 0).getTime() < thisCreated
      ).length;
      return earlierCount === 0;
    };

    const recentSales = recentInvoices.map((invoice) => {
      const billDate = invoice.billDate || invoice.billDetails?.billDate || '';
      let formattedDate = '';

      if (billDate) {
        const date = new Date(billDate);
        if (!isNaN(date.getTime())) {
          formattedDate = date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          });
        } else {
          formattedDate = billDate;
        }
      }

      const billNumber =
        invoice.billDetails?.billNumber || invoice.billNumber || '';

      const totalAmount = invoice.totals?.grandTotal || 0;
      const customerName = getCustomerName(invoice.customerId);
      const isWalkIn = !invoice.customerId;
      const isNewCustomer = isWalkIn ? false : getIsNewCustomer(invoice);

      return {
        id: invoice.createdAt || Date.now(),
        date: formattedDate,
        customer: customerName,
        item: invoice.items?.[0]?.metal || 'N/A',
        price: `₹${Number(totalAmount).toLocaleString('en-IN')}`,
        billNumber,
        totalAmount,
        billDate,
        isNewCustomer,
        isWalkIn,
      };
    });

    log.info('Recent Sales fetched successfully');
    return res.json({ data: recentSales });
  } catch (error) {
    log.error('Failed to Fetch Recent Sales:', error);
    return res.status(500).json({
      error: 'Failed to Fetch Recent Sales',
      details: error.message,
    });
  }
};

module.exports = {
  getStockTotals,
  getTotalSales,
  getSalesTrend,
  getCategoryMonthlySales,
  getStockSplit,
  getStockValues,
  getMonthlySalesByCategory,
  getTodaySales,
  getRecentSales,
};
