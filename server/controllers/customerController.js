const fs = require('fs');
const path = require('path');
const { dataPath } = require('../paths');
const { logActivity } = require("./activityLogController");
const log = require('../logger');

const customerFilePath = () => dataPath('Customers', 'Customer.json');

const ensureFile = (filePath) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '[]', 'utf8');
  }
};

const readCustomers = () => {
  const fp = customerFilePath();
  ensureFile(fp);
  const raw = fs.readFileSync(fp, 'utf8');
  return raw.trim() ? JSON.parse(raw) : [];
};

const writeCustomers = (data) => {
  const fp = customerFilePath();
  ensureFile(fp);
  fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
};

// Get customer by ID (supports both id and srNo)
const getCustomerById = (customerId) => {
  const customers = readCustomers();
  return customers.find((c) => c.id === customerId || c.srNo === customerId);
};

// Update customer details (internal function, not exported as API endpoint)
const updateCustomerDetails = (customerId, customerDetails) => {
  if (!customerId || !customerDetails) {
    return;
  }
  const customers = readCustomers();
  const customerIdx = customers.findIndex((c) => (c.id === customerId || c.srNo === customerId));
  if (customerIdx === -1) {
    return;
  }
  const existing = customers[customerIdx];
  // Update customer with new details (only update fields that are provided)
  customers[customerIdx] = {
    ...existing,
    customerTitle: customerDetails.customerTitle !== undefined ? customerDetails.customerTitle : existing.customerTitle,
    customerName: customerDetails.customerName !== undefined ? customerDetails.customerName : existing.customerName,
    state: customerDetails.state !== undefined ? customerDetails.state : existing.state,
    city: customerDetails.city !== undefined ? customerDetails.city : existing.city,
    panAadharType: customerDetails.panAadharType !== undefined ? customerDetails.panAadharType : existing.panAadharType,
    panAadharNumber: customerDetails.panAadharNumber !== undefined ? customerDetails.panAadharNumber : existing.panAadharNumber,
    address: customerDetails.address !== undefined ? customerDetails.address : existing.address,
    contactNumber: customerDetails.contactNumber !== undefined ? customerDetails.contactNumber : (existing.contactNumber || existing.phone),
    email: customerDetails.email !== undefined && customerDetails.email !== null && customerDetails.email !== ''
      ? customerDetails.email
      : (customerDetails.email === '' ? undefined : existing.email),
    id: existing.id || existing.srNo,
    createdAt: existing.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  writeCustomers(customers);
};

// Find or create customer based on customer details
const findOrCreateCustomer = (customerDetails, shouldUpdate = false, userId = '') => {
  log.info('Create Customer called...');
  if (!customerDetails || (typeof customerDetails !== 'object')) {
    throw new Error('Invalid customer details provided');
  }
  const customers = readCustomers();
  // Extract customer details
  const customerTitle = customerDetails.customerTitle || '';
  const customerName = (customerDetails.customerName || '').trim();
  const contactNumber = customerDetails.contactNumber || '';
  const panAadharNumber = customerDetails.panAadharNumber || '';
  // Validate that we have at least a name or contact number
  if (!customerName && !contactNumber) {
    throw new Error('Customer name or contact number is required');
  }

  // IMPORTANT: First check if BOTH name AND phone match (prevent duplicates)
  // Only if BOTH are the same, return existing customer
  // If either name OR phone is different, allow creating new customer
  if (customerName && contactNumber) {
    const phoneDigits = contactNumber.replace(/\D/g, '');
    const nameLower = customerName.toLowerCase().trim();
    if (phoneDigits) {
      const existing = customers.find((c) => {
        if (userId && c.createdBy && c.createdBy !== userId) {
          return false;
        }
        const existingPhone = (c.contactNumber || c.phone || '').replace(/\D/g, '');
        const existingName = (c.customerName || '').trim().toLowerCase();
        // Check if BOTH phone AND name match
        return (
          existingPhone &&
          existingPhone === phoneDigits &&
          existingName === nameLower
        );
      });
      if (existing) {
        const customerId = existing.id || existing.srNo;
        // Update customer if shouldUpdate is true
        if (shouldUpdate) {
          updateCustomerDetails(customerId, customerDetails);
        }
        return customerId;
      }
    }
  }
  // Try to find by name + panAadharNumber
  if (customerName && panAadharNumber) {
    const existing = customers.find((c) => {
      if (userId && c.createdBy && c.createdBy !== userId) {
        return false;
      }
      const existingName = (c.customerName || '').toLowerCase().trim();
      const existingPan = (c.panAadharNumber || '').toLowerCase().trim();
      return existingName === customerName.toLowerCase().trim() && existingPan === panAadharNumber.toLowerCase().trim();
    });
    if (existing) {
      const customerId = existing.id || existing.srNo;
      // Update customer if shouldUpdate is true
      if (shouldUpdate) {
        updateCustomerDetails(customerId, customerDetails);
      }
      log.info('Customer found and updated successfully');
      return customerId;
    }
  }
  // Create new customer
  const existingIds = customers.map((c) => c.id || c.srNo || 0);
  const nextId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
  const newCustomer = {
    id: nextId,
    customerTitle: customerTitle || '',
    customerName: customerName || '',
    state: customerDetails.state || '',
    city: customerDetails.city || '',
    panAadharType: customerDetails.panAadharType || 'PAN',
    panAadharNumber: panAadharNumber || '',
    address: customerDetails.address || undefined, // Can be undefined (optional field)
    contactNumber: contactNumber || '',
    email: customerDetails.email || undefined, // Can be undefined (optional field)
    createdAt: new Date().toISOString(),
    createdBy: userId || ''
  };
  customers.push(newCustomer);
  writeCustomers(customers);
  log.info('Customer created successfully');
  return newCustomer.id;
};

// Populate customer details in invoice or any object with customerId
const populateCustomerDetails = (obj) => {
  if (!obj || !obj.customerId) {
    return obj;
  }
  const customer = getCustomerById(obj.customerId);
  if (!customer) {
    return obj;
  }
  return {
    ...obj,
    customerDetails: {
      srNo: customer.srNo || customer.id || 0,
      customerTitle: customer.customerTitle || '',
      customerName: customer.customerName || '',
      state: customer.state || '',
      city: customer.city || '',
      panAadharType: customer.panAadharType || 'PAN',
      panAadharNumber: customer.panAadharNumber || '',
      address: customer.address || customer.customerAddress || '',
      contactNumber: customer.contactNumber || customer.phone || '',
      email: customer.email || undefined, // Can be undefined (optional field)
    },
  };
};

// Convert JSON customer data to CustomerDetails format
const mapToCustomerDetails = (customer) => {
  return {
    srNo: customer.srNo || customer.id || 0, // Use id if srNo doesn't exist
    customerName: customer.customerName || '',
    address: customer.address || customer.customerAddress || '',
    city: customer.city || '',
    contactNumber: customer.contactNumber || customer.phone || '',
    // Additional fields from JSON that might not be in CustomerDetails
    pincode: customer.pincode || '',
    email: customer.email || '',
    // Default values for CustomerDetails required fields
    panAadharType: customer.panAadharType || 'PAN',
    panAadharNumber: customer.panAadharNumber || '',
    customerTitle: customer.customerTitle || '',
    state: customer.state || '',
  };
};

const listCustomers = (req, res) => {
  log.info('List Customers called...');
  try {
    const customers = readCustomers();
    const { page = 1, limit = 10, search = '' } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 10, 1);
    const searchTerm = String(search || '').toLowerCase().trim();

    const userId = req.user?.userId || '';
    const role = (req.user?.role || '').toLowerCase().replace(/\s+/g, '');
    // Filter customers based on search term
    let filtered = customers.filter((customer) => {
      if (role !== 'superadmin') {
        return customer.createdBy === userId;
      }
      return true;
    });

    if (searchTerm) {
      filtered = filtered.filter((customer) => {
        const haystack = [
          customer.customerName,
          customer.address || customer.customerAddress,
          customer.city,
          customer.contactNumber || customer.phone,
          customer.email,
          customer.pincode,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(searchTerm);
      });
    }

    // Sort by createdAt (newest first) or by id (descending) if createdAt is not available
    filtered.sort((a, b) => {
      // First try to sort by createdAt (newest first)
      if (a.createdAt && b.createdAt) {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA; // Descending order (newest first)
      }
      // If createdAt is not available, sort by id (descending - highest ID first)
      const aId = a.srNo || a.id || 0;
      const bId = b.srNo || b.id || 0;
      return bId - aId; // Descending order (newest first)
    });

    // Paginate
    const start = (pageNum - 1) * limitNum;
    const paged = filtered.slice(start, start + limitNum);

    // Map to CustomerDetails format
    const mappedData = paged.map(mapToCustomerDetails);

    log.info('Customers listed successfully');
    return res.json({
      data: mappedData,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalItems: filtered.length,
        totalPages: Math.ceil(filtered.length / limitNum) || 1,
      },
    });
  } catch (error) {
    log.error('Failed to list Customers:', error);
    return res.status(500).json({
      error: 'Failed to list Customers',
      details: error.message,
    });
  }
};

const getCustomer = (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const customer = getCustomerById(id);

    const userId = req.user?.userId || '';
    const role = (req.user?.role || '').toLowerCase().replace(/\s+/g, '');

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    if (role !== 'superadmin' && customer.createdBy !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    return res.json(mapToCustomerDetails(customer));
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to get customer',
      details: error.message,
    });
  }
};

const createCustomer = (req, res) => {
  log.info('Create Customer called...');
  try {
    const payload = req.body || {};
    // Validate required fields
    const errors = [];
    if (!payload.customerName || typeof payload.customerName !== 'string' || !payload.customerName.trim()) {
      errors.push('customerName is required');
    }
    if (!payload.contactNumber || typeof payload.contactNumber !== 'string' || !payload.contactNumber.trim()) {
      errors.push('contactNumber is required');
    }
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    // Check if customer already exists
    const customers = readCustomers();
    const phoneDigits = payload.contactNumber.replace(/\D/g, '');
    const nameLower = payload.customerName.trim().toLowerCase();

    const existing = customers.find((c) => {
      const existingPhone = (c.contactNumber || c.phone || '').replace(/\D/g, '');
      const existingName = (c.customerName || '').trim().toLowerCase();

      return (
        existingPhone &&
        existingPhone === phoneDigits &&
        existingName === nameLower
      );
    });
    if (existing) {
      log.warn('Customer already exists');
      return res.status(400).json({
        error: 'Customer already exists',
        customerId: existing.id || existing.srNo,
      });
    }
    // Create new customer
    const existingIds = customers.map((c) => c.id || c.srNo || 0);
    const nextId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
    const newCustomer = {
      id: nextId,
      customerTitle: payload.customerTitle || '',
      customerName: payload.customerName || '',
      state: payload.state || '',
      city: payload.city || '',
      panAadharType: payload.panAadharType || 'PAN',
      panAadharNumber: payload.panAadharNumber || '',
      address: payload.address || payload.customerAddress || '',
      contactNumber: payload.contactNumber || '',
      email: payload.email || undefined, // Can be undefined (optional field)
      createdAt: new Date().toISOString(),
      createdBy: req.user?.userId || ''
    };
    customers.push(newCustomer);
    writeCustomers(customers);
    log.info('Customer created successfully');
    return res.status(201).json({
      success: true,
      customer: mapToCustomerDetails(newCustomer),
    });
  } catch (error) {
    log.error('Failed to create Customer:', error);
    return res.status(500).json({
      error: 'Failed to create Customer',
      details: error.message,
    });
  }
};

const updateCustomer = (req, res) => {
  log.info('Update Customer called...');
  try {
    const id = parseInt(req.params.id, 10);
    const payload = req.body || {};
    const customers = readCustomers();
    const customerIdx = customers.findIndex((c) => (c.id === id || c.srNo === id));
    const userId = req.user?.userId || '';
    const role = (req.user?.role || '').toLowerCase().replace(/\s+/g, '');

    if (customerIdx === -1) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    const existing = customers[customerIdx];

    if (!existing) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    if (role !== 'superadmin' && existing.createdBy !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    // Validate contact number uniqueness if being updated
    if (payload.contactNumber && payload.contactNumber !== existing.contactNumber && payload.contactNumber !== existing.phone) {
      const phoneDigits = payload.contactNumber.replace(/\D/g, '');
      const duplicate = customers.find((c, idx) => {
        if (idx === customerIdx) return false;
        const existingPhone = (c.contactNumber || c.phone || '').replace(/\D/g, '');
        return existingPhone && existingPhone === phoneDigits;
      });
      if (duplicate) {
        return res.status(400).json({
          error: 'Contact number already exists for another customer',
        });
      }
    }
    // Update customer
    const updated = {
      ...existing,
      customerTitle: payload.customerTitle !== undefined ? payload.customerTitle : existing.customerTitle,
      customerName: payload.customerName !== undefined ? payload.customerName : existing.customerName,
      state: payload.state !== undefined ? payload.state : existing.state,
      city: payload.city !== undefined ? payload.city : existing.city,
      panAadharType: payload.panAadharType !== undefined ? payload.panAadharType : existing.panAadharType,
      panAadharNumber: payload.panAadharNumber !== undefined ? payload.panAadharNumber : existing.panAadharNumber,
      address: payload.address !== undefined ? payload.address : (payload.customerAddress !== undefined ? payload.customerAddress : existing.address || existing.customerAddress),
      contactNumber: payload.contactNumber !== undefined ? payload.contactNumber : (existing.contactNumber || existing.phone),
      email: payload.email !== undefined ? payload.email : existing.email,
      id: existing.id || existing.srNo,
      createdAt: existing.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    customers[customerIdx] = updated;
    log.info('Customer updated successfully');
    writeCustomers(customers);

    // Activity log (Customer update)
    try {
      if (req.user?.username && req.user?.role) {
        const beforeMapped = mapToCustomerDetails(existing);
        const afterMapped = mapToCustomerDetails(updated);
        const beforeDiff = {};
        const afterDiff = {};

        Object.keys(afterMapped).forEach((key) => {
          if (beforeMapped[key] !== afterMapped[key]) {
            beforeDiff[key] = beforeMapped[key];
            afterDiff[key] = afterMapped[key];
          }
        });

        if (Object.keys(afterDiff).length > 0) {
          logActivity({
            username: req.user.username,
            role: req.user.role,
            page: "Customer",
            action: "update",
            before: beforeDiff,
            after: afterDiff,
          });
        }
      }
    } catch (e) {
      // Never block customer update due to activity logging
    }

    return res.json({
      success: true,
      customer: mapToCustomerDetails(updated),
    });
  } catch (error) {
    log.error('Failed to update Customer:', error);
    return res.status(500).json({
      error: 'Failed to update customer',
      details: error.message,
    });
  }
};

const deleteCustomer = (req, res) => {
  log.info('Delete Customer called...');
  try {
    const id = parseInt(req.params.id, 10);
    const customers = readCustomers();
    const customerIdx = customers.findIndex((c) => (c.id === id || c.srNo === id));
    const userId = req.user?.userId || '';
    const role = (req.user?.role || '').toLowerCase().replace(/\s+/g, '');

    if (customerIdx === -1) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const existing = customers[customerIdx];
    if (!existing) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    if (role !== 'superadmin' && existing.createdBy !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    // Check if customer is referenced in invoices (optional check - you may want to prevent deletion if invoices exist)
    // This would require importing invoice functions, so we'll skip it for now
    // You can add this check later if needed
    customers.splice(customerIdx, 1);
    writeCustomers(customers);
    log.info('Customer deleted successfully');
    return res.json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    log.error('Failed to delete Customer:', error);
    return res.status(500).json({
      error: 'Failed to delete customer',
      details: error.message,
    });
  }
};

module.exports = {
  readCustomers,
  writeCustomers,
  getCustomerById,
  findOrCreateCustomer,
  populateCustomerDetails,
  updateCustomerDetails,
  listCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};