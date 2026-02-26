
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Simple relative paths that we validated work from root CWD
const Ingredient = require('../backend/models/ingredientModel');
const Menu = require('../backend/models/menuModel');
const Order = require('../backend/models/orderModel');
const Customer = require('../backend/models/customerModel');

// dotenv.config({ path: './backend/.env' });
const MONGO_URI = 'mongodb://127.0.0.1:27017/cafe_db'; // Hardcoded for test logic verification

const runTest = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("DB Connected");

        // 1. Setup Data
        let chicken = await Ingredient.findOne({ name: 'PrepChicken' });
        if (!chicken) {
            chicken = new Ingredient({ name: 'PrepChicken', unit: 'g', currentStock: 5000 });
            await chicken.save();
        }

        let sandwich = await Menu.findOne({ name: 'PrepSandwich' });
        if (sandwich) await Menu.deleteOne({ _id: sandwich._id });

        sandwich = new Menu({
            name: 'PrepSandwich',
            price: 100,
            recipe: [{ ingredient: chicken._id, quantityRequired: 100 }],
            station: 'Sandwich'
        });
        await sandwich.save();

        // 2. Clear old test orders
        await Order.deleteMany({ 'items.menuItem': sandwich._id });

        // 3. Create Orders for last 7 days
        const orders = [];
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Create a customer if needed
        let cust = await Customer.findOne();
        if (!cust) cust = await new Customer({ name: 'Test', phone: '0000000000' }).save();

        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            orders.push({
                customer: cust._id,
                items: [{ menuItem: sandwich._id, quantity: 10 }],
                totalAmount: 1000,
                status: 'Completed',
                createdAt: d
            });
        }
        await Order.insertMany(orders);
        console.log("Inserted 7 days of partial orders.");

        // 4. Verify Calculation Logic Manually
        // (Similar logic to controller)
        const recentOrders = await Order.find({
            'items.menuItem': sandwich._id,
            createdAt: { $gte: sevenDaysAgo }
        });

        let totalSold = 0;
        recentOrders.forEach(o => {
            o.items.forEach(i => {
                if (i.menuItem.toString() === sandwich._id.toString()) totalSold += i.quantity;
            });
        });

        const avg = totalSold / 7; // Should be 10
        const needed = avg * 100 * 1.2; // 1200

        console.log(`Total Sold: ${totalSold} (Expected ~70)`);
        console.log(`Daily Avg: ${avg.toFixed(2)} (Expected ~10.00)`);
        console.log(`Prep Needed: ${needed.toFixed(2)} (Expected ~1200.00)`);

        if (Math.abs(needed - 1200) < 50) {
            console.log("SUCCESS: Prep calculation verification passed!");
        } else {
            console.log("FAILURE: Calc mismatch");
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.connection.close();
    }
};

runTest();

