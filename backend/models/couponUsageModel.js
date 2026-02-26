const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CouponUsage = sequelize.define('CouponUsage', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    couponId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    customerId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    orderId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    usedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: true
});

module.exports = CouponUsage;
