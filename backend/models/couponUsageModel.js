const mongoose = require('mongoose');

const couponUsageSchema = new mongoose.Schema({
    couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    usedAt: { type: Date, default: Date.now }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for id
couponUsageSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

module.exports = mongoose.model('CouponUsage', couponUsageSchema);
