const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Menu = sequelize.define('Menu', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  cost: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  inStock: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isSubscriptionItem: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 100
  },
  lowStockThreshold: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  },
  recipeName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  preparationSteps: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  station: {
    type: DataTypes.ENUM('Sandwich', 'Shake', 'Egg', 'Fryer', 'Other'),
    defaultValue: 'Other'
  },
  availability_isTimeBound: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  availability_start: {
    type: DataTypes.STRING,
    defaultValue: '00:00'
  },
  availability_end: {
    type: DataTypes.STRING,
    defaultValue: '23:59'
  }
}, {
  timestamps: true
});

module.exports = Menu;