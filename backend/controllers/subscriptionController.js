const Subscription = require('../models/subscriptionModel');
const SubscriptionUsage = require('../models/subscriptionUsageModel');
const Menu = require('../models/menuModel');
const Order = require('../models/orderModel');
const OrderItem = require('../models/OrderItem');
const Customer = require('../models/customerModel');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

// Calculate end date based on plan type
const getEndDate = (startDate, days) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + days);
    return date;
};

// @desc    Buy a subscription
// @route   POST /api/subscriptions/buy
// @access  Public (Customer)
exports.buySubscription = async (req, res) => {
    try {
        const { customerId, planType } = req.body;

        if (![7, 14, 30].includes(planType)) {
            return res.status(400).json({ message: 'Invalid plan type' });
        }

        // Check if user already has active subscription
        const existing = await Subscription.findOne({
            where: {
                userId: customerId, // Assuming userId field in Subscription model
                status: 'active',
                endDate: { [Op.gt]: new Date() }
            }
        });

        if (existing) {
            return res.status(400).json({ message: 'User already has an active subscription' });
        }

        const startDate = new Date();
        const endDate = getEndDate(startDate, planType);

        const subscription = await Subscription.create({
            userId: customerId,
            planType,
            startDate,
            endDate,
            status: 'active'
        });

        res.status(201).json(subscription);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get subscription status
// @route   GET /api/subscriptions/status/:customerId
// @access  Public
exports.getSubscriptionStatus = async (req, res) => {
    try {
        const { customerId } = req.params;

        // Find active subscription
        const subscription = await Subscription.findOne({
            where: {
                userId: customerId,
                status: 'active',
                endDate: { [Op.gt]: new Date() }
            }
        });

        if (!subscription) {
            return res.status(200).json({ active: false });
        }

        // Check if claimed today
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const usage = await SubscriptionUsage.findOne({
            where: {
                subscriptionId: subscription.id,
                date: startOfToday // Assuming date is stored as date-only or check range
                // If date is strings YYYY-MM-DD
                // date: new Date().toISOString().split('T')[0]
            }
        });

        // Find today's meal item
        const dailyItem = await Menu.findOne({ where: { isSubscriptionItem: true, inStock: true } });

        res.json({
            active: true,
            daysRemaining: Math.ceil((new Date(subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24)),
            claimedToday: !!usage,
            todayItem: dailyItem || { name: 'Surprise Meal' },
            subscription
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Claim daily meal
// @route   POST /api/subscriptions/claim
// @access  Public
exports.claimDailyMeal = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { customerId } = req.body;

        // 1. Validate Subscription
        const subscription = await Subscription.findOne({
            where: {
                userId: customerId,
                status: 'active',
                endDate: { [Op.gt]: new Date() }
            },
            transaction: t
        });

        if (!subscription) {
            await t.rollback();
            return res.status(400).json({ message: 'No active subscription' });
        }

        // 2. Check Daily Usage
        // const todayStr = new Date().toISOString().split('T')[0];
        const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

        const existingUsage = await SubscriptionUsage.findOne({
            where: {
                subscriptionId: subscription.id,
                date: todayStr
            },
            transaction: t
        });

        if (existingUsage) {
            await t.rollback();
            return res.status(400).json({ message: 'Already claimed for today' });
        }

        // 3. Identify Items (1 Food + 1 Beverage)
        // First try to find a beverage marked as subscription item, then any beverage, then any item
        let coldCoffee = await Menu.findOne({
            where: {
                [Op.or]: [
                    { name: { [Op.iLike]: '%cold coffee%' } },
                    { name: { [Op.iLike]: '%coffee%' } }
                ],
                inStock: true
            }
        });
        if (!coldCoffee) {
            coldCoffee = await Menu.findOne({ where: { category: { [Op.iLike]: '%beverage%' }, inStock: true } });
        }
        if (!coldCoffee) {
            coldCoffee = await Menu.findOne({ where: { inStock: true } });
        }

        const foodItem = await Menu.findOne({ where: { isSubscriptionItem: true, inStock: true } });

        if (!foodItem) {
            await t.rollback();
            return res.status(500).json({ message: 'Today\'s subscription meal is out of stock!' });
        }

        // 4. Create Order
        const order = await Order.create({
            customerId: customerId,
            sessionId: 'SUBSCRIPTION-' + customerId, // Mock session for internal tracking
            totalAmount: 0,
            paymentMethod: 'wallet', // Or 'subscription'
            status: 'Accepted',
            orderType: req.body.orderType || 'takeaway',
            // discount: ... (JSONB field if needed, or structured)
        }, { transaction: t });

        // Create Order Items
        const itemsToCreate = [
            {
                OrderId: order.id,
                MenuId: foodItem.id,
                quantity: 1,
                price: 0
            },
            {
                OrderId: order.id,
                MenuId: coldCoffee.id,
                quantity: 1,
                price: 0
            }
        ];

        for (const item of itemsToCreate) {
            await OrderItem.create(item, { transaction: t });
        }

        // 5. Record Usage
        await SubscriptionUsage.create({
            subscriptionId: subscription.id,
            date: todayStr,
            claimed: true,
            claimedAt: new Date()
        }, { transaction: t });

        await t.commit();

        res.json({ message: 'Meal claimed successfully!', orderId: order.id });

    } catch (err) {
        await t.rollback();
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};
