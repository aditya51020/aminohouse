const jwt = require('jsonwebtoken');
const Customer = require('../models/customerModel');

module.exports = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // No token provided -> Continue as Guest
            return next();
        }

        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-123');

        if (decoded.type === 'customer') {
            req.user = await Customer.findById(decoded.id).select('phone name');
        }

        next();
    } catch (err) {
        // Invalid token? Just ignore and treat as guest
        // console.log("Optional Auth Failed (Treating as Guest):", err.message);
        next();
    }
};
