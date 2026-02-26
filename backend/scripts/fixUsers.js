const mongoose = require('mongoose');
const User = require('../models/userModel');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const fix = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Fixing roles...');

        // Force Rahul to Kitchen
        await User.findOneAndUpdate({ username: 'rahul' }, { role: 'kitchen' }, { upsert: true });
        console.log('Forced rahul -> kitchen');

        // Force Admin to Admin
        await User.findOneAndUpdate({ username: 'admin' }, { role: 'admin' }, { upsert: true }); // Careful if admin has different username, but assuming 'admin' exists or we create.

        // Ensure all others have 'cashier' if missing
        const users = await User.find({});
        for (const u of users) {
            if (!u.role) {
                u.role = 'cashier';
                await u.save();
                console.log(`Set ${u.username} to cashier`);
            }
        }

        console.log('Done');
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};
fix();
