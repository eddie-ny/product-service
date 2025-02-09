// db.js

const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config({ path: '../../.env' }); // Adjust path as needed

const PG_USER = String(process.env.PG_USER || '');
const PG_PASSWORD = String(process.env.PG_PASSWORD || '');
const PG_HOST = String(process.env.PG_HOST || 'localhost');
const PG_DATABASE = String(process.env.PG_DATABASE || '');
const PG_PORT = parseInt(process.env.PG_PORT) || 5432;

const pool = new Pool({
  user: PG_USER,
  host: PG_HOST,
  database: PG_DATABASE,
  password: PG_PASSWORD,
  port: PG_PORT,
  max: 20, // Maximum number of connections in the pool
});

const connectDB = async () => {
    console.log("Starting DB connection...");
    try {
        await pool.connect();
        console.log('Connected to PostgreSQL database (using pool)');
    } catch (err) {
        console.error('Database connection error:', err.message);
        throw err; // Re-throw the error to be handled by the caller
    }
};

const queryDB = async (text, params) => {
    try {
        const client = await pool.connect();
        const result = await client.query(text, params);
        client.release();
        return result;
    } catch (err) {
        console.error('Error executing query:', err.message);
        throw err;
    }
};

module.exports = { connectDB, queryDB, pool }; // Export the pool, connectDB and queryDB