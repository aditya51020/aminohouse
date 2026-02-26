const mongoose = require('mongoose');
const User = require('../models/userModel');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await User.find({});
        console.log('--- USER LIST ---');
        users.forEach(u => {
            console.log(`ID: ${u._id} | User: ${u.username} | Role: '${u.role}'`);
        });

        // Specific check for duplicates
        const rahuls = await User.find({ username: 'rahul' });
        console.log(`Found ${rahuls.length} users named 'rahul'`);
        rahuls.forEach(r => console.log(`Rahul ID: ${r._id} | Role: ${r.role}`));

        console.log('-----------------');
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};
check();
