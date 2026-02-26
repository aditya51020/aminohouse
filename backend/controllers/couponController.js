const Coupon = require('../models/couponModel');
const CouponUsage = require('../models/couponUsageModel');
const { Op } = require('sequelize');

// @desc    Verify coupon
// @route   POST /api/coupons/verify
// @access  Public
exports.verifyCoupon = async (req, res) => {
    try {
        const { code, cartTotal, customerId, cartItems } = req.body;

        const coupon = await Coupon.findOne({
            where: {
                code: code.toUpperCase(),
                isActive: true
            }
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
            const globalUsage = await CouponUsage.count({ where: { couponId: coupon.id } });
            if (globalUsage >= coupon.usageLimit) {
                return res.status(400).json({ message: 'Coupon usage limit reached' });
            }
        }

        // 4. Check Per User Limit (Assuming 1 for now if not in model, or skip if no limit)
        // Adjusting based on model which had usageLimit (global) and usedCount. 
        // Adding check if customerId provided.
        if (customerId) {
            const userUsage = await CouponUsage.count({ where: { couponId: coupon.id, customerId } });
            // Default per user limit to 1 if not specified in model
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

        // Ensure discount doesn't exceed total
        discount = Math.min(discount, cartTotal);

        res.json({
            success: true,
            discount,
            finalTotal: cartTotal - discount,
            code: coupon.code,
            couponId: coupon.id
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
        const { code, discountType, discountValue, expirationDate, minOrderValue, usageLimit, maxDiscount } = req.body;

        // Basic validation
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
