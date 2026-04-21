const fs = require('fs');
const path = require('path');
const { dataPath } = require('../paths');
const log = require('../logger');
const rolesFilePath = () => dataPath('Roles', 'Roles.json');

const ensureRolesFile = () => {
  const fp = rolesFilePath();
  const dir = path.dirname(fp);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(fp)) {
    fs.writeFileSync(fp, '[]', 'utf8');
  }
};

const readRolesFile = () => {
  ensureRolesFile();

  const raw = fs.readFileSync(rolesFilePath(), 'utf8');
  if (!raw.trim()) {
    return [];
  }

  return JSON.parse(raw);
};

const writeRolesFile = (rolesData) => {
  ensureRolesFile();
  fs.writeFileSync(rolesFilePath(), JSON.stringify(rolesData, null, 2), 'utf8');
};

// Update user counts for all roles based on current users
const updateRoleUserCounts = () => {
  log.info('Update Role User Counts called...');
  try {
    // Use require inside function to avoid circular dependency
    const userServices = require('../services/userServices');
    const users = userServices.readUsers();
    const roles = readRolesFile();

    // Count users for each role
    const roleCounts = {};
    users.forEach(user => {
      if (user.roles && Array.isArray(user.roles)) {
        user.roles.forEach(userRole => {
          const roleId = userRole.id;
          const roleName = userRole.role;
          
          // Count by role ID
          if (roleId) {
            roleCounts[roleId] = (roleCounts[roleId] || 0) + 1;
          }
          // Also count by role name (fallback)
          if (roleName) {
            roleCounts[roleName] = (roleCounts[roleName] || 0) + 1;
          }
        });
      }
    });

    // Update user counts in roles
    let updated = false;
    roles.forEach(role => {
      const countById = roleCounts[role.id] || 0;
      const countByName = roleCounts[role.role] || 0;
      const newCount = Math.max(countById, countByName);
      
      if (role.users !== newCount) {
        role.users = newCount;
        updated = true;
      }
    });

    // Write updated roles if any changes were made
    if (updated) {
      writeRolesFile(roles);
    }

    log.info('Role User Counts updated successfully');
    return roles;
  } catch (error) {
    log.error('Failed to Update Role User Counts:', error);
    return readRolesFile(); 
  }
};

const getRoles = (req, res) => {
  log.info('Get Roles called...');
  try {
    // Update user counts before returning roles
    const roles = updateRoleUserCounts();
    log.info('Roles fetched successfully');
    return res.json(roles);
  } catch (error) {
    log.error('Failed to Get Roles:', error);
    return res.status(500).json({
      error: 'Failed to Get Roles',
      details: error.message,
    });
  }
};

const saveRoles = (req, res) => {
  log.info('Save Roles called...');
  try {
    const rolesData = req.body;

    if (!Array.isArray(rolesData)) {
      return res.status(400).json({
        error: 'Invalid payload: expected an array of roles',
      });
    }

    writeRolesFile(rolesData);
    log.info('Roles data saved successfully');
    return res.json({
      success: true,
      message: 'Roles data saved successfully',
      count: rolesData.length,
    });
  } catch (error) {
    log.error('Failed to Save Roles:', error);
    return res.status(500).json({
      error: 'Failed to write roles data',
      details: error.message,
    });
  }
};

module.exports = {
  getRoles,
  saveRoles,
  updateRoleUserCounts,
};

