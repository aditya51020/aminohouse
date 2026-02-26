const Ingredient = require('../models/ingredientModel');
const Order = require('../models/orderModel');
const OrderItem = require('../models/OrderItem');
const Menu = require('../models/menuModel');
const { Op } = require('sequelize');

exports.getPrepSuggestions = async (req, res) => {
    try {
        // 1. Analyze last 7 days sales
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const orders = await Order.findAll({
            where: {
                createdAt: { [Op.gte]: sevenDaysAgo },
                status: { [Op.ne]: 'Cancelled' }
            },
            include: [{
                model: OrderItem,
                attributes: ['MenuId', 'quantity']
            }]
        });

        // 2. Calculate Avg Qty per Menu Item
        const itemSales = {};
        orders.forEach(order => {
            if (order.OrderItems) {
                order.OrderItems.forEach(item => {
                    const id = item.MenuId;
                    itemSales[id] = (itemSales[id] || 0) + item.quantity;
                });
            }
        });

        const menuItems = await Menu.findAll({
            include: [{
                model: Ingredient,
                through: { attributes: ['quantityRequired'] } // Include junction table data
            }]
        });

        // 3. Group by Station
        const suggestions = {};

        for (const menuItem of menuItems) {
            const totalSold7Days = itemSales[menuItem.id] || 0;
            const dailyAvg = totalSold7Days / 7;

            // Check if menuItem has ingredients (Sequelize puts them in menuItem.Ingredients)
            if (dailyAvg > 0 && menuItem.Ingredients && menuItem.Ingredients.length > 0) {
                const station = menuItem.station || 'Other';
                if (!suggestions[station]) suggestions[station] = [];

                // For each ingredient in recipe
                menuItem.Ingredients.forEach(ing => {
                    // Access quantity from junction table (RecipeItem)
                    const qtyRequired = ing.RecipeItem ? ing.RecipeItem.quantityRequired : 0;

                    const needed = qtyRequired * dailyAvg * 1.2; // 20% buffer

                    // Check if ingredient already listed for this station
                    const existing = suggestions[station].find(i => i.name === ing.name);
                    if (existing) {
                        existing.qty += needed;
                    } else {
                        suggestions[station].push({
                            id: ing.id,
                            name: ing.name,
                            unit: ing.unit,
                            qty: needed
                        });
                    }
                });
            }
        }

        // Round numbers
        Object.keys(suggestions).forEach(station => {
            suggestions[station].forEach(item => {
                item.qty = Math.ceil(item.qty);
            });
        });

        res.json(suggestions);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to calculate prep suggestions' });
    }
};

exports.getIngredients = async (req, res) => {
    try {
        const ingredients = await Ingredient.findAll({
            order: [['name', 'ASC']]
        });
        res.json(ingredients);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createIngredient = async (req, res) => {
    try {
        const { name, unit, currentStock, costPerUnit, lowStockThreshold, manufacturer } = req.body;
        const ingredient = await Ingredient.create({ name, unit, currentStock, costPerUnit, lowStockThreshold, manufacturer: manufacturer || null });
        res.status(201).json(ingredient);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.updateIngredient = async (req, res) => {
    try {
        const [updated] = await Ingredient.update(req.body, {
            where: { id: req.params.id }
        });
        if (updated) {
            const ingredient = await Ingredient.findByPk(req.params.id);
            res.json(ingredient);
        } else {
            res.status(404).json({ message: 'Ingredient not found' });
        }
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteIngredient = async (req, res) => {
    try {
        const deleted = await Ingredient.destroy({
            where: { id: req.params.id }
        });
        if (deleted) {
            res.json({ message: 'Deleted successfully' });
        } else {
            res.status(404).json({ message: 'Ingredient not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
