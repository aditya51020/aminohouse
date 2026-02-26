// backend/middleware/adminAuth.js
const User = require('../models/userModel'); // ya Admin model agar alag hai

const adminAuth = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Access denied. No user data.' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }

    // DB-level verification for extra security
    const adminUser = await User.findByPk(req.user.id);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ message: 'Invalid admin account' });
    }

    req.admin = req.user;
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Server error in admin auth' });
  }
};

module.exports = adminAuth;