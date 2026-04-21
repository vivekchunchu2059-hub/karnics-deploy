const { readAllInvoices } = require('./invoiceController');
const log = require('../logger');

const METAL_ORDER = [
  "Gold",
  "Silver",
  "Platinum",
  "Diamond",
  "Gemstones",
  "Other",
];

const parseWeight = (weightStr) => {
  if (!weightStr) return 0;

  // Extract only numeric part (works for gm, ct, etc.)
  const match = weightStr.toString().match(/[\d.]+/);
  return match ? Number(match[0]) : 0;
};


const getSalesSummary = (req, res) => {
  log.info('Sales list called...');
  try {
    const { page = 1, limit = 10, fromDate, toDate, metal } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const userId = req.user?.userId || '';
const role = (req.user?.role || '').toLowerCase().replace(/\s+/g, '');

let invoices = readAllInvoices();

if (role !== 'superadmin') {
  invoices = invoices.filter((inv) => inv.createdBy === userId);
}

    const groupedData = {};

    invoices.forEach((invoice) => {
      const billDate = invoice.billDate;

      if (fromDate && billDate < fromDate) return;
      if (toDate && billDate > toDate) return;

      (invoice.items || []).forEach((item) => {
        if (metal && item.metal !== metal) return;

        const key = `${billDate}-${item.metal}`;

        if (!groupedData[key]) {
          groupedData[key] = {
            billDate,
            metal: item.metal,
            weight: 0,
            quantity:0,
            amount: 0,
            gstDeduction: 0,
            totalAmount: 0,
          };
        }

        const quantity = Number(item.quantity || 0);
        const weight = parseWeight(item.weight);
        const price = Number(item.price || 0);
        const makingCharge = Number(item.makingCharge || 0);

        const itemSubtotal = price * quantity + makingCharge;

        const cgst = Number(invoice.totals?.cgstAmount || 0);
        const sgst = Number(invoice.totals?.sgstAmount || 0);
        const gstTotal = cgst + sgst;

        const invoiceSubtotal = Number(invoice.totals?.subtotal || 1);

        const proportion = itemSubtotal / invoiceSubtotal;

        groupedData[key].weight += weight ;
        groupedData[key].quantity += quantity;
        groupedData[key].amount += itemSubtotal;
        groupedData[key].gstDeduction += gstTotal * proportion;
        groupedData[key].totalAmount +=
          itemSubtotal + gstTotal * proportion;
      });
    });

    let result = Object.values(groupedData);

    result.sort((a, b) => {
      if (a.billDate !== b.billDate) {
        return new Date(b.billDate) - new Date(a.billDate);
      }

      return (
        METAL_ORDER.indexOf(a.metal) -
        METAL_ORDER.indexOf(b.metal)
      );
    });

    result = result.map((r) => ({
      ...r,
      weightQuantity: `${r.weight.toFixed(2)}/${r.quantity}`,
    }));

    
    const totalItems = result.length;
    const totalPages = Math.ceil(totalItems / limitNum);
    const start = (pageNum - 1) * limitNum;
    const pagedData = result.slice(start, start + limitNum);

    log.info('Sales fetched successfully');
    return res.json({
      data: pagedData,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalItems,
        totalPages,
      },
    });
  } catch (error) {
    log.error('Failed to Get Sales List:', error);
    return res.status(500).json({
      error: "Failed to Get Sales List",
      details: error.message,
    });
  }
};

const getSalesDetails = (req, res) => {
  log.info('Sales details called...');
  try {
    const { date, metal } = req.query;
    
    const userId = req.user?.userId || '';
    const role = (req.user?.role || '').toLowerCase().replace(/\s+/g, '');

    let invoices = readAllInvoices();
    
    if (role !== 'superadmin') {
      invoices = invoices.filter((inv) => inv.createdBy === userId);
    }

    const items = [];

    invoices.forEach((invoice) => {
      if (invoice.billDate !== date) return;

      const cgst = Number(invoice.totals?.cgstAmount || 0);
      const sgst = Number(invoice.totals?.sgstAmount || 0);
      const gstTotal = cgst + sgst;
      const invoiceSubtotal = Number(invoice.totals?.subtotal || 1);

      (invoice.items || []).forEach((item) => {
        if (item.metal !== metal) return;

        const quantity = Number(item.quantity || 0);
        const weight = parseWeight(item.weight);
        const price = Number(item.price || 0);
        const makingCharge = Number(item.makingCharge || 0);

        const itemSubtotal = price * quantity + makingCharge;
        const proportion = itemSubtotal / invoiceSubtotal;
        const itemGst = gstTotal * proportion;

        items.push({
          itemName: item.itemName,
          weight: weight,
          quantity: quantity,
          amount: Number(itemSubtotal.toFixed(2)),
          gstAmount: Number(itemGst.toFixed(2)),
          total: Number((itemSubtotal + itemGst).toFixed(2)),
        });
      });
    });

    log.info('Sales details fetched successfully');
    return res.json({
      data: items,
    });
  } catch (error) {
    log.error('Failed to Fetch Sales Details:', error);
    return res.status(500).json({
      error: "Failed to Get Sales Details",
      details: error.message,
    });
  }
};

module.exports = {
  getSalesSummary,
  getSalesDetails,
};