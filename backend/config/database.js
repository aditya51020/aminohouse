const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const sequelize = process.env.DATABASE_URL
    ? (() => {
        console.log('Connecting via DATABASE_URL...');
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
        console.log('Connecting via individual DB parameters...');
        console.log(`DB_HOST: ${process.env.DB_HOST || 'localhost'}`);
        console.log(`DB_USER: ${process.env.DB_USER || 'postgres'}`);
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
                },
                pool: {
                    max: 5,
                    min: 0,
                    acquire: 30000,
                    idle: 10000
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
