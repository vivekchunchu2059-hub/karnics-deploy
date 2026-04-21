const { readUsers } = require('../services/userServices');
const log = require('../logger');

/**
 * GET /customer-id – returns the logged-in user's customerId (for Data Sync / upload association).
 * Requires JWT. Uses req.user (userId/username) to find user and return customerId.
 */
function getCustomerId(req, res) {
  log.info('Get Customer ID called...');
  try {
    const users = readUsers();
    const { userId, username } = req.user || {};
    const user = users.find(
      (u) => u.id === userId || (username && String(u.username).trim() === String(username).trim())
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const customerId =
      user.customerId != null && String(user.customerId).trim() !== ''
        ? String(user.customerId)
        : `CUSTOMER-ID-${String(user.id || 0).padStart(3, '0')}`;
    log.info('Customer ID fetched successfully');
    return res.json({ customerId });
  } catch (err) {
    log.error('Failed to get Customer ID:', err);
    return res.status(500).json({ error: 'Failed to get Customer ID' });
  }
}

module.exports = { getCustomerId };
