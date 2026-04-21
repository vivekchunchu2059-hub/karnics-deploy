const fs = require('fs');
const path = require('path');
const { dataPath } = require('../paths');
const { getCustomerById, findOrCreateCustomer, populateCustomerDetails, updateCustomerDetails } = require('./customerController');
const { getInstallmentByInvoice, writeInstallments, readInstallments } = require('./InstallmentController')
const { addSyncRecord } = require('./dataSyncController');
const { reduceInventoryQuantity, restoreInventoryQuantity } = require('./inventoryController');
const { logActivity } = require("./activityLogController");
const log = require('../logger');
const invoicesFolderPath = () => dataPath('Invoices');

const getInvoiceFileByDate = (billDate) => {
  let date = billDate ? new Date(billDate) : new Date();

  if (isNaN(date.getTime())) {
    date = new Date();
  }

  const year = date.getFullYear().toString();

  // Month short name (Jan, Feb, Mar...)
  const monthName = date.toLocaleString('default', { month: 'short' });

  const monthNumber = date.getMonth() + 1; // no leading zero
  const day = date.getDate(); // no leading zero

  const dirPath = path.join(invoicesFolderPath(), year, monthName);

  const fileName = `${year}-${monthNumber}-${day}_invoice.json`;
  const filePath = path.join(dirPath, fileName);

  return { dirPath, filePath };
};



const ensureFile = (dirPath, filePath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '[]', 'utf8');
  }
};


const readInvoices = (billDate) => {
  const { dirPath, filePath } = getInvoiceFileByDate(billDate);

  ensureFile(dirPath, filePath);

  const raw = fs.readFileSync(filePath, 'utf8');
  return raw.trim() ? JSON.parse(raw) : [];
};


const writeInvoices = (billDate, data) => {
  const { dirPath, filePath } = getInvoiceFileByDate(billDate);

  ensureFile(dirPath, filePath);

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
};


const validateInvoice = (payload) => {
  const errors = [];
  // Validate bill details
  if (!payload.billNumber || typeof payload.billNumber !== 'string' || !payload.billNumber.trim()) {
    errors.push('billNumber is required');
  }
  if (!payload.billDate || typeof payload.billDate !== 'string' || !payload.billDate.trim()) {
    errors.push('billDate is required');
  }

  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    errors.push('At least one item is required');
  } else {
    payload.items.forEach((item, index) => {
      if (!item.itemName || !item.metal || item.quantity == null || item.price == null) {
        errors.push(`item ${index + 1} is incomplete`);
      }
      if (Number.isNaN(Number(item.quantity)) || Number(item.quantity) <= 0) {
        errors.push(`item ${index + 1} quantity must be positive number`);
      }
      if (Number.isNaN(Number(item.price)) || Number(item.price) < 0) {
        errors.push(`item ${index + 1} price must be number`);
      }
    });
  }

  return errors;
};

// Helper function to normalize invoice data structure for sales calculation
// This converts invoice with customerId to flat structure needed for calculateSalesByMetal
const normalizeInvoice = (invoice) => {
  if (!invoice) return invoice;
  // If invoice has customerId, populate customer details
  let customerDetails = invoice.customerDetails;
  if (invoice.customerId && !customerDetails) {
    const customer = getCustomerById(invoice.customerId);
    if (customer) {
      customerDetails = {
        customerTitle: customer.customerTitle || '',
        customerName: customer.customerName || '',
        state: customer.state || '',
        city: customer.city || '',
        panAadharType: customer.panAadharType || 'PAN',
        panAadharNumber: customer.panAadharNumber || '',
        address: customer.address || '',
        email: customer.email || undefined,
        contactNumber: customer.contactNumber || customer.phone || '',
      };
    }
  }
  // Return flat structure for backward compatibility with calculateSalesByMetal
  const billNumber = invoice.billDetails?.billNumber || invoice.billNumber;
  const billDate = invoice.billDetails?.billDate || invoice.billDate;
  if (customerDetails) {
    const customerTitle = customerDetails.customerTitle || '';
    const customerName = customerDetails.customerName || '';
    return {
      ...invoice,
      billNumber,
      billDate,
      billDetails: { billNumber, billDate },
      customerName: customerTitle ? `${customerTitle} ${customerName}`.trim() : customerName,
      state: customerDetails.state || '',
      city: customerDetails.city || '',
      panAadharType: customerDetails.panAadharType || 'PAN',
      panAadharNumber: customerDetails.panAadharNumber || '',
      address: customerDetails.address || '',
      contactNumber: customerDetails.contactNumber || '',
      email: customerDetails.email || undefined,
    };
  }
  // Fallback to existing structure
  return {
    ...invoice,
    billNumber: invoice.billDetails?.billNumber || invoice.billNumber,
    billDate: invoice.billDetails?.billDate || invoice.billDate,
    customerName: invoice.customerDetails?.customerName || invoice.customerName || '',
    state: invoice.customerDetails?.state || invoice.state || '',
    city: invoice.customerDetails?.city || invoice.city || '',
    panAadharType: invoice.customerDetails?.panAadharType || invoice.panAadharType || 'PAN',
    panAadharNumber: invoice.customerDetails?.panAadharNumber || invoice.panAadharNumber || '',
    address: invoice.customerDetails?.address || invoice.address || '',
    contactNumber: invoice.customerDetails?.contactNumber || invoice.contactNumber || '',
    email: invoice.customerDetails?.email || invoice.email || undefined,
  };
};

const createInvoice = (req, res) => {
  log.info('Create Invoice called...');
  try {
    const payload = req.body || {};
    const errors = validateInvoice(payload);

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    // Handle customer: normalize customer details from payload
    // Support both flat structure (customerName, state, city, etc.) and nested structure (customerDetails)
    let customerDetails = payload.customerDetails;
    // If customerDetails is provided, ensure email is included from payload.email or customerDetails.email
    if (customerDetails) {
      customerDetails = {
        ...customerDetails,
        email: (payload.email !== undefined && payload.email !== null && payload.email !== '')
          ? payload.email
          : (customerDetails.email !== undefined && customerDetails.email !== null && customerDetails.email !== '')
            ? customerDetails.email
            : undefined,
      };
    }
    if (!customerDetails && (payload.customerName || payload.contactNumber)) {
      // Extract customer title from customerName if present (format: "Mr John Doe")
      let customerTitle = '';
      let customerName = payload.customerName || '';
      if (customerName && typeof customerName === 'string') {
        const titleMatch = customerName.match(/^(Mr|Mrs|Ms|Miss|Dr)\s+(.+)$/);
        if (titleMatch) {
          customerTitle = titleMatch[1];
          customerName = titleMatch[2];
        }
      }
      customerDetails = {
        customerTitle: customerTitle || '',
        customerName: customerName || '',
        state: payload.state || '',
        city: payload.city || '',
        panAadharType: payload.panAadharType || 'PAN',
        panAadharNumber: payload.panAadharNumber || '',
        address: payload.address || undefined, // Can be undefined (optional field)
        contactNumber: payload.contactNumber || '',
        email: payload.email || undefined, // Can be undefined (optional field)
      };
    }

    // Handle customer: if customerDetails provided, find or create customer
    let customerId = payload.customerId;
    if (!customerId && customerDetails) {
      try {
        customerId = findOrCreateCustomer(customerDetails, true, req.user?.userId); // Update customer if found
        // findOrCreateCustomer always returns a valid customer ID, so customerId should not be null here
        if (!customerId) {
          throw new Error('Failed to create or find customer');
        }
      } catch (error) {
        log.error('Error in findOrCreateCustomer:', error);
        throw new Error(`Failed to process customer: ${error.message}`);
      }
    } else if (customerId && customerDetails) {
      // Update existing customer with new details (including email)
      updateCustomerDetails(customerId, customerDetails);
    }

    // Prepare invoice payload with customerId for sales calculation
    const invoiceForSales = {
      ...payload,
      customerId: customerId || null,
      // Include customer details for calculateSalesByMetal (it needs customerName)
      customerDetails: customerDetails || (customerId ? getCustomerById(customerId) : null),
    };

    // Calculate sales data grouped by metal type and update sales.json
    const normalizedForSales = normalizeInvoice(invoiceForSales);
    // const salesByMetal = calculateSalesByMetal(normalizedForSales);
    // updateSalesByMetal(salesByMetal);

    // Write to Invoices.json (without customerDetails, just customerId)
    const billDate = payload.billDate || payload.billDetails?.billDate;
    const invoices = readInvoices(billDate);
    const newInvoice = {
      id: Date.now(),
      billNumber: payload.billNumber || payload.billDetails?.billNumber,
      billDate: payload.billDate || payload.billDetails?.billDate,
      customerId: customerId, // Use customerId directly, findOrCreateCustomer ensures it's valid
      items: payload.items || [],
      totals: payload.totals || {},
      gstEnabled: payload.gstEnabled !== undefined ? payload.gstEnabled : true,
      gstPercent: payload.gstPercent || payload.sgstPercent || 9,
      cgstPercent: payload.cgstPercent || 9,
      sgstPercent: payload.sgstPercent || payload.gstPercent || 9,
      discountType: payload.discountType || 'fixed',
      discountValue: payload.discountValue || 0,
      paymentMode: payload.paymentDetails?.mode || 'cash',
      paymentAmount: payload.paymentDetails?.amount || '',
      paymentDetails: payload.paymentDetails || {},
      createdAt: new Date().toISOString(),
      createdBy: req.user?.userId || '',
    };
    invoices.push(newInvoice);
    writeInvoices(billDate, invoices);

    // Reduce inventory quantity for items with SKU
    if (payload.items && Array.isArray(payload.items)) {
      payload.items.forEach((item) => {
        if (item.sku && item.quantity) {
          const quantity = Number(item.quantity) || 0;
          if (quantity > 0) {
            reduceInventoryQuantity(item.sku, quantity);
          }
        }
      });
    }

    if (payload.paymentDetails?.mode === "credit") {
      const installmentData = readInstallments()
      const createInstallment = {
        "invoiceNo": getShortInvoiceNumber(payload.billNumber),
        "installments": [],
        "balance": parseFloat(payload.totals.grandTotal) - parseFloat(payload.paymentDetails.advanceAmount),
        "totalPurchaseAmount": payload.totals.grandTotal
      }
      installmentData.push(createInstallment)
      writeInstallments(installmentData)
    }

    addSyncRecord({
      id: Date.now(),
      date: new Date().toISOString().split("T")[0],
      customerId: newInvoice.customerId,
      syncTime: new Date().toISOString(),
      status: "Success"
    });

    // Return invoice with populated customer details
    const invoiceWithCustomer = populateCustomerDetails(newInvoice);

    // Activity log (Invoice create)
    try {
      if (req.user?.username && req.user?.role) {
        logActivity({
          username: req.user.username,
          role: req.user.role,
          page: "Invoice",
          action: "create",
          after: {
            invoiceNumber:
              newInvoice.billDetails?.billNumber || newInvoice.billNumber || "",
          },
        });
      }
    } catch (e) {
      // Never block invoice creation due to activity logging
    }
    log.info('Invoice created successfully');
    return res.status(201).json({ success: true, invoice: invoiceWithCustomer });
  } catch (error) {
    log.error('Failed to Create Invoice:', error);
    return res.status(500).json({
      error: 'Failed to Create Invoice',
      details: error.message,
    });
  }
};

const updateInvoice = (req, res) => {
  log.info('Update Invoice called...');
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) {
      return res.status(400).json({ error: 'Invalid invoice id' });
    }

    const payload = req.body || {};
    const errors = validateInvoice(payload);
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    // Get existing invoice to calculate old sales contribution
    // Step 1: find invoice from all files
    const allInvoices = readAllInvoices();
    const existing = allInvoices.find((inv) => Number(inv.id) === id);

    const userRole = req.user?.role;
    const userId = req.user?.userId;

    const role = (userRole || '').toLowerCase().replace(/\s+/g, '');


    if (!existing) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (role !== 'superadmin' && existing.createdBy !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const beforeInvoice = { ...existing };

    // Step 2: read only that invoice's day file
    const billDate = existing.billDate;
    const invoices = readInvoices(billDate);

    const invoiceIdx = invoices.findIndex((inv) => Number(inv.id) === id);

    // Normalize existing invoice to ensure consistent structure
    const normalizedExisting = normalizeInvoice(existing);
    // Subtract old invoice's contribution from sales.json

    // const oldSalesByMetal = calculateSalesByMetal(normalizedExisting);
    // updateSalesByMetal(oldSalesByMetal, true); // subtract = true

    // Handle customer: normalize customer details from payload
    // Support both flat structure (customerName, state, city, etc.) and nested structure (customerDetails)
    let customerDetails = payload.customerDetails;
    // If customerDetails is provided, ensure email is included from payload.email or customerDetails.email
    if (customerDetails) {
      customerDetails = {
        ...customerDetails,
        email: (payload.email !== undefined && payload.email !== null && payload.email !== '')
          ? payload.email
          : (customerDetails.email !== undefined && customerDetails.email !== null && customerDetails.email !== '')
            ? customerDetails.email
            : undefined,
      };
    }
    if (!customerDetails && (payload.customerName || payload.contactNumber)) {
      // Extract customer title from customerName if present (format: "Mr John Doe")
      let customerTitle = '';
      let customerName = payload.customerName || '';
      if (customerName) {
        const titleMatch = customerName.match(/^(Mr|Mrs|Ms|Miss|Dr)\s+(.+)$/);
        if (titleMatch) {
          customerTitle = titleMatch[1];
          customerName = titleMatch[2];
        }
      }
      customerDetails = {
        customerTitle: customerTitle || '',
        customerName: customerName,
        state: payload.state || '',
        city: payload.city || '',
        panAadharType: payload.panAadharType || 'PAN',
        panAadharNumber: payload.panAadharNumber || '',
        address: payload.address || '',
        contactNumber: payload.contactNumber || '',
        email: (payload.email !== undefined && payload.email !== null && payload.email !== '') ? payload.email : undefined,
      };
    }

    // Handle customer: if customerDetails provided, find or create customer
    let customerId = payload.customerId || existing.customerId;
    if (!customerId && customerDetails) {
      customerId = findOrCreateCustomer(customerDetails, true, req.user?.userId);
      // findOrCreateCustomer always returns a valid customer ID, so customerId should not be null here
    } else if (customerId && customerDetails) {
      // Update existing customer with new details (including email)
      updateCustomerDetails(customerId, customerDetails);
    }

    // Prepare invoice payload with customerId for sales calculation
    const invoiceForSales = {
      ...payload,
      customerId: customerId || null,
      customerDetails: customerDetails || (customerId ? getCustomerById(customerId) : null),
    };
    // Calculate new sales contribution
    const normalizedForSales = normalizeInvoice(invoiceForSales);

    // const newSalesByMetal = calculateSalesByMetal(normalizedForSales);
    // updateSalesByMetal(newSalesByMetal, false); // subtract = false (add)

    // Update invoice in Invoices.json (without customerDetails, just customerId)
    const updated = {
      ...existing,
      billNumber: payload.billNumber || payload.billDetails?.billNumber || existing.billNumber,
      billDate: payload.billDate || payload.billDetails?.billDate || existing.billDate,
      customerId: customerId, // Use customerId directly, findOrCreateCustomer ensures it's valid
      items: payload.items || existing.items || [],
      totals: payload.totals || existing.totals || {},
      gstEnabled: payload.gstEnabled !== undefined ? payload.gstEnabled : (existing.gstEnabled !== undefined ? existing.gstEnabled : true),
      gstPercent: payload.gstPercent !== undefined ? payload.gstPercent : (payload.sgstPercent || existing.gstPercent || existing.sgstPercent || 9),
      cgstPercent: payload.cgstPercent !== undefined ? payload.cgstPercent : (existing.cgstPercent || 9),
      sgstPercent: payload.sgstPercent !== undefined ? payload.sgstPercent : (payload.gstPercent || existing.sgstPercent || existing.gstPercent || 9),
      discountType: payload.discountType || existing.discountType || 'fixed',
      discountValue: payload.discountValue !== undefined ? payload.discountValue : (existing.discountValue || 0),
      paymentMode: payload.paymentDetails?.mode || existing.paymentMode || 'cash',
      paymentAmount: payload.paymentDetails?.amount || existing.paymentAmount || '',
      paymentDetails: payload.paymentDetails || existing.paymentDetails || {},
      id: existing.id,
      createdAt: existing.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    invoices[invoiceIdx] = updated;
    writeInvoices(billDate, invoices);

    // If this is a credit invoice, keep Installments.json balance in sync
    // when bill totals (or advance) change during updateInvoice.
    if (payload.paymentDetails?.mode === "credit") {
      const shortInvoiceNo = getShortInvoiceNumber(
        payload.billNumber || payload.billDetails?.billNumber || existing.billNumber || ""
      );

      if (shortInvoiceNo) {
        const installmentData = readInstallments();
        const recordIdx = installmentData.findIndex((r) => r.invoiceNo === shortInvoiceNo);

        if (recordIdx !== -1) {
          const parseAmount = (value = 0) => Number(String(value).replace(/,/g, "")) || 0;

          const newTotalPurchaseAmount = parseAmount(payload.totals?.grandTotal ?? 0);
          const advanceAmount = parseAmount(payload.paymentDetails?.advanceAmount ?? 0);

          const paidInstallmentsSum = (installmentData[recordIdx].installments || []).reduce(
            (sum, inst) => sum + parseAmount(inst.amount),
            0
          );

          // newBalance = newTotalPurchaseAmount - sumOfPaidInstallments
          const sumOfPaidInstallments = advanceAmount + paidInstallmentsSum;
          const newBalanceRaw = newTotalPurchaseAmount - sumOfPaidInstallments;

          installmentData[recordIdx].totalPurchaseAmount = newTotalPurchaseAmount;
          installmentData[recordIdx].balance = Math.max(
            0,
            Math.round(newBalanceRaw * 100) / 100
          );

          writeInstallments(installmentData);
        }
      }
    }

    // Handle inventory quantity changes when invoice is updated
    // First, restore quantities from old invoice items
    if (existing.items && Array.isArray(existing.items)) {
      existing.items.forEach((item) => {
        if (item.sku && item.quantity) {
          const quantity = Number(item.quantity) || 0;
          if (quantity > 0) {
            restoreInventoryQuantity(item.sku, quantity);
          }
        }
      });
    }

    // Then, reduce quantities from new invoice items
    if (payload.items && Array.isArray(payload.items)) {
      payload.items.forEach((item) => {
        if (item.sku && item.quantity) {
          const quantity = Number(item.quantity) || 0;
          if (quantity > 0) {
            reduceInventoryQuantity(item.sku, quantity);
          }
        }
      });
    }

    // Return invoice with populated customer details
    const invoiceWithCustomer = populateCustomerDetails(updated);

    // Activity log (Invoice update)
    try {
      if (req.user?.username && req.user?.role) {
        const previousInvoice = populateCustomerDetails(beforeInvoice);
        const updatedInvoice = invoiceWithCustomer;
        const existingInvoice = previousInvoice;

        const invoiceNumber =
          updatedInvoice.invoiceNumber ||
          updatedInvoice.billDetails?.billNumber ||
          updatedInvoice.billNumber ||
          existingInvoice.invoiceNumber ||
          existingInvoice.billDetails?.billNumber ||
          existingInvoice.billNumber ||
          req.body.invoiceNumber;

        const getChangedFields = (before, after) => {
          const changes = {};

          Object.keys(after || {}).forEach((key) => {
            const beforeVal = before?.[key];
            const afterVal = after?.[key];

            if (JSON.stringify(beforeVal) !== JSON.stringify(afterVal)) {
              changes[key] = {
                before: beforeVal,
                after: afterVal
              };
            }
          });

          return changes;
        };

        let itemChanges = [];
        const oldItems = existingInvoice.items || [];
        const newItems = updatedInvoice.items || [];

        newItems.forEach((newItem, index) => {
          const oldItem = oldItems[index];

          if (!oldItem) {
            itemChanges.push({
              addedItem: newItem.itemName || newItem.name || "unknown"
            });
            return;
          }

          const diff = getChangedFields(oldItem, newItem);
          if (Object.keys(diff).length > 0) {
            itemChanges.push({
              itemIndex: index,
              changes: diff
            });
          }
        });

        if (oldItems.length > newItems.length) {
          oldItems.slice(newItems.length).forEach((removedItem) => {
            itemChanges.push({
              removedItem: removedItem.itemName || removedItem.name || "unknown"
            });
          });
        }

        const mainChanges = getChangedFields(existingInvoice, updatedInvoice);
        if (itemChanges.length > 0) {
          mainChanges.items = itemChanges;
        }

        if (Object.keys(mainChanges).length > 0) {
          const previousInvoiceWithNumber = {
            ...previousInvoice,
            invoiceNumber,
          };
          const updatedInvoiceWithNumber = {
            ...updatedInvoice,
            invoiceNumber,
          };

          logActivity({
            username: req.user.username,
            role: req.user.role,
            page: "Invoice",
            action: "update",
            before: previousInvoiceWithNumber,
            after: updatedInvoiceWithNumber,
          });
        }
      }
    } catch (e) {
      // Never block invoice update due to activity logging
    }
    log.info('Invoice updated successfully');
    return res.json({ success: true, invoice: invoiceWithCustomer });
  } catch (error) {
    log.error('Failed to Update Invoice:', error);
    return res.status(500).json({
      error: 'Failed to Update Invoice',
      details: error.message,
    });
  }
};

const getInvoice = (req, res) => {
  log.info('Get Invoice called...');
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) {
      return res.status(400).json({ error: 'Invalid invoice id' });
    }

    const invoices = readAllInvoices();
    const invoice = invoices.find((inv) => Number(inv.id) === id);
    const userRole = req.user?.role;
    const userId = req.user?.userId;
    const role = (userRole || '').toLowerCase().replace(/\s+/g, '');

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (role !== 'superadmin' && invoice.createdBy !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Populate customer details
    const invoiceWithCustomer = populateCustomerDetails(invoice);

    // Activity log (Invoice download)
    try {
      logActivity({
        username: req.user?.username,
        role: req.user?.role,
        page: "Invoice",
        action: "download",
        after: {
          invoiceNumber:
            req.params.invoiceNumber ||
            req.body?.invoiceNumber ||
            invoiceWithCustomer.billDetails?.billNumber ||
            invoiceWithCustomer.billNumber
        }
      });
    } catch (e) {
      // Never block invoice fetch/download due to activity logging
    }
    log.info('Invoice fetched successfully');
    return res.json({ success: true, invoice: invoiceWithCustomer });
  } catch (error) {
    log.error('Failed to Get Invoice:', error);
    return res.status(500).json({
      error: 'Failed to Get Invoice',
      details: error.message,
    });
  }
};

const readAllInvoices = () => {
  const allInvoices = [];
  const invRoot = invoicesFolderPath();

  if (!fs.existsSync(invRoot)) return [];

  const years = fs.readdirSync(invRoot);

  years.forEach((year) => {
    const yearPath = path.join(invRoot, year);
    if (!fs.statSync(yearPath).isDirectory()) return;

    const months = fs.readdirSync(yearPath);

    months.forEach((month) => {
      const monthPath = path.join(yearPath, month);
      if (!fs.statSync(monthPath).isDirectory()) return;

      const days = fs.readdirSync(monthPath);

      days.forEach((dayFile) => {
        const filePath = path.join(monthPath, dayFile);
        if (dayFile.endsWith('.json')) {
          const raw = fs.readFileSync(filePath, 'utf8');
          const data = raw.trim() ? JSON.parse(raw) : [];
          allInvoices.push(...data);
        }
      });
    });
  });

  return allInvoices;
};

const listInvoices = (req, res) => {
  log.info('List Invoices called...');
  const userId = req.user?.userId || '';
  const userRole = req.user?.role || '';
  
  const role = (userRole || '').toLowerCase().replace(/\s+/g, ''); // removes spaces

  try {
    const invoices = readAllInvoices();
    const { search = '', fromDate = '', toDate = '', page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 10, 1);
    const searchTerm = String(search || '').toLowerCase().trim();
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    const filtered = invoices.filter((invoice) => {

      // ROLE-BASED FILTER
      if (role !== 'superadmin') {
        if (invoice.createdBy !== userId) {
          return false;
        }
      }

      // existing logic continues...
      const invoiceDate = invoice.billDate ? new Date(invoice.billDate) : null;

      if (from && invoiceDate && invoiceDate < from) return false;
      if (to && invoiceDate && invoiceDate > to) return false;

      if (searchTerm) {
        const invoiceWithCustomer = populateCustomerDetails(invoice);
        const billNumber = invoice.billDetails?.billNumber || invoice.billNumber;
        const customerName = invoiceWithCustomer.customerDetails?.customerName || invoice.customerName || '';
        const contactNumber = invoiceWithCustomer.customerDetails?.contactNumber || invoice.contactNumber || '';
        const haystack = [
          billNumber,
          customerName,
          contactNumber,
          ...(invoice.items || []).map((i) => i.itemName),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(searchTerm)) return false;
      }
      return true;
    });

    // sort by createdAt desc
    filtered.sort((a, b) => {
      const dateA = new Date(a.billDetails?.billDate || a.billDate || 0).getTime();
      const dateB = new Date(b.billDetails?.billDate || b.billDate || 0).getTime();
      return dateB - dateA;
    });

    const start = (pageNum - 1) * limitNum;
    const paged = filtered.slice(start, start + limitNum);

    // Populate customer details for all invoices
    const pagedWithCustomers = paged.map(populateCustomerDetails);

    log.info('Invoices fetched successfully');
    return res.json({
      data: pagedWithCustomers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalItems: filtered.length,
        totalPages: Math.ceil(filtered.length / limitNum) || 1,
      },
    });
  } catch (error) {
    log.error('Failed to List Invoices:', error);
    return res.status(500).json({
      error: 'Failed to List Invoices',
      details: error.message,
    });
  }
};

const deleteInvoice = (req, res) => {
  log.info('Delete Invoice called...');
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) {
      return res.status(400).json({ error: 'Invalid invoice id' });
    }

    // Step 1: find invoice from all files
    const allInvoices = readAllInvoices();
    const existing = allInvoices.find((inv) => Number(inv.id) === id);

    const userRole = req.user?.role;
    const userId = req.user?.userId;

    const role = (userRole || '').toLowerCase().replace(/\s+/g, '');

    if (!existing) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (role !== 'superadmin' && existing.createdBy !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Step 2: open correct date file
    const billDate = existing.billDate;
    const invoices = readInvoices(billDate);

    const invoiceIdx = invoices.findIndex((inv) => Number(inv.id) === id);
    invoices.splice(invoiceIdx, 1);

    // Step 3: save back to same file
    writeInvoices(billDate, invoices);

    // Activity log (Invoice delete)
    try {
      if (req.user?.username && req.user?.role) {
        logActivity({
          username: req.user.username,
          role: req.user.role,
          page: "Invoice",
          action: "delete",
          before: {
            invoiceNumber:
              existing.billDetails?.billNumber || existing.billNumber || "",
          },
        });
      }
    } catch (e) {
      // Never block invoice deletion due to activity logging
    }

    log.info('Invoice deleted successfully');
    return res.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error) {
    log.error('Failed to Delete Invoice:', error);
    return res.status(500).json({
      error: 'Failed to Delete Invoice',
      details: error.message,
    });
  }
};


const getShortInvoiceNumber = (billNumber) =>
  typeof billNumber === "string" ? billNumber.split("-").pop() || "" : "";

const sumInstallments = (installments = []) =>
  installments.reduce(
    (sum, inst) => sum + Number(inst.amount || 0),
    0
  );

const getPaymentStatus = (grandTotal, paidAmount) => paidAmount >= grandTotal ? "Cleared" : "Pending";

const getCreditInvoices = (req, res) => {
  try {
    let invoices = readAllInvoices();
    const userId = req.user?.userId || '';
    const role = (req.user?.role || '').toLowerCase().replace(/\s+/g, '');

    // ROLE-BASED FILTER
    if (role !== 'superadmin') {
      invoices = invoices.filter((invoice) => {
        return invoice.createdBy === userId;
      });
    }
    //Filter credit invoices
    const creditInvoices = invoices.filter(
      (invoice) => invoice.paymentMode === "credit"
    );

    //Sort by createdAt DESC
    creditInvoices.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
    const skip = (page - 1) * limit;

    const totalRecords = creditInvoices.length;
    const totalPages = Math.ceil(totalRecords / limit);

    //Pagination + transformation
    const invoiceList = creditInvoices
      .map((invoice) => {
        const grandTotal = Number(invoice.totals?.grandTotal || 0);
        const advanceAmount = Number(
          invoice.paymentDetails?.advanceAmount || 0
        );

        // Customer details - handle both customerId-based and direct customerName
        const customersData = populateCustomerDetails(invoice);
        let customerTitle = '';
        let customerName = '';
        let contactNumber = '';

        if (customersData.customerDetails) {
          // Invoice has customerId and was populated from Customer.json
          customerTitle = customersData.customerDetails.customerTitle || '';
          customerName = customersData.customerDetails.customerName || '';
          contactNumber = customersData.customerDetails.contactNumber || '';
        } else if (invoice.customerName) {
          // Invoice has customerName directly (legacy format or no customerId)
          const nameStr = invoice.customerName || '';
          const titleMatch = nameStr.match(/^(Mr|Mrs|Ms|Miss|Dr)\s+(.+)$/);
          if (titleMatch) {
            customerTitle = titleMatch[1];
            customerName = titleMatch[2];
          } else {
            customerName = nameStr;
          }
          contactNumber = invoice.contactNumber || '';
        }

        const fullCustomerName = customerTitle ? `${customerTitle} ${customerName}`.trim() : customerName;

        const billNum = invoice.billDetails?.billNumber || invoice.billNumber || "";
        const shortInvoiceNo = getShortInvoiceNumber(billNum);
        const fullBillNumber = billNum || shortInvoiceNo;

        // Installments lookup (by short id)
        const { installments, balance } =
          getInstallmentByInvoice(shortInvoiceNo);

        const installmentPaid = installments.reduce(
          (sum, inst) => sum + Number(inst.amount || 0),
          0
        );

        const paidAmount = advanceAmount + installmentPaid;

        const pendingAmount =
          balance > 0
            ? balance
            : Math.max(grandTotal - paidAmount, 0);

        // When balance is 0 or effectively zero (e.g. rounding), show Cleared
        const BALANCE_CLEARED_THRESHOLD = 0.01;
        const status =
          Number(balance) < BALANCE_CLEARED_THRESHOLD || paidAmount >= grandTotal ? "Cleared" : "Pending";
        const details = customersData.customerDetails || {};
        return {
          srNo: details.srNo || details.id || 0,
          customerName: fullCustomerName || invoice.customerName || '',
          contactNumber: contactNumber || invoice.contactNumber || '',
          customerTitle: customerTitle || details.customerTitle || '',
          address: details.address || invoice.address || '',
          email: details.email !== undefined && details.email !== null ? details.email : (invoice.email || ''),
          state: details.state || invoice.state || '',
          city: details.city || invoice.city || '',
          panAadharType: details.panAadharType || invoice.panAadharType || 'PAN',
          panAadharNumber: details.panAadharNumber || invoice.panAadharNumber || '',
          invoice: fullBillNumber,
          createdAt: invoice.createdAt,
          grandTotal,
          paidAmount,
          pendingAmount,
          status,
          customerInstallmentData: {
            paymentBy: "credit",
            totalPurchaseAmount: grandTotal,
            advAmount: advanceAmount,
            invoiceNo: fullBillNumber,
            invoiceShort: shortInvoiceNo,
            purchasedItems: invoice.items?.map(
              (item) => `${item.quantity || 1} × ${item.itemName || 'N/A'}`
            ) || [],
            installments,
            balance: pendingAmount,
            billDate: invoice.billDetails?.billDate || invoice.billDate || '',
          },
        };
      });
    const data = invoiceList.sort((a, b) => {
      if (a.status === "Pending" && b.status === "Cleared") return -1;
      if (a.status === "Cleared" && b.status === "Pending") return 1;
      return 0;
    }).slice(skip, skip + limit);
    return res.status(200).json({
      success: true,
      pagination: { page, limit, totalItems: totalRecords, totalPages, totalRecords },
      data,
    });
  } catch (error) {
    log.error("Get Credit Card Invoices Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getChequeInvoices = (req, res) => {
  try {
    const userId = req.user?.userId || '';
    const role = (req.user?.role || '').toLowerCase().replace(/\s+/g, '');
    let invoices = readAllInvoices();
    if (role !== 'superadmin') {
      invoices = invoices.filter((inv) => inv.createdBy === userId);
    }
    const chequeInvoices = invoices.filter(
      (inv) => (inv.paymentMode || '').toLowerCase() === 'check'
    );
    // Sort: Pending (and other non-Cleared) first, then by date descending
    const statusOrder = (s) => ((s || '').toLowerCase() === 'cleared' ? 1 : 0);
    chequeInvoices.sort((a, b) => {
      const statusA = (a.paymentDetails?.checkStatus || 'Pending').toLowerCase();
      const statusB = (b.paymentDetails?.checkStatus || 'Pending').toLowerCase();
      const orderA = statusOrder(statusA);
      const orderB = statusOrder(statusB);
      if (orderA !== orderB) return orderA - orderB;
      return new Date(b.createdAt || b.billDate || 0).getTime() - new Date(a.createdAt || a.billDate || 0).getTime();
    });

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
    const skip = (page - 1) * limit;
    const totalRecords = chequeInvoices.length;
    const totalPages = Math.ceil(totalRecords / limit);

    const data = chequeInvoices.slice(skip, skip + limit).map((inv, i) => {
      const details = populateCustomerDetails(inv);
      const customerName = (details.customerDetails?.customerTitle || '') + ' ' + (details.customerDetails?.customerName || '');
      const contactNumber = details.customerDetails?.contactNumber || '';
      const billNum = inv.billDetails?.billNumber || inv.billNumber || "";
      const invoiceNumber = billNum || getShortInvoiceNumber(billNum);
      const chequeNumber = inv.paymentDetails?.checkNumber || '';
      const status = inv.paymentDetails?.checkStatus || 'Pending';
      return {
        id: inv.id,
        srNo: skip + i + 1,
        customerName: customerName.trim(),
        contactNumber,
        invoiceNumber,
        chequeNumber,
        status: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase(),
      };
    });

    return res.status(200).json({
      success: true,
      pagination: { page, limit, totalRecords, totalPages },
      data,
    });
  } catch (error) {
    log.error('Get Cheque Invoices Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const updateChequeStatus = (req, res) => {
  log.info('Update Cheque Status called...');
  try {
    const userId = req.user?.userId || '';
    const role = (req.user?.role || '').toLowerCase().replace(/\s+/g, '');
    const id = parseInt(req.params.id, 10);
    const { status } = req.body || {};
    if (!id) {
      return res.status(400).json({ success: false, message: 'Invalid invoice id' });
    }
    const validStatuses = ['Pending', 'Cleared', 'Bounced', 'Cancelled', 'Returned'];
    const newStatus = validStatuses.includes(status) ? status : 'Pending';

    // Step 1: find invoice
    let allInvoices = readAllInvoices();
    if (role !== 'superadmin') {
      allInvoices = allInvoices.filter((inv) => inv.createdBy === userId);
    }
    const existing = allInvoices.find((inv) => Number(inv.id) === id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Step 2: open correct date file
    const billDate = existing.billDate;
    const invoices = readInvoices(billDate);

    const idx = invoices.findIndex((inv) => Number(inv.id) === id);
    const inv = invoices[idx];

    if ((inv.paymentMode || '').toLowerCase() !== 'check') {
      return res.status(400).json({ success: false, message: 'Invoice is not a cheque payment' });
    }
    inv.paymentDetails = inv.paymentDetails || {};
    inv.paymentDetails.checkStatus = newStatus;
    inv.updatedAt = new Date().toISOString();
    invoices[idx] = inv;
    writeInvoices(billDate, invoices);

    log.info('Cheque status updated successfully');
    return res.status(200).json({
      success: true,
      data: { id, status: newStatus },
    });
  } catch (error) {
    log.error('Failed to Update Cheque Status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to Update Cheque Status',
    });
  }
};

const listInvoicesByDate = (req, res) => {
  try {
    const { billDate } = req.query;

    if (!billDate) {
      return res.status(400).json({ error: "billDate is required" });
    }

    const invoices = readInvoices(billDate);

    return res.json({
      success: true,
      data: invoices,
    });
  } catch (error) {
    log.error("Error fetching invoices by date:", error);
    return res.status(500).json({
      error: "Failed to fetch invoices",
      details: error.message,
    });
  }
};


// Export helper functions for use in other controllers
module.exports = {
  readInvoices,
  writeInvoices,
  readAllInvoices,
  validateInvoice,
  createInvoice,
  updateInvoice,
  getInvoice,
  listInvoices,
  deleteInvoice,
  getCreditInvoices,
  getChequeInvoices,
  updateChequeStatus,
  listInvoicesByDate,
};
