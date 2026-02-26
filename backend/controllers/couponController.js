const Coupon = require('../models/couponModel');
const CouponUsage = require('../models/couponUsageModel');

// @desc    Verify coupon
// @route   POST /api/coupons/verify
// @access  Public
exports.verifyCoupon = async (req, res) => {
    try {
        const { code, cartTotal, customerId, cartItems } = req.body;

        const coupon = await Coupon.findOne({
            code: code.toUpperCase(),
            isActive: true
        });

        if (!coupon) {
            return res.status(404).json({ message: 'Invalid coupon code' });
        }

        // 1. Check Expiry
        if (coupon.expirationDate && new Date() > new Date(coupon.expirationDate)) {
            return res.status(400).json({ message: 'Coupon expired' });
        }

        // 2. Check Min Order Value
        if (cartTotal < (coupon.minOrderValue || 0)) {
            return res.status(400).json({ message: `Min order value is ₹${coupon.minOrderValue}` });
        }

        // 3. Check Usage Limits (Global)
        if (coupon.usageLimit && coupon.usageLimit > 0) {
            const globalUsage = await CouponUsage.countDocuments({ couponId: coupon._id });
            if (globalUsage >= coupon.usageLimit) {
                return res.status(400).json({ message: 'Coupon usage limit reached' });
            }
        }

        // 4. Check Per User Limit
        if (customerId) {
            const userUsage = await CouponUsage.countDocuments({ couponId: coupon._id, customerId });
            const perUserLimit = coupon.perUserLimit || 1;
            if (userUsage >= perUserLimit) {
                return res.status(400).json({ message: 'You have already used this coupon' });
            }
        }

        // 5. Subscription check
        const hasPaidItems = cartItems ? cartItems.some(item => (item.price || item.menuItem?.price) > 0) : true;
        if (!hasPaidItems && cartItems && cartItems.length > 0) {
            return res.status(400).json({ message: 'Coupon not applicable on subscription items' });
        }

        // Calculate Discount
        let discount = 0;
        if (coupon.discountType === 'fixed') {
            discount = coupon.discountValue;
        } else if (coupon.discountType === 'percentage') {
            discount = (cartTotal * coupon.discountValue) / 100;
            if (coupon.maxDiscount) {
                discount = Math.min(discount, coupon.maxDiscount);
            }
        }

        discount = Math.min(discount, cartTotal);

        res.json({
            success: true,
            discount,
            finalTotal: cartTotal - discount,
            code: coupon.code,
            couponId: coupon._id
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Create new coupon
exports.createCoupon = async (req, res) => {
    try {
        const { code, discountType, discountValue, expirationDate, minOrderValue, usageLimit, maxDiscount } = req.body;

        if (!code || !discountType || !discountValue) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const coupon = await Coupon.create({
            code: code.toUpperCase(),
            discountType,
            discountValue: Number(discountValue),
            expirationDate,
            minOrderValue: Number(minOrderValue || 0),
            usageLimit: Number(usageLimit || 0),
            maxDiscount: Number(maxDiscount || 0)
        });

        res.status(201).json(coupon);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get all coupons
exports.getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find({}).sort({ createdAt: -1 });
        res.json(coupons);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Delete coupon
exports.deleteCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndDelete(req.params.id);
        if (coupon) {
            res.json({ message: 'Coupon deleted' });
        } else {
            res.status(404).json({ message: 'Coupon not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
