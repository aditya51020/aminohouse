const User = require('../models/userModel');
const bcrypt = require('bcryptjs');

const seedDefaultAdmin = async () => {
    try {
        const admins = [
            { username: 'admin1', password: 'admin123' },
            { username: 'admin', password: 'admin123' },
            { username: 'admni1', password: 'admin123' }
        ];

        for (const account of admins) {
            const hashedPassword = await bcrypt.hash(account.password, 10);
            const existing = await User.findOne({ username: account.username });
            if (!existing) {
                await User.create({
                    username: account.username,
                    password: hashedPassword,
                    role: 'admin'
                });
                console.log(`✅ Default admin created: ${account.username} / ${account.password}`);
            } else {
                // Force update password to ensure it's hashed correctly and exists
                existing.password = hashedPassword;
                existing.role = 'admin';
                await existing.save();
                console.log(`ℹ️ Admin user updated/verified: ${account.username}`);
            }
        }
    } catch (err) {
        console.error('❌ Error seeding default admin:', err.message);
    }
};

module.exports = { seedDefaultAdmin };
