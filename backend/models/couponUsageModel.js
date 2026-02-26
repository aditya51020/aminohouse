const mongoose = require('mongoose');

const couponUsageSchema = new mongoose.Schema({
    coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    usedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CouponUsage', couponUsageSchema);
