const mongoose = require('mongoose');
const path = require('path');
const Ingredient = require(path.join(__dirname, '../backend/models/ingredientModel'));
const Menu = require(path.join(__dirname, '../backend/models/menuModel'));
const Order = require(path.join(__dirname, '../backend/models/orderModel'));
const Customer = require(path.join(__dirname, '../backend/models/customerModel'));
const dotenv = require('dotenv');
const { createOrder } = require(path.join(__dirname, '../backend/controllers/orderController'));

// Mock Req/Res
const mockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.data = data;
        return res;
    };
    return res;
};

const runTest = async () => {
    dotenv.config({ path: './backend/.env' });

    // Connect to DB (Make sure your local DB is running)
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cafe_db');
    console.log("Connected to DB");

    try {
        // 1. Cleanup old test data
        await Ingredient.deleteMany({ name: 'TestFlour' });
        await Menu.deleteMany({ name: 'TestBread' });

        // 2. Create Ingredient
        const flour = new Ingredient({
            name: 'TestFlour',
            currentStock: 1000,
            unit: 'g'
        });
        await flour.save();
        console.log("Created Ingredient: TestFlour (1000g)");

        // 3. Create Menu Item with Recipe
        const bread = new Menu({
            name: 'TestBread',
            price: 50,
            category: 'Test',
            recipe: [{ ingredient: flour._id, quantityRequired: 500 }]
        });
        await bread.save();
        console.log("Created Menu Item: TestBread (Requires 500g TestFlour)");

        // 4. Create Mock Customer
        let customer = await Customer.findOne({ phone: '9999999999' });
        if (!customer) {
            customer = new Customer({ phone: '9999999999' });
            await customer.save();
        }

        // 5. Place Successful Order (1 Bread)
        console.log("\nAttempting Order 1 (1 Bread)...");
        const req1 = {
            body: {
                phone: '9999999999',
                items: [{ menuItem: bread._id, quantity: 1 }],
                totalAmount: 50,
                paymentMethod: 'cash'
            }
        };
        const res1 = mockRes();
        await createOrder(req1, res1);

        if (res1.statusCode === 201) {
            console.log("✅ Order 1 Success!");
        } else {
            console.error("❌ Order 1 Failed:", res1.data);
        }

        // 6. Verify Stock
        const updatedFlour = await Ingredient.findById(flour._id);
        console.log(`Current Flour Stock: ${updatedFlour.currentStock}g (Expected: 500g)`);

        // 7. Place Failed Order (2 Breads - Need 1000g, Have 500g)
        console.log("\nAttempting Order 2 (2 Breads)...");
        const req2 = {
            body: {
                phone: '9999999999',
                items: [{ menuItem: bread._id, quantity: 2 }],
                totalAmount: 100,
                paymentMethod: 'cash'
            }
        };
        const res2 = mockRes();
        await createOrder(req2, res2);

        if (res2.statusCode === 400 && res2.data.message.includes('Insufficient')) {
            console.log("✅ Order 2 Correcly Failed: " + res2.data.message);
        } else {
            console.error("❌ Order 2 Unexpected Result:", res2.statusCode, res2.data);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.connection.close();
    }
};

runTest();
