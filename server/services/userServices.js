const fs = require('fs');
const path = require('path');
const { hashPassword } = require('../utils/HashPassword');
const { dataPath } = require('../paths');

function getUsersFilePath() {
  return dataPath('Users', 'Users.json');
}

const ensureUsersFile = () => {
  const usersFilePath = getUsersFilePath();
  const dir = path.dirname(usersFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(usersFilePath)) {
    fs.writeFileSync(usersFilePath, '[]', 'utf8');
  }
};

const readUsers = () => {
  ensureUsersFile();
  const usersFilePath = getUsersFilePath();
  const raw = fs.readFileSync(usersFilePath, 'utf8');
  return raw.trim() ? JSON.parse(raw) : [];
};

const writeUsers = (users) => {
  ensureUsersFile();
  const usersFilePath = getUsersFilePath();
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2), 'utf8');
};

const createUser = async (userData) => {
  if (!userData || typeof userData !== 'object') {
    throw new Error('Invalid request body');
  }

  const username = typeof userData.username === 'string' ? userData.username.trim() : '';
  const emailRaw = typeof userData.email === 'string' ? userData.email.trim() : '';
  const emailNorm = emailRaw.toLowerCase();
  const firstName = typeof userData.firstName === 'string' ? userData.firstName.trim() : '';
  const lastName = typeof userData.lastName === 'string' ? userData.lastName.trim() : '';
  const phone = typeof userData.phone === 'string' ? userData.phone.trim() : '';
  const password = userData.password;

  if (!username || !emailRaw || !password) {
    throw new Error('Username, email, and password are required');
  }
  if (!firstName || !lastName) {
    throw new Error('First name and last name are required');
  }
  if (!phone || !/^[0-9]{10}$/.test(phone)) {
    throw new Error('Phone must be exactly 10 digits');
  }

  const users = readUsers();

  const existingUser = users.find(
    (u) =>
      (u.username && u.username.trim() === username) ||
      (u.email && String(u.email).trim().toLowerCase() === emailNorm)
  );

  if (existingUser) {
    const sameUser = existingUser.username?.trim() === username;
    throw new Error(
      sameUser
        ? 'A user with this username already exists'
        : 'A user with this email already exists'
    );
  }

  const maxId =
    users.length > 0
      ? Math.max(...users.map((u) => u.id || 0))
      : 0;

  const hashedPassword = await hashPassword(String(password));

  const newUser = {
    id: maxId + 1,
    username,
    firstName,
    lastName,
    email: emailRaw,
    phone,
    password: hashedPassword,
    status: 'Active',
    roles: [],
    profilePicture: userData.profilePicture || ''
  };

  users.push(newUser);
  writeUsers(users);

  return newUser; //returning primary key
};

module.exports = {
  createUser,
  writeUsers,
  readUsers,
};