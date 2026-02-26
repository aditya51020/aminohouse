// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { register, login, updatePassword, getUsers, deleteUser } = require('../controllers/authController');
const protect = require('../middleware/auth');

router.post('/register', register); // Ideally protect this for Admin only!
router.post('/login', login);
router.put('/update-password', protect, updatePassword);
router.get('/users', protect, getUsers);
router.delete('/users/:id', protect, deleteUser);

module.exports = router;