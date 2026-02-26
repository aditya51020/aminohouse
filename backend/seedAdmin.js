const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const { sequelize } = require('./config/database');
const User = require('./models/userModel');

const seedAdmin = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync({ alter: true });

        const existingAdmin = await User.findOne({ where: { username: 'admin' } });

        if (!existingAdmin) {
            console.log('Creating default admin...');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await User.create({
                username: 'admin',
                password: hashedPassword,
                role: 'admin'
            });
            console.log('✅ Admin user created: admin / admin123');
        } else {
            console.log('✅ Admin already exists.');
        }
        process.exit();
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
};

seedAdmin();
