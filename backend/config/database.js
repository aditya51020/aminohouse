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
        try {
            const dbUrl = rawUrl.trim();
            console.log('✅ DATABASE_URL detected. Parsing connection parameters...');

            // Native URL parsing is more robust for complex passwords/usernames
            const parsed = new URL(dbUrl);
            const dbName = parsed.pathname.split('/')[1];
            const dbUser = decodeURIComponent(parsed.username);
            const dbPass = decodeURIComponent(parsed.password);
            const dbHost = parsed.hostname;
            const dbPort = parsed.port || 5432;

            console.log(`Connection Params: Host=${dbHost}, User=${dbUser}, DB=${dbName}, Port=${dbPort}`);

            return new Sequelize(dbName, dbUser, dbPass, {
                host: dbHost,
                port: dbPort,
                dialect: 'postgres',
                logging: false,
                dialectOptions: {
                    ssl: {
                        require: true,
                        rejectUnauthorized: false
                    }
                },
                pool: {
                    max: 5,
                    min: 0,
                    acquire: 30000,
                    idle: 10000
                }
            });
        } catch (err) {
            console.error('❌ Failed to parse DATABASE_URL:', err.message);
            // Fallback to direct string if URL parsing fails
            return new Sequelize(rawUrl, {
                dialect: 'postgres',
                dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
            });
        }
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
