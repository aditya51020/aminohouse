const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OrderItem = sequelize.define('OrderItem', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    OrderId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Orders',
            key: 'id'
        }
    },
    MenuId: { // Renaming from menuItem to MenuId for consistency
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Menus',
            key: 'id'
        }
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    customizations: {
        type: DataTypes.JSONB,
        allowNull: true
    },
    customizationText: {
        type: DataTypes.STRING,
        allowNull: true
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: true
    }
}, {
    timestamps: true
});

module.exports = OrderItem;
