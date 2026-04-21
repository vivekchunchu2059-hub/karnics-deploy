const jwt = require('jsonwebtoken');
const { verifyPassword } = require('../utils/HashPassword');
const fs = require('fs');
const { JWT_SECRET } = require('../middleware/auth');
const { dataPath } = require('../paths');
const { logActivity } = require('./activityLogController');
const log = require('../logger');

const usersFile = () => dataPath('Users', 'Users.json');
const rolesFile = () => dataPath('Roles', 'Roles.json');

const readUsersFile = () => {
  const f = usersFile();
  if (!fs.existsSync(f)) return [];
  const data = fs.readFileSync(f, 'utf8');
  return JSON.parse(data || '[]');
};

const readRolesFile = () => {
  const f = rolesFile();
  if (!fs.existsSync(f)) return [];
  const data = fs.readFileSync(f, 'utf8');
  return JSON.parse(data || '[]');
};

const loginUser = async (req, res) => {
  log.info('Login called...');
  try {
    const { username, password } = req.body;

    const users = readUsersFile();

    const user = users.find(
      (u) => u.username?.trim() === username?.trim()
    );

    if (!user) {
      return res.status(400).json({
        error: 'User does not exist',
      });
    }

    const isMatch = await verifyPassword(user.password, password);

    if (!isMatch) {
      return res.status(400).json({
        error: 'Password is wrong',
      });
    }

    if (user.status === 'Inactive') {
      return res.status(403).json({
        error: 'Your account is inactive. Contact Super Admin.',
      });
    }

    // Check if user's assigned role is inactive
    if (user.roles && user.roles.length > 0) {
      const userRoleName = user.roles[0].role;
      const roles = readRolesFile();
      
      // Find the role in roles list
      const matchedRole = roles.find((r) => {
        const roleName = r.role || '';
        return roleName === userRoleName || 
               roleName.toLowerCase() === userRoleName.toLowerCase() ||
               roleName.toLowerCase().replace(/\s+/g, '') === userRoleName.toLowerCase().replace(/\s+/g, '');
      });

      if (matchedRole && matchedRole.status === 'INACTIVE') {
        return res.status(403).json({
          error: 'Your assigned role is currently inactive. Please contact the Super Admin.',
        });
      }
    }

    const roleName = (user.roles && user.roles.length > 0) ? user.roles[0].role : '';

    // Log login activity (activityLogController ignores superAdmin automatically)
    try {
      logActivity({
        username: user.username,
        role: roleName,
        page: "Login",
        action: "create"
      });
    } catch (e) {
      // Don't block login if activity logging fails
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: roleName },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    log.info('Login successful');
    return res.status(200).json({
      success: true,
      user,
      token,
    });

  } catch (error) {
    log.error('Failed to Login:', error);
    return res.status(500).json({
      error: 'Failed to Login'
    });
  }
};

module.exports = {
  loginUser,
};