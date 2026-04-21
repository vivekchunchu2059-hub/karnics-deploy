const express = require('express');
const { getUsers, saveUsers, addUser, changePassword, forgotPassword } = require('../controllers/userController');

const router = express.Router();

router.get('/', getUsers);
router.post('/', saveUsers);
router.post('/add', addUser);
router.post('/change-password', changePassword)
router.post('/forgot-password', forgotPassword)
module.exports = router;
