const Coupon = require('../models/couponModel');
const CouponUsage = require('../models/couponUsageModel'); // Ensure this is migrated or use generic
const { Op } = require('sequelize');

// @desc    Verify coupon
// @route   POST /api/coupons/verify
// @access  Public
exports.verifyCoupon = async (req, res) => {
    try {
        const { code, cartTotal, customerId, cartItems } = req.body;

        const coupon = await Coupon.findOne({ where: { code: code.toUpperCase(), status: 'active' } });

        if (!coupon) {
            return res.status(404).json({ message: 'Invalid coupon code' });
        }

        // 1. Check Expiry
        if (new Date() > coupon.expiryDate) {
            return res.status(400).json({ message: 'Coupon expired' });
        }

        // 2. Check Min Order Value
        if (cartTotal < coupon.minOrderValue) {
            return res.status(400).json({ message: `Min order value is ₹${coupon.minOrderValue}` });
        }

        // 3. Check Usage Limits (Global)
        if (coupon.usageLimit > 0) {
            const globalUsage = await CouponUsage.count({ where: { couponId: coupon.id } }); // Assuming CouponUsage model has couponId
            if (globalUsage >= coupon.usageLimit) {
                return res.status(400).json({ message: 'Coupon usage limit reached' });
            }
        }

        // 4. Check Per User Limit
        if (customerId) {
            // Check if CouponUsage has userId or customerId
            const userUsage = await CouponUsage.count({ where: { couponId: coupon.id, userId: customerId } });
            if (userUsage >= coupon.perUserLimit) {
                return res.status(400).json({ message: 'You have already used this coupon' });
            }
        }

        // 5. Subscription check
        const hasPaidItems = cartItems.some(item => item.price > 0);
        if (!hasPaidItems && cartItems.length > 0) {
            return res.status(400).json({ message: 'Coupon not applicable on subscription items' });
        }

        // Calculate Discount
        let discount = 0;
        if (coupon.type === 'flat') {
            discount = coupon.value;
        } else if (coupon.type === 'percent') {
            discount = (cartTotal * coupon.value) / 100;
            if (coupon.maxDiscount) {
                discount = Math.min(discount, coupon.maxDiscount);
            }
        }

        // Ensure discount doesn't exceed total
        discount = Math.min(discount, cartTotal);

        res.json({
            success: true,
            discount,
            finalTotal: cartTotal - discount,
            code: coupon.code
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Create new coupon
// @route   POST /api/coupons
// @access  Private (Admin)
exports.createCoupon = async (req, res) => {
    try {
        const { code, type, value, expiryDate, minOrderValue, usageLimit } = req.body;

        // Basic validation
        if (!code || !type || !value || !expiryDate) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const coupon = await Coupon.create({
            code: code.toUpperCase(),
            type,
            value,
            expiryDate,
            minOrderValue,
            usageLimit
        });

        res.status(201).json(coupon);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get all coupons
// @route   GET /api/coupons
// @access  Private (Admin)
exports.getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.findAll({ order: [['createdAt', 'DESC']] });
        res.json(coupons);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Delete coupon
// @route   DELETE /api/coupons/:id
// @access  Private (Admin)
exports.deleteCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findByPk(req.params.id);
        if (coupon) {
            await coupon.destroy();
            res.json({ message: 'Coupon deleted' });
        } else {
            res.status(404).json({ message: 'Coupon not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
