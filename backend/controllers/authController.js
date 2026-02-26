// backend/controllers/authController.js

const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// 1. REGISTER
const register = async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: 'Username already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const userRole = role || 'cashier';

    const user = await User.create({ username, password: hashed, role: userRole });

    res.status(201).json({ message: `User registered as ${userRole}` });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// 2. LOGIN
const login = async (req, res) => {
  const { username, password } = req.body;
  console.log(`Login attempt for: ${username}`);

  try {
    const user = await User.findOne({ username }).select('+password');
    console.log('User found:', !!user);
    if (user) console.log('Password in record:', !!user.password);

    if (!user) {
      console.log('User not found in database');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.password) {
      console.error('Password field missing for user:', username);
      return res.status(500).json({ message: 'Internal Server Error: Account data corrupted (missing password)' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password mismatch');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('CRITICAL: JWT_SECRET is not defined in environment variables');
      return res.status(500).json({ message: 'Server configuration error: Missing JWT_SECRET' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role || 'cashier' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`Login successful for user: ${username}, role: ${user.role}`);
    res.json({ token, role: user.role, username: user.username });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: `Internal Server Error: ${err.message}` });
  }
};

// 3. UPDATE PASSWORD
const updatePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Old password wrong' });

    const hashedInfo = await bcrypt.hash(newPassword, 10);
    user.password = hashedInfo;
    await user.save();

    res.json({ message: 'Password updated!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 4. GET USERS (Admin only)
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 5. DELETE USER (Admin only)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  register,
  login,
  updatePassword,
  getUsers,
  deleteUser
};