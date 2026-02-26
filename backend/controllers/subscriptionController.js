const Subscription = require('../models/subscriptionModel');
const SubscriptionUsage = require('../models/subscriptionUsageModel');
const Menu = require('../models/menuModel');
const Order = require('../models/orderModel');
const Customer = require('../models/customerModel');

// Calculate end date based on plan type
const getEndDate = (startDate, days) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + days);
    return date;
};

// @desc    Buy a subscription
exports.buySubscription = async (req, res) => {
    try {
        const { customerId, planType } = req.body;

        if (![7, 14, 30].includes(planType)) {
            return res.status(400).json({ message: 'Invalid plan type' });
        }

        const existing = await Subscription.findOne({
            customerId,
            status: 'active',
            endDate: { $gt: new Date() }
        });

        if (existing) {
            return res.status(400).json({ message: 'User already has an active subscription' });
        }

        const startDate = new Date();
        const endDate = getEndDate(startDate, planType);

        const subscription = await Subscription.create({
            customerId,
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
exports.getSubscriptionStatus = async (req, res) => {
    try {
        const { customerId } = req.params;

        const subscription = await Subscription.findOne({
            customerId,
            status: 'active',
            endDate: { $gt: new Date() }
        });

        if (!subscription) {
            return res.status(200).json({ active: false });
        }

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const usage = await SubscriptionUsage.findOne({
            subscriptionId: subscription._id,
            usedAt: { $gte: startOfToday }
        });

        const dailyItem = await Menu.findOne({ isSubscriptionItem: true, inStock: true });

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
exports.claimDailyMeal = async (req, res) => {
    try {
        const { customerId } = req.body;

        const subscription = await Subscription.findOne({
            customerId,
            status: 'active',
            endDate: { $gt: new Date() }
        });

        if (!subscription) {
            return res.status(400).json({ message: 'No active subscription' });
        }

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const existingUsage = await SubscriptionUsage.findOne({
            subscriptionId: subscription._id,
            usedAt: { $gte: startOfToday }
        });

        if (existingUsage) {
            return res.status(400).json({ message: 'Already claimed for today' });
        }

        let coldCoffee = await Menu.findOne({
            name: { $regex: /(cold coffee|coffee)/, $options: 'i' },
            inStock: true
        });
        if (!coldCoffee) {
            coldCoffee = await Menu.findOne({ category: { $regex: /beverage/i }, inStock: true });
        }
        if (!coldCoffee) {
            coldCoffee = await Menu.findOne({ inStock: true });
        }

        const foodItem = await Menu.findOne({ isSubscriptionItem: true, inStock: true });

        if (!foodItem) {
            return res.status(500).json({ message: 'Today\'s subscription meal is out of stock!' });
        }

        const order = await Order.create({
            customerId: customerId,
            sessionId: 'SUBSCRIPTION-' + customerId,
            items: [
                { menuItem: foodItem._id, quantity: 1, price: 0 },
                { menuItem: coldCoffee._id, quantity: 1, price: 0 }
            ],
            totalAmount: 0,
            paymentMethod: 'subscription',
            orderType: req.body.orderType || 'takeaway',
            status: 'Accepted',
            statusHistory: [{ status: 'Accepted', timestamp: new Date() }]
        });

        await SubscriptionUsage.create({
            customerId,
            subscriptionId: subscription._id,
            orderId: order._id,
            usedAt: new Date()
        });

        res.json({ message: 'Meal claimed successfully!', orderId: order._id });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};
