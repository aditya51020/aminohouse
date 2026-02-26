const Order = require('../models/orderModel');
const Customer = require('../models/customerModel');
const Menu = require('../models/menuModel');
const Ingredient = require('../models/ingredientModel');
const InventoryLog = require('../models/inventoryLogModel');
const Setting = require('../models/settingModel');

const createOrder = async (req, res) => {
  let { items, totalAmount, paymentMethod, phone, sessionId, guestName, source, orderType, address, slot } = req.body;

  try {
    const kitchenSetting = await Setting.findOne({ key: 'kitchen_open' });
    if (source !== 'pos' && kitchenSetting && kitchenSetting.value === false) {
      return res.status(503).json({ message: 'Kitchen is temporarily closed. No new orders.' });
    }

    if (!items || !totalAmount || !paymentMethod || !sessionId) {
      return res.status(400).json({ message: 'Missing required fields (sessionId)' });
    }

    let customer = null;
    let guestDetails = null;

    if (req.user?.id) {
      customer = await Customer.findById(req.user.id);
    } else if (phone) {
      guestDetails = { name: guestName || 'Guest', phone };
    }

    // DUPLICATE ORDER PROTECTION
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
    const duplicateOrder = await Order.findOne({
      sessionId,
      totalAmount,
      createdAt: { $gte: thirtySecondsAgo }
    });

    if (duplicateOrder) {
      return res.status(409).json({ message: 'Duplicate order detected. Please wait a moment.' });
    }

    const deductions = [];
    const now = new Date();
    const currentHHMM = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

    for (const item of items) {
      const menuItem = await Menu.findById(item.menuItem).populate('recipe.ingredient');
      if (!menuItem) return res.status(404).json({ message: `Item not found` });

      const availStart = menuItem.availability?.start || '00:00';
      const availEnd = menuItem.availability?.end || '23:59';

      if (source !== 'pos' && menuItem.availability?.isTimeBound) {
        let isAvailable = false;
        if (availStart <= availEnd) {
          if (currentHHMM >= availStart && currentHHMM <= availEnd) isAvailable = true;
        } else {
          if (currentHHMM >= availStart || currentHHMM <= availEnd) isAvailable = true;
        }
        if (!isAvailable) {
          return res.status(400).json({ message: `${menuItem.name} is only available between ${availStart} and ${availEnd}` });
        }
      }

      if (menuItem.recipe && menuItem.recipe.length > 0) {
        for (const recipeItem of menuItem.recipe) {
          const ingredient = recipeItem.ingredient;
          const qtyRequired = recipeItem.quantityRequired;
          if (ingredient && qtyRequired > 0) {
            const requiredAmount = qtyRequired * item.quantity;
            if (source !== 'pos' && ingredient.currentStock < requiredAmount) {
              return res.status(400).json({ message: `Insufficient ${ingredient.name} for ${menuItem.name}.` });
            }
            deductions.push({ ingredient, deductAmount: requiredAmount });
          }
        }
      } else {
        if (source !== 'pos' && menuItem.quantity < item.quantity) {
          return res.status(400).json({ message: `${menuItem.name} is out of stock` });
        }
        menuItem.quantity -= item.quantity;
        if (menuItem.quantity <= 0) menuItem.inStock = false;
        await menuItem.save();
      }
    }

    for (const d of deductions) {
      d.ingredient.currentStock -= d.deductAmount;
      await d.ingredient.save();
    }

    const couponCode = req.body.discount?.couponCode || null;
    const discountAmount = req.body.discount?.discountAmount || 0;

    const order = await Order.create({
      sessionId,
      customerId: customer ? customer._id : null,
      guestDetails,
      items: items.map(i => ({
        menuItem: i.menuItem,
        quantity: i.quantity,
        customizations: i.customizations,
        price: i.price
      })),
      totalAmount,
      paymentMethod,
      orderType: orderType ? orderType.toLowerCase() : 'dine-in',
      deliveryDetails: { address, slot },
      discount: { couponCode, amount: discountAmount },
      status: 'Pending',
      statusHistory: [{ status: 'Pending', timestamp: new Date() }]
    });

    if (deductions.length > 0) {
      await InventoryLog.create(deductions.map(d => ({
        ingredientId: d.ingredient._id,
        orderId: order._id,
        name: d.ingredient.name,
        amount: d.deductAmount,
        unit: d.ingredient.unit,
        statusChange: 'Order Placed'
      })));
    }

    if (customer) {
      customer.loyaltyPoints += Math.floor(totalAmount / 100);
      customer.totalSpent += totalAmount;
      customer.visitCount += 1;
      await customer.save();
    }

    const populatedOrder = await Order.findById(order._id)
      .populate('customerId', 'name phone')
      .populate('items.menuItem', 'name price');

    res.status(201).json(populatedOrder);
  } catch (err) {
    console.error('Create order error:', err);
    res.status(400).json({ message: err.message });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.user.id })
      .populate('items.menuItem', 'name price')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const count = await Order.countDocuments();
    const orders = await Order.find({})
      .populate('customerId', 'name phone')
      .populate('items.menuItem', 'name price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      orders,
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customerId', 'name phone')
      .populate('items.menuItem', 'name price');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).select('status statusHistory');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getHistory = async (req, res) => {
  try {
    const { sessionId } = req.query;
    const userId = req.user?.id;
    let filter = {};
    if (userId) filter = { customerId: userId };
    else if (sessionId) filter = { sessionId };
    else return res.status(400).json({ message: 'Session ID or Login required' });

    const orders = await Order.find(filter)
      .populate('items.menuItem', 'name price')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getCurrentOrder = async (req, res) => {
  try {
    const { sessionId } = req.query;
    const userId = req.user?.id;
    let filter = {};
    if (userId) filter = { customerId: userId };
    else if (sessionId) filter = { sessionId };
    else return res.status(400).json({ message: 'No identity provided' });

    filter.status = { $in: ['Pending', 'Accepted', 'Cooking', 'Ready', 'Out for Delivery'] };

    const order = await Order.findOne(filter)
      .populate('items.menuItem', 'name price')
      .sort({ createdAt: -1 });
    res.json(order || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.status = status;
    order.statusHistory.push({ status, timestamp: new Date() });
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const getSales = async (req, res) => {
  try {
    const { period = 'daily', from, to } = req.query;
    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    let endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    if (from && to) {
      startDate = new Date(from);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(to);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'daily') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (period === 'monthly') {
      startDate.setMonth(startDate.getMonth() - 12);
    }

    const groupFormats = {
      daily: '%Y-%m-%d',
      monthly: '%Y-%m'
    };

    const sales = await Order.aggregate([
      {
        $match: {
          status: { $in: ['Paid', 'Completed', 'Served'] },
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: groupFormats[period] || '%Y-%m-%d', date: "$createdAt" } },
          total: { $sum: "$totalAmount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(sales);
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

const processPayment = async (req, res) => {
  res.status(501).json({ message: 'Payment integration pending' });
};

const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'cashier';
    const isOwner = order.sessionId === req.query.sessionId || (req.user?.id && order.customerId?.toString() === req.user.id);

    if (!isAdmin && !isOwner) return res.status(403).json({ message: 'Not authorized' });
    if (!isAdmin && order.status !== 'Pending') return res.status(400).json({ message: 'Only Pending orders can be cancelled' });

    order.status = 'Cancelled';
    order.statusHistory.push({ status: 'Cancelled', timestamp: new Date() });
    await order.save();
    res.json({ message: 'Order cancelled', order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrders,
  getOrder,
  getOrderStatus,
  getHistory,
  getCurrentOrder,
  updateOrderStatus,
  getSales,
  processPayment,
  cancelOrder
};