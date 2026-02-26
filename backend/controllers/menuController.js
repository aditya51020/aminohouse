const Menu = require('../models/menuModel');
const Ingredient = require('../models/ingredientModel');
const RecipeItem = require('../models/RecipeItem');

exports.getMenu = async (req, res) => {
  try {
    // [MODIFIED] Include ingredients to check real-time stock
    const menu = await Menu.findAll({
      include: [{
        model: Ingredient,
        through: { attributes: ['quantityRequired'] }
      }]
    });

    // Dynamic Stock Calculation
    const menuWithStock = menu.map(item => {
      const itemObj = item.toJSON(); // Convert to plain object

      // If hard toggled OFF manually, stay OFF
      if (!itemObj.inStock) return itemObj;

      // Check Recipe Limits
      if (itemObj.Ingredients && itemObj.Ingredients.length > 0) {
        let maxPossible = Infinity;

        for (const ingredient of itemObj.Ingredients) {
          const quantityRequired = ingredient.RecipeItem ? ingredient.RecipeItem.quantityRequired : 0;
          if (quantityRequired > 0) {
            const possible = Math.floor(ingredient.currentStock / quantityRequired);
            if (possible < maxPossible) maxPossible = possible;
          }
        }

        if (maxPossible <= 0 && maxPossible !== Infinity) {
          itemObj.inStock = false; // Override for response
          itemObj.stockReason = 'Ingredient out of stock';
        }
      }
      // Fallback: If no ingredients, rely on 'quantity' field
      else {
        if (itemObj.quantity <= 0) itemObj.inStock = false;
      }
      return itemObj;
    });

    res.json(menuWithStock);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addMenuItem = async (req, res) => {
  const { name, description, price, category, imageUrl, cost } = req.body;

  try {
    if (!name || !price || !category) {
      return res.status(400).json({ message: 'Name, price, and category are required' });
    }
    const newItem = await Menu.create({ name, description, price, category, imageUrl, cost });
    // Note: Recipe association is not handled here as it wasn't in original code

    res.status(201).json(newItem);
  } catch (err) {
    console.error('Error adding menu item:', err);
    res.status(400).json({ message: err.message });
  }
};

exports.updateMenuItem = async (req, res) => {
  const { name, description, price, category, imageUrl, cost } = req.body;

  try {
    if (!name || !price || !category) {
      return res.status(400).json({ message: 'Name, price, and category are required' });
    }

    const [updated] = await Menu.update(
      { name, description, price, category, imageUrl, cost },
      { where: { id: req.params.id } }
    );

    if (!updated) return res.status(404).json({ message: 'Menu item not found' });

    const updatedItem = await Menu.findByPk(req.params.id);
    res.json(updatedItem);
  } catch (err) {
    console.error('Error updating menu item:', err);
    res.status(400).json({ message: err.message });
  }
};

exports.deleteMenuItem = async (req, res) => {
  try {
    const deleted = await Menu.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ message: 'Menu item not found' });
    res.json({ message: 'Menu item deleted' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }

};

exports.toggleStockController = async (req, res) => {
  try {
    const item = await Menu.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    item.inStock = !item.inStock;
    await item.save();

    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProfitAnalysis = async (req, res) => {
  try {
    const menuItems = await Menu.findAll({
      include: [{
        model: Ingredient,
        through: { attributes: ['quantityRequired'] }
      }]
    });

    const report = menuItems.map(item => {
      let totalCost = 0;
      const itemObj = item.toJSON();

      // Calculate total cost from ingredients
      if (itemObj.cost && itemObj.cost > 0) {
        totalCost = itemObj.cost; // Manual override
      } else if (itemObj.Ingredients && itemObj.Ingredients.length > 0) {
        itemObj.Ingredients.forEach(ing => {
          const qtyReq = ing.RecipeItem ? ing.RecipeItem.quantityRequired : 0;
          totalCost += (ing.costPerUnit || 0) * qtyReq;
        });
      }

      // If cost is 0, margin is 100%
      const profit = itemObj.price - totalCost;
      const margin = itemObj.price > 0 ? ((profit / itemObj.price) * 100).toFixed(1) : 0;

      return {
        _id: itemObj.id, // Keeping _id for frontend compatibility if needed, but logic uses id
        id: itemObj.id,
        name: itemObj.name,
        category: itemObj.category,
        price: itemObj.price,
        cost: parseFloat(totalCost.toFixed(2)),
        profit: parseFloat(profit.toFixed(2)),
        margin: parseFloat(margin)
      };
    });

    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};