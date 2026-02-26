const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Coupon = sequelize.define('Coupon', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    discountType: {
        type: DataTypes.ENUM('percentage', 'fixed'),
        allowNull: false
    },
    discountValue: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    minOrderValue: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    maxDiscount: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    expirationDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    usageLimit: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    usedCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    timestamps: true
});

module.exports = Coupon;
