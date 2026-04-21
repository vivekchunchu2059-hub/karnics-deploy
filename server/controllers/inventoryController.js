const fs = require('fs');
const path = require('path');
const { dataPath } = require('../paths');
const { logActivity } = require('./activityLogController');
const log = require('../logger');

const inventoryFilePath = () => dataPath('Inventory', 'Inventory.json');
const imagesDir = () => dataPath('Inventory', 'images');

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

const ensureInventoryFile = () => {
  const fp = inventoryFilePath();
  const dir = path.dirname(fp);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(fp)) {
    fs.writeFileSync(fp, '[]', 'utf8');
  }
};

const ensureImagesDir = () => {
  const dir = imagesDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

/**
 * Save base64 image to data/Inventory/images/ using SKU as filename.
 * SKU is unique, so each product's image is saved as <SKU>.jpg or <SKU>.png.
 * Updating the same product overwrites the same file.
 * Returns the filename (e.g. "GNCL22K.jpg") or empty string on failure.
 * Enforces max size (2MB).
 */
const saveImageFromBase64 = (base64Data, sku) => {
  if (!base64Data || typeof base64Data !== 'string') return '';
  const match = base64Data.match(/^data:image\/(jpeg|jpg|png);base64,(.+)$/);
  if (!match) return '';
  const ext = match[1] === 'png' ? 'png' : 'jpg';
  const base64 = match[2];
  const buffer = Buffer.from(base64, 'base64');
  if (buffer.length > MAX_IMAGE_SIZE_BYTES) return '';
  const safeSku = (sku || '').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  if (!safeSku) return '';
  ensureImagesDir();
  const filename = `${safeSku}.${ext}`;
  const filePath = path.join(imagesDir(), filename);  
  fs.writeFileSync(filePath, buffer);
  return filename;
};

const readInventoryFile = () => {
  ensureInventoryFile();

  const raw = fs.readFileSync(inventoryFilePath(), 'utf8');
  if (!raw.trim()) {
    return [];
  }

  return JSON.parse(raw);
};

const writeInventoryFile = (inventoryData) => {
  ensureInventoryFile();
  fs.writeFileSync(inventoryFilePath(), JSON.stringify(inventoryData, null, 2), 'utf8');
};

const getInventory = (req, res) => {
  log.info('Get Inventory called...');
  try {
    const inventory = readInventoryFile();
    const page = parseInt(req.query.page, 10);
    const limit = parseInt(req.query.limit, 10);
    const shouldPaginate =
      Number.isInteger(page) && page > 0 && Number.isInteger(limit) && limit > 0;

    if (shouldPaginate) {
      const startIndex = (page - 1) * limit;
      const pagedData = inventory.slice(startIndex, startIndex + limit);
      const endIndex = pagedData.length ? startIndex + pagedData.length - 1 : -1;
      const totalItems = inventory.length;
      const totalPages = limit ? Math.ceil(totalItems / limit) : 0;

      return res.json({
        data: pagedData,
        pagination: {
          page,
          limit,
          totalItems,
          totalPages,
          startIndex,
          endIndex,
        },
      });
    }
    log.info('Inventory fetched successfully');
    return res.json(inventory);
  } catch (error) {
    log.error('Failed to Fetch Inventory:', error);
    return res.status(500).json({
      error: 'Failed to Fetch Inventory',
      details: error.message,
    });
  }
};

const addProduct = (req, res) => {
  log.info('Add Product called...');
  try {
    const data = req.body;
    const inventory = readInventoryFile();

    const { metal, category, sku } = data;

    let imageFilename = '';
    if (data.image && data.image.startsWith('data:image/')) {
      imageFilename = saveImageFromBase64(data.image, sku || `p${Date.now()}`);
    } else if (typeof data.image === 'string' && data.image.trim()) {
      imageFilename = data.image.trim();
    }

    const productData = {
      product: data.product,
      sku: data.sku,
      weight: data.weight,
      purity: data.purity,
      color: data.color,
      price: data.price,
      quantity: data.quantity,
      image: imageFilename
    };

    let group = inventory.find(
      g => g.metal === metal && g.categoryName === category
    );

    if (group) {
      group.category.push(productData);
    } else {
      const newGroup = {
        id: Date.now(),
        metal: metal,
        categoryName: category,
        category: [productData],
      };
      inventory.push(newGroup);
    }
    writeInventoryFile(inventory);
    log.info('Product added successfully');
    // Activity log (Inventory create)
    try {
      logActivity({
        username: req.user.username,
        role: req.user.role,
        page: "Inventory",
        action: "create",
        after: { sku: productData.sku || "" },
      });
    } catch (e) {
      // Never block inventory create due to activity logging
    }
    return res.json({ success: true });
  } catch (err) {
    log.error('Failed to Add Product:', err);
    return res.status(500).json({
      error: 'Failed to Add Product'
    });
  }
};

const updateProduct = (req, res) => {
  log.info('Update Product called...');
  const sku = req.params.sku;
  const updated = req.body;
  const inventory = readInventoryFile();

  let imageFilename = updated.image;
  if (updated.image && updated.image.startsWith('data:image/')) {
    imageFilename = saveImageFromBase64(updated.image, sku);
  }

  for (const group of inventory) {
    const index = group.category.findIndex(p => p.sku === sku);
    if (index !== -1) {
      const originalData = { ...group.category[index] };
      group.category[index] = {
        ...group.category[index],
        ...updated,
        ...(imageFilename !== undefined && { image: imageFilename }),
      };
      writeInventoryFile(inventory);
      log.info('Inventory updated successfully');
      // Activity log (Inventory update)
      try {
        const updatedProduct = group.category[index];
        const beforeDiff = {};
        const afterDiff = {};

        Object.keys(updatedProduct).forEach((key) => {
          if (originalData[key] !== updatedProduct[key]) {
            beforeDiff[key] = originalData[key];
            afterDiff[key] = updatedProduct[key];
          }
        });

        if (Object.keys(afterDiff).length > 0) {
          logActivity({
            username: req.user.username,
            role: req.user.role,
            page: "Inventory",
            action: "update",
            before: { sku, ...beforeDiff },
            after: { sku, ...afterDiff },
          });
        }
      } catch (e) {
        log.error('Failed to Update Product:', e);
        // Never block inventory update due to activity logging
      }
      return res.json({ success: true });
    }
  }
  res.status(404).json({ error: "Product not found" });
};



const deleteProduct = (req, res) => {
  log.info('Delete Product called...');
  const sku = req.params.sku;
  const inventory = readInventoryFile();

  for (const group of inventory) {
    const index = group.category.findIndex(p => p.sku === sku);
    if (index !== -1) {
      group.category.splice(index, 1);
      writeInventoryFile(inventory);
      log.info('Product deleted successfully');
      // Activity log (Inventory delete)
      try {
        logActivity({
          username: req.user.username,
          role: req.user.role,
          page: "Inventory",
          action: "delete",
          before: { sku },
        });
      } catch (e) {
        log.error('Failed to Delete Product:', e);
        // Never block inventory delete due to activity logging
      }
      return res.json({ success: true });
    }
  }
  res.status(404).json({ error: "Product not found" });
};

const getProductImage = (req, res) => {
  const filename = req.params.filename;
  if (!filename || filename.includes('..') || filename.includes('/')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  const filePath = path.join(imagesDir(), filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Image not found' });
  }
  res.sendFile(filePath);
};

/**
 * Reduce inventory quantity by SKU
 * @param {string} sku - Product SKU
 * @param {number} quantity - Quantity to reduce
 * @returns {boolean} - True if successful, false if product not found or insufficient quantity
 */
const reduceInventoryQuantity = (sku, quantity) => {
  if (!sku || !quantity || quantity <= 0) {
    return false;
  }
  
  const inventory = readInventoryFile();
  
  for (const group of inventory) {
    const productIndex = group.category.findIndex(p => p.sku === sku);
    if (productIndex !== -1) {
      const product = group.category[productIndex];
      const currentQuantity = Number(product.quantity) || 0;
      const newQuantity = Math.max(0, currentQuantity - quantity);
      
      group.category[productIndex] = {
        ...product,
        quantity: newQuantity,
      };
      
      writeInventoryFile(inventory);
      return true;
    }
  }
  
  return false;
};

/**
 * Restore inventory quantity by SKU (used when invoice is updated or deleted)
 * @param {string} sku - Product SKU
 * @param {number} quantity - Quantity to restore
 * @returns {boolean} - True if successful, false if product not found
 */
const restoreInventoryQuantity = (sku, quantity) => {
  if (!sku || !quantity || quantity <= 0) {
    return false;
  }
  
  const inventory = readInventoryFile();
  
  for (const group of inventory) {
    const productIndex = group.category.findIndex(p => p.sku === sku);
    if (productIndex !== -1) {
      const product = group.category[productIndex];
      const currentQuantity = Number(product.quantity) || 0;
      
      group.category[productIndex] = {
        ...product,
        quantity: currentQuantity + quantity,
      };
      
      writeInventoryFile(inventory);
      return true;
    }
  }
  
  return false;
};

module.exports = {
  getInventory,
  addProduct,
  updateProduct,
  deleteProduct,
  getProductImage,
  reduceInventoryQuantity,
  restoreInventoryQuantity,
};
