/**
 * Sync API authentication middleware.
 * Validates x-sync-token or Authorization: Bearer against SYNC_TOKEN or SMTP_TOKEN.
 * Set SYNC_ALLOW_ANY=true (e.g. in dev) to allow requests without a token.
 */
function syncAuth(req, res, next) {
  const allowAny = process.env.SYNC_ALLOW_ANY === 'true' || process.env.SYNC_ALLOW_ANY === '1';
  if (allowAny) {
    return next();
  }

  const token =
    req.headers['x-sync-token'] ||
    (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : null);

  const expected = process.env.REACT_APP_SYNC_TOKEN || null;

  if (!expected || token !== expected) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or missing sync token. Use header x-sync-token or Authorization: Bearer <token>.',
    });
  }

  next();
}

module.exports = { syncAuth };
