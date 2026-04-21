const fs = require('fs');
const { readUsers, writeUsers } = require('../services/userServices');
const { readRegistrations, writeRegistrations, saveBase64Image, toRelativeImagePath } = require('./registrationController');
const { dataPath } = require('../paths');
const { logActivity } = require("./activityLogController");
const log = require('../logger');
const rolesJsonPath = () => dataPath('Roles', 'Roles.json');

const getProfile = (req, res) => {
    log.info('Get Profile called...');
    try {

        const { username, email } = req.query;

        const users = readUsers();
        const registrations = readRegistrations();

        // Find user
        const user = users.find(
            u =>
                (username && u.username === username) ||
                (email && u.email === email)
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Find registration
        const registration = registrations.find(
            r => r.userId === user.id
        );

        // Prefer registration.customerId, then user.customerId, then fallback
        const customerIdValue = (registration?.customerId != null && String(registration.customerId).trim() !== '')
            ? String(registration.customerId)
            : (user.customerId != null && String(user.customerId).trim() !== ''
                ? String(user.customerId)
                : `CUSTOMER-ID-${String(user.id || 0).padStart(3, '0')}`);
        const profileData = {
            userId: user.id,
            customerId: customerIdValue,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone || '',

            shopName: registration?.shopName || '',
            shopAddress: registration?.shopAddress || '',
            gstNumber: registration?.gstNumber || '',
            panNumber: registration?.panNumber || '',
            makingCharges: registration?.makingCharges || '',
            cgst: registration?.cgst || '',
            sgst: registration?.sgst || '',
            logo: registration?.logo || '',
            profilePicture: user?.profilePicture || ''
        };

        const rf = rolesJsonPath();
        let roles = [];
        if (fs.existsSync(rf)) {
            roles = JSON.parse(fs.readFileSync(rf, 'utf8') || '[]');
        }

        // Check if any SuperAdmin exists
        const usersWithRoles = users.filter(u => u.roles && u.roles.length > 0);

        const superAdminExists = usersWithRoles.some(u => {
            const roleName = u.roles[0]?.role?.toLowerCase();
            return roleName === 'superadmin' || roleName === 'super admin';
        });

        // Check if current user has role
        const hasRole = user.roles && user.roles.length > 0;

        //  MAIN LOGIC
        const treatAsSuperAdmin = !superAdminExists && !hasRole;

        // Determine if current user should behave as Super Admin
        const isRealSuperAdmin =
            hasRole &&
            (
                user.roles[0].role.toLowerCase() === 'superadmin' ||
                user.roles[0].role.toLowerCase() === 'super admin'
            );

        const isSuperAdmin = isRealSuperAdmin || treatAsSuperAdmin;

        log.info('Profile fetched successfully');
        return res.json({
            success: true,
            data: profileData,
            isSuperAdmin: isSuperAdmin
        });

    } catch (error) {
        log.error('Failed to Fetch Profile:', error);
        return res.status(500).json({ error: 'Failed to Fetch Profile' });
    }
};

const updateProfile = async (req, res) => {
    log.info('Update Profile called...');
    try {
        const payload = req.body;

        const users = readUsers();
        const registrations = readRegistrations();

        // Find user by username/email
        const userIndex = users.findIndex(
            u =>
                u.username === payload.username ||
                u.email === payload.email
        );

        if (userIndex === -1) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        const user = users[userIndex];

        const beforeProfile = { ...user };

        //  Update User JSON 
        users[userIndex].firstName = payload.firstName;
        users[userIndex].lastName = payload.lastName;
        users[userIndex].phone = payload.phone;
        users[userIndex].email = payload.email;

        // ===== Save profile picture into user.json for all users =====
        if (payload.profilePicture && typeof payload.profilePicture === 'string') {
            let profilePicturePath = '';

            if (payload.profilePicture.startsWith('data:image/')) {
                profilePicturePath = saveBase64Image(payload.profilePicture, 'profile', user.id);
            } else {
                profilePicturePath = toRelativeImagePath(payload.profilePicture) || payload.profilePicture;
            }

            if (profilePicturePath) {
                users[userIndex].profilePicture = profilePicturePath;
            }
        }

        // Save user.json
        writeUsers(users);
        // If SuperAdmin update registration.json also (create entry if missing)
        // determine from roles instead
        const hasRole = user.roles && user.roles.length > 0;

        const isRealSuperAdmin =
            hasRole &&
            (
                user.roles[0].role.toLowerCase() === 'superadmin' ||
                user.roles[0].role.toLowerCase() === 'super admin'
            );

        const rf = rolesJsonPath();
        let roles = [];
        if (fs.existsSync(rf)) {
            roles = JSON.parse(fs.readFileSync(rf, 'utf8') || '[]');
        }

        const usersWithRoles = users.filter(u => u.roles && u.roles.length > 0);

        const superAdminExists = usersWithRoles.some(u => {
            const roleName = u.roles[0]?.role?.toLowerCase();
            return roleName === 'superadmin' || roleName === 'super admin';
        });
        const treatAsSuperAdmin = !superAdminExists && !hasRole;

        const isSuperAdmin = isRealSuperAdmin || treatAsSuperAdmin;

        if (isSuperAdmin) {
            let regIndex = registrations.findIndex(
                r => r.userId === user.id
            );

            if (regIndex === -1) {
                registrations.push({
                    id: Date.now(),
                    userId: user.id,
                    shopName: '',
                    shopAddress: '',
                    makingCharges: '',
                    cgst: 0,
                    sgst: 0,
                    gstNumber: '',
                    panNumber: '',
                    logo: '',
                    profilePicture: '',
                    customerId: '',
                    createdAt: new Date().toISOString(),
                });
                writeRegistrations(registrations);
                regIndex = registrations.length - 1;
            }

            if (regIndex !== -1) {
                let logoPath = '';
                let profilePicturePath = '';
                if (payload.logo && typeof payload.logo === 'string' && payload.logo.startsWith('data:image/')) {
                    logoPath = saveBase64Image(payload.logo, 'logo', user.id);
                } else if (payload.logo && typeof payload.logo === 'string') {
                    logoPath = toRelativeImagePath(payload.logo) || payload.logo;
                }
                if (payload.profilePicture && typeof payload.profilePicture === 'string' && payload.profilePicture.startsWith('data:image/')) {
                    profilePicturePath = saveBase64Image(payload.profilePicture, 'profile', user.id);
                } else if (payload.profilePicture && typeof payload.profilePicture === 'string') {
                    profilePicturePath = toRelativeImagePath(payload.profilePicture) || payload.profilePicture;
                }

                registrations[regIndex].shopName = payload.shopName != null ? payload.shopName : (registrations[regIndex].shopName || '');
                registrations[regIndex].shopAddress = payload.shopAddress != null ? payload.shopAddress : (registrations[regIndex].shopAddress || '');
                registrations[regIndex].panNumber = payload.panNumber != null ? payload.panNumber : (registrations[regIndex].panNumber || '');
                registrations[regIndex].cgst = Number(payload.cgst) || 0;
                registrations[regIndex].sgst = Number(payload.sgst) || 0;
                registrations[regIndex].makingCharges = payload.makingCharges != null ? payload.makingCharges : (registrations[regIndex].makingCharges || '');
                registrations[regIndex].mobileNumber = payload.phone != null ? payload.phone : (registrations[regIndex].mobileNumber || '');
                registrations[regIndex].email = payload.email != null ? payload.email : (registrations[regIndex].email || '');
                if (logoPath !== '') registrations[regIndex].logo = logoPath;
                writeRegistrations(registrations);
            }
        }

        // Activity log (Profile update)
        try {
            if (req.user?.username && req.user?.role) {
                const beforeDiff = {};
                const afterDiff = {};

                Object.keys(user).forEach((key) => {
                    if (beforeProfile[key] !== user[key]) {
                        beforeDiff[key] = beforeProfile[key];
                        afterDiff[key] = user[key];
                    }
                });

                if (Object.keys(afterDiff).length > 0) {
                    logActivity({
                        username: req.user.username,
                        role: req.user.role,
                        page: "Profile",
                        action: "update",
                        before: beforeDiff,
                        after: afterDiff,
                    });
                }
            }
        } catch (e) {
            // Never block profile update due to activity logging
        }
        log.info('Profile updated successfully');
        return res.json({
            success: true,
            message: 'Profile updated successfully'
        });

    } catch (error) {
        log.error('Failed to Update Profile:', error);
        res.status(500).json({
            error: 'Failed to Update Profile'
        });
    }
};

module.exports = {
    updateProfile,
    getProfile
};