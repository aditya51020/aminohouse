const Ingredient = require('../models/ingredientModel');
const Order = require('../models/orderModel');
const Menu = require('../models/menuModel');

exports.getPrepSuggestions = async (req, res) => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const orders = await Order.find({
            createdAt: { $gte: sevenDaysAgo },
            status: { $ne: 'Cancelled' }
        });

        const itemSales = {};
        orders.forEach(order => {
            if (order.items) {
                order.items.forEach(item => {
                    const id = item.menuItem.toString();
                    itemSales[id] = (itemSales[id] || 0) + item.quantity;
                });
            }
        });

        const menuItems = await Menu.find({}).populate('recipe.ingredient');

        const suggestions = {};

        for (const menuItem of menuItems) {
            const totalSold7Days = itemSales[menuItem._id.toString()] || 0;
            const dailyAvg = totalSold7Days / 7;

            if (dailyAvg > 0 && menuItem.recipe && menuItem.recipe.length > 0) {
                const station = menuItem.category || 'Other';
                if (!suggestions[station]) suggestions[station] = [];

                menuItem.recipe.forEach(ri => {
                    const ing = ri.ingredient;
                    const qtyRequired = ri.quantityRequired;
                    if (ing && qtyRequired > 0) {
                        const needed = qtyRequired * dailyAvg * 1.2;
                        const existing = suggestions[station].find(i => i.name === ing.name);
                        if (existing) {
                            existing.qty += needed;
                        } else {
                            suggestions[station].push({
                                id: ing._id,
                                name: ing.name,
                                unit: ing.unit,
                                qty: needed
                            });
                        }
                    }
                });
            }
        }

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
        const ingredients = await Ingredient.find({}).sort({ name: 1 });
        res.json(ingredients);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createIngredient = async (req, res) => {
    try {
        const { name, unit, currentStock, costPerUnit, lowStockThreshold, manufacturer } = req.body;
        const ingredient = await Ingredient.create({ name, unit, currentStock, costPerUnit, lowStockThreshold, manufacturer });
        res.status(201).json(ingredient);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.updateIngredient = async (req, res) => {
    try {
        const ingredient = await Ingredient.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (ingredient) {
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
        const deleted = await Ingredient.findByIdAndDelete(req.params.id);
        if (deleted) {
            res.json({ message: 'Deleted successfully' });
        } else {
            res.status(404).json({ message: 'Ingredient not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
