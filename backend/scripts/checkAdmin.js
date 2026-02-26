const mongoose = require('mongoose');
const User = require('../models/userModel');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const admins = await User.find({ username: 'admin' });
        console.log(`Found ${admins.length} users with username 'admin'`);
        admins.forEach(a => console.log(`ID: ${a._id} | Role: ${a.role}`));
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};
check();
