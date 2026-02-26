const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Combo = sequelize.define('Combo', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    comboPrice: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    originalPrice: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    imageUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    // Array of { menuItemId, name, price, imageUrl }
    items: {
        type: DataTypes.JSONB,
        defaultValue: []
    }
}, {
    timestamps: true
});

module.exports = Combo;
