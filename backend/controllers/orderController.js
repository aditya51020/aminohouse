const Order = require('../models/orderModel');
const OrderItem = require('../models/OrderItem');
const Customer = require('../models/customerModel');
const Menu = require('../models/menuModel');
const Ingredient = require('../models/ingredientModel');
const InventoryLog = require('../models/inventoryLogModel');
const Setting = require('../models/settingModel');
const RecipeItem = require('../models/RecipeItem');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

const createOrder = async (req, res) => {
  // 0. Hard Limit: Kitchen Open Check
  let { items, totalAmount, paymentMethod, phone, sessionId, guestName, source, orderType, address, slot } = req.body;

  // Transaction for safety
  const t = await sequelize.transaction();

  try {
    // 0. Hard Limit: Kitchen Open Check (Skip for POS)
    const kitchenSetting = await Setting.findOne({ where: { key: 'kitchen_open' } });
    // Note: kitchenSetting.value is JSON, so it might be boolean true/false directly if stored as such
    if (source !== 'pos' && kitchenSetting && kitchenSetting.value === false) {
      await t.rollback();
      return res.status(503).json({ message: 'Kitchen is temporarily closed. No new orders.' });
    }

    if (!items || !totalAmount || !paymentMethod || !sessionId) {
      await t.rollback();
      return res.status(400).json({ message: 'Missing required fields (sessionId)' });
    }

    let customer = null;
    let guestDetails = null;

    // 1. Attempt to resolve Customer
    if (req.user?.id) {
      customer = await Customer.findByPk(req.user.id);
    } else if (phone) {
      guestDetails = {
        name: guestName || 'Guest',
        phone: phone
      };
    }

    // 0.5. DUPLICATE ORDER PROTECTION
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
    const duplicateOrder = await Order.findOne({
      where: {
        sessionId,
        totalAmount,
        createdAt: { [Op.gte]: thirtySecondsAgo }
      }
    });

    if (duplicateOrder) {
      await t.rollback();
      console.warn(`Blocked duplicate order for session ${sessionId}`);
      return res.status(409).json({ message: 'Duplicate order detected. Please wait a moment.' });
    }

    // CHECK & UPDATE INVENTORY + TIME AVAILABILITY
    const deductions = [];
    const now = new Date();
    const currentHHMM = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

    // We process items, check stock, and prepare deductions
    for (const item of items) {
      const menuItem = await Menu.findByPk(item.menuItem, {
        include: [{
          model: Ingredient,
          through: { attributes: ['quantityRequired'] }
        }]
      });

      if (!menuItem) {
        await t.rollback();
        return res.status(404).json({ message: `Item not found` });
      }

      // TIME AVAILABILITY CHECK (Skip for POS)
      const availStart = menuItem.availability_start || '00:00';
      const availEnd = menuItem.availability_end || '23:59';

      if (source !== 'pos' && menuItem.availability_isTimeBound) {
        let isAvailable = false;
        if (availStart <= availEnd) {
          if (currentHHMM >= availStart && currentHHMM <= availEnd) isAvailable = true;
        } else {
          if (currentHHMM >= availStart || currentHHMM <= availEnd) isAvailable = true;
        }

        if (!isAvailable) {
          await t.rollback();
          return res.status(400).json({
            message: `${menuItem.name} is only available between ${availStart} and ${availEnd}`
          });
        }
      }

      if (menuItem.Ingredients && menuItem.Ingredients.length > 0) {
        for (const ingredient of menuItem.Ingredients) {
          const qtyRequired = ingredient.RecipeItem ? ingredient.RecipeItem.quantityRequired : 0;
          if (qtyRequired > 0) {
            const requiredAmount = qtyRequired * item.quantity;

            if (source !== 'pos' && ingredient.currentStock < requiredAmount) {
              await t.rollback();
              return res.status(400).json({
                message: `Insufficient ${ingredient.name} for ${menuItem.name}.`
              });
            }

            deductions.push({
              ingredient: ingredient,
              deductAmount: requiredAmount,
              menuItemName: menuItem.name
            });
          }
        }
      } else {
        // No recipe, rely on simple quantity
        if (source !== 'pos' && menuItem.quantity < item.quantity) {
          await t.rollback();
          return res.status(400).json({ message: `${menuItem.name} is out of stock` });
        }

        // Update menu item quantity
        await menuItem.decrement('quantity', { by: item.quantity, transaction: t });

        // Check if out of stock
        // Need to reload to check new quantity or just calculate
        if (menuItem.quantity - item.quantity <= 0) {
          await menuItem.update({ inStock: false }, { transaction: t });
        }
      }
    }

    // Apply Deductions
    const logEntries = [];
    for (const d of deductions) {
      await d.ingredient.decrement('currentStock', { by: d.deductAmount, transaction: t });

      logEntries.push({
        ingredientId: d.ingredient.id,
        name: d.ingredient.name,
        amount: d.deductAmount,
        unit: d.ingredient.unit
      });
    }

    // Create Order — extract coupon info from request body
    const couponCode = req.body.discount?.couponCode || null;
    const discountAmount = req.body.discount?.discountAmount || 0;

    const order = await Order.create({
      sessionId,
      customerId: customer ? customer.id : null,
      guestDetails_name: guestDetails ? guestDetails.name : null,
      guestDetails_phone: guestDetails ? guestDetails.phone : null,
      totalAmount,
      paymentMethod,
      orderType: orderType || 'dine-in',
      deliveryDetails_address: address,
      deliveryDetails_slot: slot,
      discount_couponCode: couponCode,
      discount_amount: discountAmount,
      status: 'Pending',
      statusHistory: [{ status: 'Pending', timestamp: new Date() }]
    }, { transaction: t });

    // Create Order Items
    for (const item of items) {
      await OrderItem.create({
        OrderId: order.id,
        MenuId: item.menuItem,
        quantity: item.quantity,
        customizations: item.customizations,
        price: item.price
      }, { transaction: t });
    }

    if (logEntries.length > 0) {
      await InventoryLog.create({
        orderId: order.id,
        statusChange: 'Order Placed',
        deductions: logEntries
      }, { transaction: t });
    }

    // LOYALTY POINTS + ANALYTICS UPDATE
    if (customer) {
      const pointsEarned = Math.floor(totalAmount / 100);
      await customer.increment({
        loyaltyPoints: pointsEarned,
        totalSpent: totalAmount,
        visitCount: 1
      }, { transaction: t });
    }

    await t.commit();

    // Populate safely for response
    const populatedOrder = await Order.findByPk(order.id, {
      include: [
        { model: Customer, attributes: ['name', 'phone'] },
        { model: OrderItem, include: [{ model: Menu, attributes: ['name', 'price'] }] }
      ]
    });

    res.status(201).json(populatedOrder);
  } catch (err) {
    await t.rollback();
    console.error('Create order error:', err);
    res.status(400).json({ message: err.message });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const customerId = req.user.id;
    const orders = await Order.findAll({
      where: { customerId: customerId },
      include: [
        { model: OrderItem, include: [{ model: Menu, attributes: ['name', 'price'] }] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


const getOrders = async (req, res) => {
  try {
    // Pagination support: ?page=1&limit=50
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const { count, rows: orders } = await Order.findAndCountAll({
      include: [
        { model: Customer, attributes: ['name', 'phone'] },
        { model: OrderItem, include: [{ model: Menu, attributes: ['name', 'price'] }] }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

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
    console.error('getOrders error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getOrder = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: Customer, attributes: ['name', 'phone'] },
        { model: OrderItem, include: [{ model: Menu, attributes: ['name', 'price'] }] }
      ]
    });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// [NEW] Get Order Status (Lightweight polling)
const getOrderStatus = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      attributes: ['status', 'statusHistory']
    });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// [NEW] Get Order History (Session or User)
const getHistory = async (req, res) => {
  try {
    const { sessionId } = req.query;
    const userId = req.user?.id; // From optionalAuth

    let where = {};

    if (userId) {
      where = { customerId: userId };
    } else if (sessionId) {
      where = { sessionId: sessionId };
    } else {
      return res.status(400).json({ message: 'Session ID or Login required' });
    }

    const orders = await Order.findAll({
      where: where,
      include: [
        { model: OrderItem, include: [{ model: Menu, attributes: ['name', 'price'] }] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(orders);
  } catch (err) {
    console.error('getHistory error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// [NEW] Get Current Active Order
const getCurrentOrder = async (req, res) => {
  try {
    const { sessionId } = req.query;
    const userId = req.user?.id;

    let where = {};
    if (userId) where = { customerId: userId };
    else if (sessionId) where = { sessionId };
    else return res.status(400).json({ message: 'No identity provided' });

    const activeStatuses = ['Pending', 'Accepted', 'Cooking', 'Ready', 'Out for Delivery'];

    // Add status check to where clause
    where.status = { [Op.in]: activeStatuses };

    const order = await Order.findOne({
      where: where,
      include: [
        { model: OrderItem, include: [{ model: Menu, attributes: ['name', 'price'] }] }
      ],
      order: [['createdAt', 'DESC']]
    });

    if (!order) return res.json(null); // No active order

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  const flow = ['Pending', 'Accepted', 'Cooking', 'Ready', 'Out for Delivery', 'Delivered', 'Served', 'Completed'];

  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Update status history
    let history = order.statusHistory || [];
    // Ensure history is an array (JSONB)
    if (typeof history === 'string') history = JSON.parse(history);

    history.push({ status, timestamp: new Date() });

    await order.update({
      status: status,
      statusHistory: history
    });

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
      startDate.setDate(startDate.getDate() - 30); // Default last 30 days
    } else if (period === 'monthly') {
      startDate.setMonth(startDate.getMonth() - 12); // Default last 12 months
    }

    let dateFormat;
    if (period === 'monthly' && !from) {
      dateFormat = 'YYYY-MM';
    } else {
      dateFormat = 'YYYY-MM-DD';
    }

    // Using raw query for easier date grouping across different SQL dialects, 
    // or Sequelize aggregate.
    // Postgres date_trunc or to_char.

    // Group by
    // We want to group by date part of createdAt

    const sales = await Order.findAll({
      attributes: [
        [sequelize.fn('to_char', sequelize.col('createdAt'), dateFormat), '_id'],
        [sequelize.fn('sum', sequelize.col('totalAmount')), 'total'],
        [sequelize.fn('count', sequelize.col('id')), 'count']
      ],
      where: {
        status: { [Op.in]: ['Paid', 'Completed', 'Served'] },
        createdAt: {
          [Op.gte]: startDate,
          [Op.lte]: endDate
        }
      },
      group: [sequelize.fn('to_char', sequelize.col('createdAt'), dateFormat)],
      order: [[sequelize.fn('to_char', sequelize.col('createdAt'), dateFormat), 'ASC']]
    });

    res.json(sales);
  } catch (err) {
    console.error('getSales error:', err.message);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

const processPayment = async (req, res) => {
  res.status(501).json({ message: 'Payment integration pending' });
};

// Cancel Order (Customer can cancel Pending orders; Admin can cancel any)
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Customers can only cancel their own Pending orders
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'cashier';
    const isOwner = order.sessionId === req.query.sessionId ||
      (req.user?.id && order.customerId === req.user.id);

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Not authorized to cancel this order' });
    }

    if (!isAdmin && order.status !== 'Pending') {
      return res.status(400).json({ message: 'Only Pending orders can be cancelled' });
    }

    const history = Array.isArray(order.statusHistory) ? order.statusHistory : [];
    history.push({ status: 'Cancelled', timestamp: new Date() });

    await order.update({ status: 'Cancelled', statusHistory: history });
    res.json({ message: 'Order cancelled successfully', order });
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