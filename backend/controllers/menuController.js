const Menu = require('../models/menuModel');
const Ingredient = require('../models/ingredientModel');

exports.getMenu = async (req, res) => {
  try {
    const menu = await Menu.find({}).populate('recipe.ingredient');

    // Dynamic Stock Calculation
    const menuWithStock = menu.map(item => {
      const itemObj = item.toObject({ virtuals: true }); // keep virtual id

      if (!itemObj.inStock) return itemObj;

      // Check Recipe Limits
      if (itemObj.recipe && itemObj.recipe.length > 0) {
        let maxPossible = Infinity;

        for (const recipeItem of itemObj.recipe) {
          const ingredient = recipeItem.ingredient;
          const quantityRequired = recipeItem.quantityRequired;

          if (ingredient && quantityRequired > 0) {
            const possible = Math.floor(ingredient.currentStock / quantityRequired);
            if (possible < maxPossible) maxPossible = possible;
          }
        }

        if (maxPossible <= 0 && maxPossible !== Infinity) {
          itemObj.inStock = false;
          itemObj.stockReason = 'Ingredient out of stock';
        }
      } else {
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
    res.status(201).json(newItem);
  } catch (err) {
    console.error('Error adding menu item:', err);
    res.status(400).json({ message: err.message });
  }
};

exports.updateMenuItem = async (req, res) => {
  try {
    const { name, price, category } = req.body;
    if (!name || !price || !category) {
      return res.status(400).json({ message: 'Name, price, and category are required' });
    }

    const updatedItem = await Menu.findByIdAndUpdate(
      req.params.id,
      { $set: req.body }, // update ALL fields sent, not just a fixed subset
      { new: true, runValidators: true }
    );

    if (!updatedItem) return res.status(404).json({ message: 'Menu item not found' });
    res.json(updatedItem);
  } catch (err) {
    console.error('Error updating menu item:', err);
    res.status(400).json({ message: err.message });
  }
};

exports.deleteMenuItem = async (req, res) => {
  try {
    const deleted = await Menu.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Menu item not found' });
    res.json({ message: 'Menu item deleted' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.toggleStockController = async (req, res) => {
  try {
    const item = await Menu.findById(req.params.id);
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
    const menuItems = await Menu.find({}).populate('recipe.ingredient');

    const report = menuItems.map(item => {
      let totalCost = 0;
      const itemObj = item.toObject();

      if (itemObj.cost && itemObj.cost > 0) {
        totalCost = itemObj.cost;
      } else if (itemObj.recipe && itemObj.recipe.length > 0) {
        itemObj.recipe.forEach(ri => {
          const ing = ri.ingredient;
          const qtyReq = ri.quantityRequired;
          if (ing && qtyReq) {
            totalCost += (ing.costPerUnit || 0) * qtyReq;
          }
        });
      }

      const profit = itemObj.price - totalCost;
      const margin = itemObj.price > 0 ? ((profit / itemObj.price) * 100).toFixed(1) : 0;

      return {
        _id: itemObj._id,
        id: itemObj._id,
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
