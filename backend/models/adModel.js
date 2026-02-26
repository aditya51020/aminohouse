const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Ad = sequelize.define('Ad', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    imageUrl: {
        type: DataTypes.STRING,
        allowNull: false
    },
    redirectUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    startDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    endDate: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    timestamps: true
});

module.exports = Ad;
