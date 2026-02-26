const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Junction table for Many-to-Many relationship between Menu and Ingredient
const RecipeItem = sequelize.define('RecipeItem', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    MenuId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Menus',
            key: 'id'
        }
    },
    IngredientId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Ingredients',
            key: 'id'
        }
    },
    quantityRequired: {
        type: DataTypes.FLOAT,
        allowNull: false
    }
}, {
    timestamps: false
});

module.exports = RecipeItem;
