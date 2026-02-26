const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production' || !!process.env.DATABASE_URL;

// Debug: Log available keys to verify Render environment injection
console.log('--- Environment Check ---');
console.log('Available Env Keys:', Object.keys(process.env).filter(k => k.includes('DB') || k.includes('URL') || k.includes('PORT') || k.includes('SECRET')));
console.log('--- --- --- --- --- ---');

const sequelize = process.env.DATABASE_URL
    ? (() => {
        console.log('✅ DATABASE_URL detected. Connecting to Supabase...');
        return new Sequelize(process.env.DATABASE_URL, {
            dialect: 'postgres',
            logging: false,
            dialectOptions: {
                ssl: {
                    require: true,
                    rejectUnauthorized: false
                }
            }
        });
    })()
    : (() => {
        console.warn('⚠️ DATABASE_URL NOT FOUND!');
        const host = process.env.DB_HOST;
        const user = process.env.DB_USER;

        if (!host || !user) {
            console.error('❌ CRITICAL: No database configuration found. Please set DATABASE_URL in Render settings.');
        }

        console.log(`Attempting connection to Host: ${host || 'localhost'} as User: ${user || 'postgres'}`);

        return new Sequelize(
            process.env.DB_NAME || 'cafe_db',
            process.env.DB_USER || 'postgres',
            process.env.DB_PASS || 'postgres',
            {
                host: process.env.DB_HOST || 'localhost',
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
