const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SubscriptionUsage = sequelize.define('SubscriptionUsage', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    subscriptionId: { // Foreign key to Subscription
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Subscriptions',
            key: 'id'
        }
    },
    date: {
        type: DataTypes.DATEONLY, // Store YYYY-MM-DD
        allowNull: false
    },
    claimed: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    claimedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: true
});

module.exports = SubscriptionUsage;
