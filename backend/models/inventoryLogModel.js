const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const InventoryLog = sequelize.define('InventoryLog', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    orderId: {
        type: DataTypes.UUID,
        allowNull: true // Can be null if manual adjustment
    },
    statusChange: {
        type: DataTypes.STRING,
        allowNull: true
    },
    deductions: {
        type: DataTypes.JSONB, // Store array of deducted ingredients as JSON for log history
        defaultValue: []
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: false // We use our own timestamp field, or could use createdAt
});

module.exports = InventoryLog;
