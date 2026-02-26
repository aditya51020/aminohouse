const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  sessionId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  customerId: { // Foreign key to Customer
    type: DataTypes.UUID,
    allowNull: true
  },
  guestDetails_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  guestDetails_phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  totalAmount: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  paymentMethod: {
    type: DataTypes.ENUM('upi', 'card', 'netbanking', 'wallet', 'cod', 'cash'),
    allowNull: false
  },
  orderType: {
    type: DataTypes.ENUM('dine-in', 'takeaway', 'delivery'),
    defaultValue: 'dine-in'
  },
  deliveryDetails_address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  deliveryDetails_slot: {
    type: DataTypes.STRING,
    allowNull: true
  },
  deliveryDetails_coordinates: {
    type: DataTypes.JSONB, // { lat: Number, lng: Number }
    allowNull: true
  },
  discount_couponCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  discount_amount: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Accepted', 'Cooking', 'Ready', 'Served', 'Out for Delivery', 'Delivered', 'Paid', 'Completed', 'Cancelled'),
    defaultValue: 'Pending'
  },
  statusHistory: {
    type: DataTypes.JSONB, // Array of status updates
    defaultValue: []
  }
}, {
  timestamps: true
});

module.exports = Order;