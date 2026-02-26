const User = require('../models/userModel');
const bcrypt = require('bcryptjs');

const seedDefaultAdmin = async () => {
    try {
        const username = 'admni1';
        const password = 'admin123';

        const existing = await User.findOne({ where: { username } });
        if (!existing) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await User.create({
                username,
                password: hashedPassword,
                role: 'admin'
            });
            console.log(`✅ Default admin created: ${username} / ${password}`);
        } else {
            console.log(`ℹ️ Admin user already exists: ${username}`);
        }
    } catch (err) {
        console.error('❌ Error seeding default admin:', err.message);
    }
};

module.exports = { seedDefaultAdmin };
