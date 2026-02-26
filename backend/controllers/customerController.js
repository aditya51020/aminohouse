const Customer = require('../models/customerModel');

// SEARCH / GET (by Phone or ID)
const getCustomers = async (req, res) => {
  try {
    const { phone, query } = req.query;
    let filter = {};

    if (phone) {
      const customer = await Customer.findOne({ phone });
      return res.json(customer ? [customer] : []);
    }

    if (query) {
      filter = {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { phone: { $regex: query, $options: 'i' } }
        ]
      };
    }

    const customers = await Customer.find(filter)
      .sort({ updatedAt: -1 })
      .limit(50);
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CREATE
const createCustomer = async (req, res) => {
  try {
    const { name, phone, email } = req.body;
    const existing = await Customer.findOne({ phone });
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
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    if (name) customer.name = name;
    if (email) customer.email = email;
    if (points !== undefined) customer.loyaltyPoints = points;

    await customer.save();
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// EXPORT CSV
const exportCustomersCSV = async (req, res) => {
  try {
    const customers = await Customer.find({}).sort({ createdAt: -1 });

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
