// middleware/customerAuth.js
const jwt = require('jsonwebtoken');
const Customer = require('../models/customerModel');

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-123');

    if (decoded.type !== 'customer') {
      return res.status(403).json({ message: 'Invalid token type' });
    }

    req.user = await Customer.findById(decoded.id).select('phone name');

    if (!req.user) return res.status(401).json({ message: 'Customer not found' });

    next();
  } catch (err) {
    console.error('Customer JWT Verification Failed:', err.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};