const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Ingredient = require('./models/ingredientModel');
const Menu = require('./models/menuModel');
const Customer = require('./models/customerModel');
const Order = require('./models/orderModel');
const InventoryLog = require('./models/inventoryLogModel');

dotenv.config();

async function run() {
    try {
        if (!process.env.MONGO_URI) {
            console.error("MONGO_URI is missing in .env");
            process.exit(1);
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        // 1. Create Test Ingredient
        const flour = new Ingredient({
            name: 'TestFlour_' + Date.now(),
            unit: 'g',
            currentStock: 1000,
            costPerUnit: 0.1,
            lowStockThreshold: 100
        });
        await flour.save();
        console.log(`Created Ingredient: ${flour.name}, Stock: ${flour.currentStock}`);

        // 2. Create Test Menu Item with Recipe
        const bread = new Menu({
            name: 'TestBread_' + Date.now(),
            price: 50,
            category: 'Test',
            quantity: 100, // Item stock
            recipe: [{ ingredient: flour._id, quantityRequired: 100 }] // Uses 100g flour per item
        });
        await bread.save();
        console.log(`Created Menu Item: ${bread.name}`);

        // 3. Mock Request for Order
        const req = {
            body: {
                items: [{ menuItem: bread._id, quantity: 2 }], // Order 2 breads = 200g flour deduction
                totalAmount: 100,
                paymentMethod: 'cod',
                phone: '9999999999'
            },
            user: { role: 'customer' }
        };

        const res = {
            status: function (code) {
                this.statusCode = code;
                return this;
            },
            json: function (data) {
                this.data = data;
                // console.log(`Response ${this.statusCode}:`, data);
            }
        };

        // 4. Call createOrder directly
        console.log("Placing Order...");
        await require('./controllers/orderController').createOrder(req, res);

        if (res.statusCode && res.statusCode !== 201) {
            console.error("Order Creation Failed:", res.data);
        } else {
            console.log("Order Created Successfully");

            // 5. Verify Ingredient Stock
            const updatedFlour = await Ingredient.findById(flour._id);
            console.log(`Updated Ingredient Stock: ${updatedFlour.currentStock}`);

            if (updatedFlour.currentStock === 800) {
                console.log("SUCCESS: Ingredient inventory deducted correctly (1000 - 200 = 800)");
            } else {
                console.log(`FAILURE: Expected 800, got ${updatedFlour.currentStock}`);
            }

            // 6. Verify Menu Item Stock
            const updatedBread = await Menu.findById(bread._id);
            // Note: In CreateOrder, if there is a recipe, it does NOT deduct menu item quantity?
            // Let's check logic:
            // "if (menuItem.recipe && menuItem.recipe.length > 0) ... else { menuItem.quantity -= item.quantity }"
            // So if recipe exists, it manages INGREDIENTS, but does not seem to decrement the cooked item limit?
            // That's a potential logic gap depending on business rules. 
            // Usually you track raw materials OR you track pre-made items.
            // If it's made to order, you don't track item quantity usually, OR you have infinite item quantity limited by ingredients.
            console.log(`Menu Item Quantity: ${updatedBread.quantity} (Should satisfy logic)`);
        }

        // Cleanup
        console.log("Cleaning up...");
        await Ingredient.findByIdAndDelete(flour._id);
        await Menu.findByIdAndDelete(bread._id);
        if (req.body.phone) {
            await Customer.findOneAndDelete({ phone: req.body.phone });
        }
        // Cleanup order
        if (res.data && res.data._id) {
            await Order.findByIdAndDelete(res.data._id);
            await InventoryLog.findOneAndDelete({ orderId: res.data._id });
        }

    } catch (e) {
        console.error("Test Error:", e);
    } finally {
        await mongoose.disconnect();
    }
}

run();
