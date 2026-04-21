const fs = require('fs');
const path = require('path');
const os = require('os');
const { createUser } = require('../services/userServices');
const { getDataRoot } = require('../paths');
const log = require('../logger');

function getRegistrationDir() {
  return path.join(getDataRoot(), 'registration');
}

function getRegistrationFilePath() {
  return path.join(getRegistrationDir(), 'registration.json');
}

function getImagesDir() {
  return path.join(getRegistrationDir(), 'images');
}

const ensureFile = (filePath) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '[]', 'utf8');
  }
};

const ensureImagesDir = () => {
  const imagesDir = getImagesDir();
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }
};

/**
 * Save a base64 data URL image to data/registration/images/ and return relative path (e.g. images/logo-1-123.png).
 * @param {string} dataUrl - data:image/png;base64,... or empty
 * @param {string} prefix - e.g. 'logo' or 'profile'
 * @param {number} userId - user id for unique filename
 * @returns {string} relative path or ''
 */
const saveBase64Image = (dataUrl, prefix, userId) => {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
    return '';
  }
  ensureImagesDir();
  const match = dataUrl.match(/^data:image\/(\w+);base64,/);
  const ext = (match && match[1]) ? match[1].replace('jpeg', 'jpg') : 'png';
  const filename = `${prefix}-${userId}-${Date.now()}.${ext}`;
  const filePath = path.join(getImagesDir(), filename);
  const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  fs.writeFileSync(filePath, buffer);
  return path.join('images', filename).replace(/\\/g, '/');
};

/**
 * Normalize logo/profilePicture value to relative path only (e.g. "images/logo-1-123.png").
 * - If value is a full URL containing "registration-images/", returns the path after it.
 * - If value already looks like a relative path (e.g. "images/..."), returns as-is.
 * @param {string} value - full URL or relative path
 * @returns {string} relative path only, or original value if not a known URL pattern
 */
const toRelativeImagePath = (value) => {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (trimmed.startsWith('data:image/')) return ''; // base64; caller should use saveBase64Image
  const marker = 'registration-images/';
  const idx = trimmed.indexOf(marker);
  if (idx !== -1) {
    const after = trimmed.slice(idx + marker.length).replace(/^\/+/, '');
    if (after) return after;
  }
  // Already relative (e.g. "images/logo-2-xxx.png")
  if (/^images\/[^/]+$/.test(trimmed)) return trimmed;
  return trimmed;
};

const readRegistrations = () => {
  const registrationFilePath = getRegistrationFilePath();
  ensureFile(registrationFilePath);
  const raw = fs.readFileSync(registrationFilePath, 'utf8');
  return raw.trim() ? JSON.parse(raw) : [];
};

const writeRegistrations = (data) => {
  const registrationFilePath = getRegistrationFilePath();
  ensureFile(registrationFilePath);
  fs.writeFileSync(registrationFilePath, JSON.stringify(data, null, 2), 'utf8');
};

const createRegistration = async (req, res) => {
  log.info('Create Registration called...');
  try {
    const payload = req.body || {};

    // Validate required fields with detailed error messages
    // Required fields: firstName, lastName, mobileNumber (mobile), email, gstNumber (gstno)
    // Note: ipaddress is generated on frontend and sent to customer service API, not to this controller
    // Note: username and password are also required for user creation
    const missingFields = [];
    if (!payload.firstName || (typeof payload.firstName === 'string' && payload.firstName.trim() === '')) {
      missingFields.push('firstName');
    }
    if (!payload.lastName || (typeof payload.lastName === 'string' && payload.lastName.trim() === '')) {
      missingFields.push('lastName');
    }
    if (!payload.mobileNumber || (typeof payload.mobileNumber === 'string' && payload.mobileNumber.trim() === '')) {
      missingFields.push('mobileNumber');
    }
    if (!payload.email || (typeof payload.email === 'string' && payload.email.trim() === '')) {
      missingFields.push('email');
    }
    if (!payload.gstNumber || (typeof payload.gstNumber === 'string' && payload.gstNumber.trim() === '')) {
      missingFields.push('gstNumber');
    }
    // Also validate username and password for user creation
    if (!payload.username || (typeof payload.username === 'string' && payload.username.trim() === '')) {
      missingFields.push('username');
    }
    if (!payload.password || (typeof payload.password === 'string' && payload.password.trim() === '')) {
      missingFields.push('password');
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        errorType: 'MISSING_FIELDS',
        details: `Missing required fields: ${missingFields.join(', ')}`,
        missingFields: missingFields,
      });
    }

    // Check if any registration already exists (only one registration allowed)
    let registrations;
    try {
      registrations = readRegistrations();
    } catch (readError) {
      log.error('Failed to Read Registrations:', readError);
      return res.status(500).json({
        error: 'Server error: Failed to read registration data',
        errorType: 'SERVER_ERROR',
        details: 'Unable to access registration database. Please try again later.',
      });
    }

    if (registrations && registrations.length > 0) {
      return res.status(400).json({
        error: 'Registration already exists. Only one registration is allowed.',
        errorType: 'REGISTRATION_EXISTS',
      });
    }


    // Check for duplicate GST number (case-insensitive, trimmed)
    if (payload.gstNumber && typeof payload.gstNumber === 'string' && payload.gstNumber.trim() !== '') {
      const gstNumberTrimmed = payload.gstNumber.trim().toLowerCase();
      const duplicateGst = registrations.find(
        (r) => r.gstNumber && typeof r.gstNumber === 'string' &&
          r.gstNumber.trim().toLowerCase() === gstNumberTrimmed
      );

      if (duplicateGst) {
        return res.status(400).json({
          error: 'GST number already registered',
          errorType: 'DUPLICATE_GST',
          details: 'This GST number is already associated with another registration.',
        });
      }
    }

    // Check for duplicate registration by username or email (case-insensitive)
    const usernameLower = payload.username.trim().toLowerCase();
    const emailLower = payload.email.trim().toLowerCase();
    const existingRegistration = registrations.find(
      (r) => {
        const rUsername = (r.username || '').toString().trim().toLowerCase();
        const rEmail = (r.email || '').toString().trim().toLowerCase();
        return rUsername === usernameLower || rEmail === emailLower;
      }
    );

    if (existingRegistration) {
      const duplicateField = existingRegistration.username?.toLowerCase() === usernameLower ? 'username' : 'email';
      return res.status(400).json({
        error: `User already exists with this ${duplicateField}`,
        errorType: 'DUPLICATE_USER',
        details: `A registration with this ${duplicateField} already exists.`,
      });
    }

    // Save logo and profile images first
    let logoPath = '';
    let profilePicturePath = '';

    try {
      if (payload.logo && typeof payload.logo === 'string' && payload.logo.startsWith('data:image/')) {
        logoPath = saveBase64Image(payload.logo, 'logo', Date.now());
      } else if (payload.logo && typeof payload.logo === 'string') {
        logoPath = toRelativeImagePath(payload.logo) || payload.logo;
      }

    } catch (imageError) {
      log.error('Error saving images:', imageError);
    }

    // Now create user with profile picture
    let newUser;
    try {
      newUser = await createUser({
        username: payload.username,
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        phone: payload.mobileNumber,
        password: payload.password,
        profilePicture: profilePicturePath || ''
      });
      log.info('New user created successfully');

      // Now save profile picture using real userId
      if (payload.profilePicture && payload.profilePicture.startsWith('data:image/')) {
        const profilePicturePath = saveBase64Image(payload.profilePicture, 'profile', newUser.id);

        if (profilePicturePath) {
          const users = require('../services/userServices').readUsers();
          const userIndex = users.findIndex(u => u.id === newUser.id);
          if (userIndex !== -1) {
            users[userIndex].profilePicture = profilePicturePath;
            require('../services/userServices').writeUsers(users);
          }
        }
      }

      if (!newUser || !newUser.id) {
        return res.status(500).json({
          error: 'Failed to create user account',
          errorType: 'USER_CREATION_FAILED',
          details: 'User account could not be created. Please try again.',
        });
      }
    } catch (userError) {
      log.error('Error creating user:', userError);
      // Fallback check for duplicate user (in case race condition or check missed it)
      if (userError.message && (userError.message.includes('already exists') || userError.message.includes('duplicate'))) {
        return res.status(400).json({
          error: 'User already exists',
          errorType: 'DUPLICATE_USER',
          details: userError.message,
        });
      }
      return res.status(500).json({
        error: 'Failed to create user account',
        errorType: 'USER_CREATION_FAILED',
        details: 'An error occurred while creating your user account. Please try again.',
      });
    }

    const newRegistration = {
      id: Date.now(),
      userId: newUser.id,
      email: payload.email || newUser.email || '',
      mobileNumber: payload.mobileNumber || newUser.phone || '',
      shopName: payload.shopName || '',
      shopAddress: payload.shopAddress || '',
      makingCharges: payload.makingCharges || '',
      cgst: payload.cgst || 0,
      sgst: payload.sgst || 0,
      gstNumber: payload.gstNumber || '',
      panNumber: payload.panNumber || '',
      logo: logoPath || payload.logo || '',
      createdAt: new Date().toISOString(),
      customerId: payload.customerId || ''
    };

    try {
      registrations.push(newRegistration);
      writeRegistrations(registrations); // persists to data/registration/registration.json
    } catch (writeError) {
      log.error('Failed to Save Registration:', writeError);
      return res.status(500).json({
        error: 'Failed to Save Registration',
        errorType: 'WRITE_ERROR',
        details: 'Registration data could not be saved. Please try again.',
      });
    }

    log.info('Registration created successfully');
    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: newRegistration,
    });

  } catch (error) {
    log.error('Failed to Create Registration:', error);

    // Handle file system errors
    if (error.code === 'ENOENT' || error.code === 'EACCES' || error.code === 'EMFILE') {
      return res.status(500).json({
        error: 'Server error: File system error',
        errorType: 'FILE_SYSTEM_ERROR',
        details: 'Unable to access server files. Please contact administrator.',
      });
    }

    // Generic server error
    return res.status(500).json({
      error: 'Internal server error',
      errorType: 'SERVER_ERROR',
      details: error.message || 'An unexpected error occurred. Please try again later.',
    });
  }
};

const getRegistrations = (req, res) => {
  log.info('Get Registrations called...');
  try {
    const registrations = readRegistrations();
    log.info('Registrations fetched successfully');
    return res.status(200).json({
      success: true,
      data: registrations,
    });
  } catch (error) {
    log.error('Failed to Get Registrations:', error);
    return res.status(500).json({
      error: 'Failed to Get Registrations',
      details: error.message,
    });
  }
};

/**
 * Check if an IP address is in a private IP range
 * @param {string} ip - IP address to check
 * @returns {boolean} True if IP is in private range
 */
const isPrivateIP = (ip) => {
  if (!ip || typeof ip !== 'string') return false;

  // Private IP ranges:
  // 10.0.0.0 - 10.255.255.255 (10.0.0.0/8)
  // 172.16.0.0 - 172.31.255.255 (172.16.0.0/12)
  // 192.168.0.0 - 192.168.255.255 (192.168.0.0/16)
  // 169.254.0.0 - 169.254.255.255 (169.254.0.0/16) - Link-local (APIPA)

  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return false;

  const [a, b, c, d] = parts;

  // 10.0.0.0/8
  if (a === 10) return true;

  // 172.16.0.0/12
  if (a === 172 && b >= 16 && b <= 31) return true;

  // 192.168.0.0/16
  if (a === 192 && b === 168) return true;

  // 169.254.0.0/16 (Link-local, typically used for auto-configuration)
  if (a === 169 && b === 254) return true;

  return false;
};

/**
 * Get the IP address of the local system where the application is running
 * Prioritizes private/local IP addresses over public IPs
 * @returns {string} The local IP address (IPv4)
 */
const getLocalIPAddress = () => {
  const interfaces = os.networkInterfaces();
  const ipAddresses = [];
  const privateIPs = [];

  // Collect all non-internal IPv4 addresses
  for (const interfaceName in interfaces) {
    const addresses = interfaces[interfaceName];
    if (!addresses) continue;

    for (const address of addresses) {
      // Check for IPv4 (handles both string 'IPv4' and number 4)
      const isIPv4 = address.family === 'IPv4' || address.family === 4;

      // Skip internal (loopback) addresses
      if (isIPv4 && !address.internal) {
        const ipData = {
          address: address.address,
          interface: interfaceName,
          isPrivate: isPrivateIP(address.address),
        };

        // Separate private and public IPs
        if (ipData.isPrivate) {
          privateIPs.push(ipData);
        } else {
          ipAddresses.push(ipData);
        }
      }
    }
  }

  // Prefer Ethernet/WiFi interfaces for private IPs
  const preferredInterfaces = ['eth0', 'en0', 'Wi-Fi', 'Ethernet', 'Local Area Connection'];

  // First, try to find a preferred interface with a private IP
  for (const preferred of preferredInterfaces) {
    const found = privateIPs.find(ip =>
      ip.interface.toLowerCase().includes(preferred.toLowerCase())
    );
    if (found) {
      return found.address;
    }
  }

  // If no preferred interface found, return first private IP
  if (privateIPs.length > 0) {
    return privateIPs[0].address;
  }

  // If no private IPs, try preferred interfaces for any IP
  for (const preferred of preferredInterfaces) {
    const found = ipAddresses.find(ip =>
      ip.interface.toLowerCase().includes(preferred.toLowerCase())
    );
    if (found) {
      return found.address;
    }
  }

  // Return first available non-internal IP if exists
  if (ipAddresses.length > 0) {
    return ipAddresses[0].address;
  }

  // If no IP address can be obtained, throw an error
  throw new Error('Unable to get IP address. No network interface with a valid IP address found.');
};

const getLocalIP = (req, res) => {
  log.info('Get Local IP called...');
  try {
    const ipAddress = getLocalIPAddress();
    log.info('Local IP fetched successfully');
    return res.status(200).json({
      success: true,
      ipAddress: ipAddress,
    });
  } catch (error) {
    log.error('Failed to Get Local IP:', error);
    return res.status(503).json({
      success: false,
      error: 'Unable to detect local IP address',
      details: error.message,
    });

  }
};

module.exports = {
  createRegistration,
  getRegistrations,
  readRegistrations,
  writeRegistrations,
  saveBase64Image,
  toRelativeImagePath,
  getLocalIPAddress,
  getLocalIP,
};