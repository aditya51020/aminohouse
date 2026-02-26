const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Ingredient = sequelize.define('Ingredient', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    currentStock: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
        allowNull: false
    },
    unit: {
        type: DataTypes.ENUM('g', 'ml', 'pcs', 'slice', 'kg', 'l'), // Using ENUM for units
        allowNull: false
    },
    costPerUnit: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    lowStockThreshold: {
        type: DataTypes.FLOAT,
        defaultValue: 10
    },
    manufacturer: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
    }
}, {
    timestamps: true // Adds createdAt and updatedAt
});

module.exports = Ingredient;
