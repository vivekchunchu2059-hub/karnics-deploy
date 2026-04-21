const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production-use-env';
const TOKEN_HEADER = 'authorization';

/**
 * Public paths that do not require authentication.
 * Format: { method: 'GET'|'POST'|..., pathPrefix: '/api/...' } or exact path.
 */
const isPublicPath = (method, path) => {
  if (method === 'POST' && (path === '/api/login/login' || path === '/api/login')) return true;
  if (method === 'POST' && path === '/api/users/forgot-password') return true;
  if (method === 'GET' && path === '/api/config/env') return true;
  if (method === 'POST' && path === '/api/registration') return true;
  if (method === 'GET' && path === '/api/registration') return true;
  if (method === 'GET' && path.startsWith('/api/registration-images')) return true;
  if (method === 'GET' && path.startsWith('/api/inventory/images')) return true;
  if (method === 'POST' && path.startsWith('/sync/upload/folder')) return true;
  if (method === 'GET' && path === '/sync/logs') return true;
  if (method === 'GET' && path === '/api/registration/local-ip') return true;
  return false;
};

/**
 * Verify JWT and attach user to req. Respond with 401 if missing or invalid.
 */
const requireAuth = (req, res, next) => {
  const path = (req.originalUrl || req.url || '').split('?')[0];
  if (isPublicPath(req.method, path)) {
    return next();
  }

  const raw = req.headers[TOKEN_HEADER] || req.headers['Authorization'];
  const token = typeof raw === 'string' && raw.startsWith('Bearer ') ? raw.slice(7) : raw;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = { requireAuth, JWT_SECRET };