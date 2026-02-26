const mongoose = require('mongoose');
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const hardFix = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected. resetting rahul...');

        // Delete ALL rahuls
        await User.deleteMany({ username: 'rahul' });
        console.log('Deleted all rahuls.');

        // Create new rahul
        const hashed = await bcrypt.hash('rahul123', 10);
        const newRahul = new User({
            username: 'rahul',
            password: hashed,
            role: 'kitchen'
        });
        await newRahul.save();
        console.log('Created new rahul with role: kitchen');

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};
hardFix();
