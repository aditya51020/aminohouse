// controllers/customerAuthController.js
const Customer = require('../models/customerModel');
const jwt = require('jsonwebtoken');

const generateToken = (id) => jwt.sign({ id, type: 'customer' }, process.env.JWT_SECRET || 'fallback-secret-123', { expiresIn: '30d' });

exports.customerLogin = async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ message: 'Phone required' });

  try {
    const [customer, created] = await Customer.findOrCreate({
      where: { phone },
      defaults: { phone }
    });

    const token = generateToken(customer.id);
    res.json({ token, customer: { id: customer.id, phone: customer.phone, name: customer.name, hasProfile: !!customer.name } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.completeCustomerProfile = async (req, res) => {
  const { name, email } = req.body;
  try {
    const customer = await Customer.findByPk(req.user.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    await customer.update({ name, email });

    // Refresh fetch for select logic if needed, but instance is updated
    res.json({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};