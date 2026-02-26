const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    discountType: { type: String, enum: ['fixed', 'percentage'], required: true },
    discountValue: { type: Number, required: true },
    maxDiscount: { type: Number },
    minOrderValue: { type: Number, default: 0 },
    expirationDate: { type: Date },
    usageLimit: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for id
couponSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

module.exports = mongoose.model('Coupon', couponSchema);
