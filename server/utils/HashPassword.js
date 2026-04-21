const argon2 = require('argon2');

// Hash password before saving
const hashPassword = async (plainPassword) => {
  return await argon2.hash(plainPassword);
};

// Verify password during login
const verifyPassword = async (hashedPassword, plainPassword) => {
  return await argon2.verify(hashedPassword, plainPassword);
};

module.exports = {
  hashPassword,
  verifyPassword,
};