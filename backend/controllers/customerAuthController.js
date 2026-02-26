// controllers/customerAuthController.js
const Customer = require('../models/customerModel');
const jwt = require('jsonwebtoken');

const generateToken = (id) => jwt.sign({ id, type: 'customer' }, process.env.JWT_SECRET || 'fallback-secret-123', { expiresIn: '30d' });

exports.customerLogin = async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ message: 'Phone required' });
  console.log(`Customer login attempt for: ${phone}`);

  try {
    // MongoDB Equivalent of findOrCreate
    let customer = await Customer.findOne({ phone });
    if (!customer) {
      customer = await Customer.create({ phone });
      console.log(`New customer record created for: ${phone}`);
    }

    const token = generateToken(customer._id);
    res.json({ token, customer: { id: customer._id, phone: customer.phone, name: customer.name, hasProfile: !!customer.name } });
  } catch (err) {
    console.error('Customer Login Error:', err);
    res.status(500).json({ message: `Internal Server Error: ${err.message}` });
  }
};

exports.completeCustomerProfile = async (req, res) => {
  const { name, email } = req.body;
  try {
    const customer = await Customer.findById(req.user.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    customer.name = name;
    customer.email = email;
    await customer.save();

    res.json({
      id: customer._id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};