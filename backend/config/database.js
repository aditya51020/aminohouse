const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production' || !!process.env.DATABASE_URL;

// Debug: Log available keys to verify Render environment injection
console.log('--- Environment Check ---');
console.log('Available Env Keys:', Object.keys(process.env).filter(k => k.includes('DB') || k.includes('URL') || k.includes('PORT') || k.includes('SECRET')));
console.log('--- --- --- --- --- ---');

const sequelize = (() => {
    const rawUrl = process.env.DATABASE_URL || process.env.DB_URL;

    if (rawUrl) {
        const dbUrl = rawUrl.trim();
        console.log('✅ Database URL detected. Connecting to Remote DB...');
        // Mask password in logs
        const masked = dbUrl.replace(/:([^@/]+)@/, ':****@');
        console.log(`Connection string (masked): ${masked}`);

        return new Sequelize(dbUrl, {
            dialect: 'postgres',
            logging: false,
            dialectOptions: {
                ssl: {
                    require: true,
                    rejectUnauthorized: false
                }
            }
        });
    }

    console.warn('⚠️ No Database URL found! Falling back to individual parameters.');
    const host = process.env.DB_HOST || 'localhost';
    const user = process.env.DB_USER || 'postgres';
    console.log(`Attempting connection to Host: ${host} as User: ${user}`);

    return new Sequelize(
        process.env.DB_NAME || 'cafe_db',
        process.env.DB_USER || 'postgres',
        process.env.DB_PASS || 'postgres',
        {
            host: host,
            port: process.env.DB_PORT || 5432,
            dialect: 'postgres',
            logging: false,
            dialectOptions: {
                ssl: process.env.DB_SSL === 'true' ? {
                    require: true,
                    rejectUnauthorized: false
                } : false
            }
        }
    );
})();

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('PostgreSQL Connected via Sequelize');
        // Sync models - using alter: true to update tables without dropping them
        // In production, use migrations instead of sync
        await sequelize.sync({ alter: true });
        console.log('Models Synced');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};

module.exports = { sequelize, connectDB };
