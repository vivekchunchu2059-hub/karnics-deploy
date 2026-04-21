const { hashPassword, verifyPassword } = require('../utils/HashPassword');
const { createUser, readUsers, writeUsers } = require('../services/userServices');
const { updateRoleUserCounts } = require('./roleController');
const { readRegistrations } = require('./registrationController');
const log = require('../logger');


const getUsers = (req, res) => {
  log.info('Get Users called...');
  try {
    const users = readUsers();

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const validPage = Math.max(1, page);
    const validLimit = Math.max(1, limit);

    const totalUserCount = users.length;
    const totalPages = Math.ceil(totalUserCount / validLimit);

    const startIndex = (validPage - 1) * validLimit;
    const endIndex = startIndex + validLimit;

    const paginatedUsers = users.slice(startIndex, endIndex);

    log.info('Users fetched successfully');
    return res.json({
      users: paginatedUsers,
      total: totalUserCount,
      page: validPage,
      totalPages,
    });

  } catch (error) {
    log.error('Failed to Get Users:', error?.message || error);
    return res.status(500).json({
      error: 'Failed to Get Users',
      details: error.message,
    });
  }
};

const saveUsers = (req, res) => {
  log.info('Save Users called...');
  try {
    const usersData = req.body;

    if (!Array.isArray(usersData)) {
      return res.status(400).json({
        error: 'Invalid payload: expected an array of users',
      });
    }

    writeUsers(usersData);

    // Update role user counts after saving users
    updateRoleUserCounts();
    log.info('Users saved successfully');
    return res.json({
      success: true,
      message: 'Users data saved successfully',
      count: usersData.length,
    });

  } catch (error) {
    log.error('Failed to Save Users:', error);
    return res.status(500).json({
      error: 'Failed to Save Users',
      details: error.message,
    });
  }
};


const addUser = async (req, res) => {
  log.info('Add User called...');
  try {
    const user = await createUser(req.body);

    // Update role user counts after creating user
    updateRoleUserCounts();

    log.info('User created successfully');
    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      userId: user.id,
    });
    
  } catch (error) {
    log.error('Failed to Add User:', error);
    return res.status(400).json({
      error: error.message,
    });
  }
};


const changePassword = async (req, res) => {
  log.info('Change Password called...');
  try {
    const { userId, currentPassword, newPassword } = req.body;

    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const users = readUsers();
    const userIndex = users.findIndex((u) => u.id === Number(userId));

    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[userIndex];

    //  Verify current password
    const isMatch = await verifyPassword(user.password, currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Check new password is different
    const isSameAsOld = await verifyPassword(user.password, newPassword);
    if (isSameAsOld) {
      return res.status(400).json({
        error: 'New password must be different from current password',
      });
    }

    //  Hash new password
    const newHashedPassword = await hashPassword(newPassword);

    //  Update password
    users[userIndex].password = newHashedPassword;
    writeUsers(users);

    log.info('Password changed successfully');
    return res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    log.error('Failed to Change Password:', error);
    return res.status(500).json({
      error: 'Failed to Change Password',
    });
  }
};

const forgotPassword = async (req, res) => {
  log.info('Forgot Password called...');
  try {
    const { username, customerId, newPassword } = req.body;

    if (!customerId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const users = readUsers();
    const registrations = readRegistrations();
    const customerIdStr = String(customerId).trim();

    // Step 1: verification payload { username, customerId }
    if (username && !newPassword) {
      const usernameStr = String(username).trim();
      if (!usernameStr) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      const user = users.find(
        (u) => String(u.username || '').trim() === usernameStr
      );

      if (!user) {
        return res.status(404).json({ error: 'Invalid Username' });
      }

      const registration = registrations.find(
        (r) => String(r.customerId || '').trim() === customerIdStr
      );

      if (!registration || Number(registration.userId) !== Number(user.id)) {
        return res.status(404).json({ error: 'Invalid Customer ID' });
      }

      log.info('User verified successfully');
      return res.json({
        success: true,
        message: 'User verified',
        userId: user.id,
      });
    }

    // Step 2: reset payload { username, customerId, newPassword }
    if (!username || !newPassword) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const usernameStr = String(username).trim();
    if (!usernameStr) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const registration = registrations.find(
      (r) => String(r.customerId || '').trim() === customerIdStr
    );

    if (!registration) {
      return res.status(404).json({
        error: 'Invalid Customer ID',
      });
    }

    const userIndex = users.findIndex(
      (u) => Number(u.id) === Number(registration.userId)
    );

    if (userIndex === -1) {
      return res.status(404).json({
        error: 'Invalid Customer ID',
      });
    }

    // Enforce username + customerId pair validation in reset step as well
    if (String(users[userIndex].username || '').trim() !== usernameStr) {
      return res.status(404).json({ error: 'Invalid Username' });
    }

    //  Hash new password
    const newHashedPassword = await hashPassword(newPassword);

    // Save new password
    users[userIndex].password = newHashedPassword;
    writeUsers(users);

    log.info('Password reset successfully');
    return res.json({
      success: true,
      message: 'Password reset successfully',
    });

  } catch (error) {
    log.error('Failed to Reset Password:', error);
    return res.status(500).json({
      error: 'Failed to Reset Password',
    });
  }
};

module.exports = {
  getUsers,
  saveUsers,
  addUser,
  changePassword,
  forgotPassword,
};