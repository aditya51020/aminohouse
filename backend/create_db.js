const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

console.log('Script started...');
console.log(`Connecting with User: ${process.env.DB_USER || 'postgres'}, Host: ${process.env.DB_HOST || 'localhost'}`);

const client = new Client({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'postgres' // Connect to default db
});

async function create() {
    try {
        console.log('Connecting to postgres...');
        await client.connect();
        console.log('Connected to postgres.');

        const dbName = process.env.DB_NAME || 'cafe_db';
        console.log(`Checking database: ${dbName}`);

        const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${dbName}'`);
        if (res.rowCount === 0) {
            console.log(`Creating database ${dbName}...`);
            await client.query(`CREATE DATABASE "${dbName}"`);
            console.log(`Database ${dbName} created successfully.`);
        } else {
            console.log(`Database ${dbName} already exists.`);
        }
    } catch (err) {
        console.error('Error creating database:', err.message);
        if (err.cause) console.error('Cause:', err.cause);
    } finally {
        console.log('Closing connection...');
        await client.end();
        console.log('Done.');
    }
}

create();
