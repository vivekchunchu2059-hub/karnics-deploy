/**
 * Shared Express API (all /api/* routes + /sync + /customer-id).
 * Used by server/server.js (npm run server) and launcher.js (JewelleryApp.exe).
 */
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { requireAuth } = require('./middleware/auth');
const { getDataRoot, getMetalsConfigPath } = require('./paths');

const inventoryRoutes = require('./routes/inventoryRoutes');
const configRoutes = require('./routes/configRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const salesRoutes = require('./routes/salesRoutes');
const customerRoutes = require('./routes/customerRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const loginRoutes = require('./routes/loginRoutes');
const profileRoutes = require('./routes/profileRoutes');
const roleRoutes = require('./routes/roleRoutes');
const userRoutes = require('./routes/userRoutes');
const dataSyncRoutes = require('./routes/dataSyncRoutes');
const activityLogRoutes = require('./routes/activityLogRoutes');
const syncRoutes = require('./routes/syncRoutes');
const installmentRoutes = require('./routes/installmentRoute');
const settingsRoutes = require('./routes/settingsRoutes');
const customerIdRoutes = require('./routes/customerIdRoutes');

const { getLocalIP } = require('./controllers/registrationController');

function ensureDataStores() {
  const root = getDataRoot();
  const metalsFile = getMetalsConfigPath();

  const entries = [
    { dir: path.join(root, 'Inventory'), file: path.join(root, 'Inventory', 'Inventory.json') },
    { dir: path.join(root, 'Inventory', 'images'), file: null },
    { dir: path.join(root, 'Customers'), file: path.join(root, 'Customers', 'Customer.json') },
    { dir: path.join(root, 'Roles'), file: path.join(root, 'Roles', 'Roles.json') },
    { dir: path.join(root, 'Installments'), file: path.join(root, 'Installments', 'Installments.json') },
    { dir: path.join(root, 'Users'), file: path.join(root, 'Users', 'Users.json') },
    { dir: path.join(root, 'DataSync'), file: path.join(root, 'DataSync', 'dataSync.json') },
    { dir: path.join(root, 'registration'), file: path.join(root, 'registration', 'registration.json') },
    { dir: path.join(root, 'settings'), file: path.join(root, 'settings', 'company.json') },
    { dir: path.join(root, 'Invoices'), file: null },
    { dir: path.join(root, 'Sales'), file: null },
    { dir: path.dirname(metalsFile), file: metalsFile },
  ];

  entries.forEach(({ dir, file }) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (file && !fs.existsSync(file)) {
      const defaultValue = file.includes('company.json') ? '{}' : '[]';
      fs.writeFileSync(file, defaultValue, 'utf8');
    }
  });
}

/**
 * @param {object} options
 * @param {string} options.jsonBodyLimit - e.g. "50mb" (required)
 * @param {function} [options.requestLogger] - Express middleware (req,res,next) for HTTP logging
 */
function createApiApp(options = {}) {
  const { jsonBodyLimit, requestLogger } = options;
  if (!jsonBodyLimit || !String(jsonBodyLimit).trim()) {
    throw new Error('createApiApp: jsonBodyLimit is required');
  }

  ensureDataStores();

  const app = express();
  app.use(
    cors({
      origin: true,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-sync-token', 'X-Sync-Token'],
    })
  );
  app.use(express.json({ limit: jsonBodyLimit }));

  if (typeof requestLogger === 'function') {
    app.use(requestLogger);
  }

  const registrationStatic = path.join(getDataRoot(), 'registration');
  app.use('/api/registration-images', express.static(registrationStatic));
  app.get('/api/registration/local-ip', getLocalIP);

  app.use('/api/registration', registrationRoutes);
  app.use('/api/login', loginRoutes);
  app.use('/api/config', configRoutes);

  app.use(requireAuth);

  app.use('/api/registration', registrationRoutes);
  app.use('/api/login', loginRoutes);
  app.use('/api/config', configRoutes);

  app.use('/api/inventory', inventoryRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/sales', salesRoutes);
  app.use('/api/invoices', require('./routes/invoicesRoutes'));
  app.use('/api/customers', customerRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/roles', roleRoutes);
  app.use('/api/data-sync', dataSyncRoutes);
  app.use('/api/activity-log', activityLogRoutes);
  app.use('/api/installments', installmentRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/users', userRoutes);
  app.use('/sync', syncRoutes);
  app.use('/customer-id', customerIdRoutes);

  return app;
}

module.exports = { createApiApp, ensureDataStores };
