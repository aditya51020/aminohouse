const User = require('../models/userModel');
const bcrypt = require('bcryptjs');

const seedDefaultAdmin = async () => {
    try {
        const admins = [
            { username: 'admin', password: 'admin123' },
            { username: 'admni1', password: 'admin123' }
        ];

        for (const account of admins) {
            const existing = await User.findOne({ where: { username: account.username } });
            if (!existing) {
                const hashedPassword = await bcrypt.hash(account.password, 10);
                await User.create({
                    username: account.username,
                    password: hashedPassword,
                    role: 'admin'
                });
                console.log(`✅ Default admin created: ${account.username} / ${account.password}`);
            } else {
                console.log(`ℹ️ Admin user already exists: ${account.username}`);
            }
        }
    } catch (err) {
        console.error('❌ Error seeding default admin:', err.message);
    }
};

module.exports = { seedDefaultAdmin };
