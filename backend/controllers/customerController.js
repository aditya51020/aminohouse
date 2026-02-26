const Customer = require('../models/customerModel');
const { Op } = require('sequelize');

// SEARCH / GET (by Phone or ID)
const getCustomers = async (req, res) => {
  try {
    const { phone, query } = req.query;
    let where = {};

    // Exact phone search for POS
    if (phone) {
      const customer = await Customer.findOne({ where: { phone } });
      return res.json(customer ? [customer] : []);
    }

    // General search (Name or Phone)
    if (query) {
      where = {
        [Op.or]: [
          { name: { [Op.iLike]: `%${query}%` } },
          { phone: { [Op.iLike]: `%${query}%` } }
        ]
      };
    }

    const customers = await Customer.findAll({
      where,
      order: [['updatedAt', 'DESC']], // approximate lastVisit if field not present, or use lastVisit if exists
      limit: 50
    });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CREATE
const createCustomer = async (req, res) => {
  try {
    const { name, phone, email } = req.body;
    const existing = await Customer.findOne({ where: { phone } });
    if (existing) return res.status(400).json({ message: 'Customer with this phone already exists' });

    const customer = await Customer.create({ name, phone, email });
    res.status(201).json(customer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// UPDATE (e.g. Points adjustment manually)
const updateCustomer = async (req, res) => {
  try {
    const { name, email, points } = req.body;

    // Check if customer exists
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    // Update fields
    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (points !== undefined) updates.loyaltyPoints = points; // Map points to loyaltyPoints

    await customer.update(updates);

    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// EXPORT CSV
const exportCustomersCSV = async (req, res) => {
  try {
    const customers = await Customer.findAll({
      order: [['createdAt', 'DESC']]
    });

    const rows = [
      ['Name', 'Phone', 'Email', 'Loyalty Points', 'Joined Date'],
      ...customers.map(c => [
        c.name || '',
        c.phone || '',
        c.email || '',
        c.loyaltyPoints || 0,
        c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN') : ''
      ])
    ];

    const csv = rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="customers_${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getCustomers, createCustomer, updateCustomer, exportCustomersCSV };