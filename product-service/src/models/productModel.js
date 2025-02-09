const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres', // replace with your database username
    host: 'localhost', // replace with your database host
    database: 'multi_vendor_platform', // replace with your database name
    password: 'edward', // replace with your database password
    port: 5432, // default PostgreSQL port
});

// Create a new product
const createProduct = async (sellerId, title, description, price, category, images, stock_quantity) => {
    console.log("model create")
    try {
        const query = `
            INSERT INTO products (seller_id, title, description, price, category, images, stock_quantity)
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
        const values = [sellerId, title, description, price, category, images, stock_quantity];
        console.log('Executing query:', query);
        console.log('with values:', values);
        const result = await pool.query(query, values);
        console.log('Query result:', result);
        return result.rows[0];
    } catch (error) {
        console.error('Error in createProduct model:', error);
        throw error; // Re-throw to be handled in the controller
    }
};

// Get a product by ID
const getProductById = async (productId) => {
    try {
        const result = await pool.query('SELECT * FROM products WHERE product_id = $1', [productId]);
        return result.rows[0];
    } catch (error) {
        console.error('Error in getProductById model:', error);
        throw error;
    }
};

// Update an existing product
const updateProduct = async (productId, title, description, price, category, images, stock_quantity) => {
    try {
        const query = `
            UPDATE products
            SET title = $1, description = $2, price = $3, category = $4, images = $5, stock_quantity = $6, updated_at = CURRENT_TIMESTAMP
            WHERE product_id = $7 RETURNING *`;
        const values = [title, description, price, category, images, stock_quantity, productId];
        const result = await pool.query(query, values);
        return result.rows[0];
    } catch (error) {
        console.error('Error in updateProduct model:', error);
        throw error;
    }
};

// Delete a product
const deleteProduct = async (productId) => {
    try {
        const query = 'DELETE FROM products WHERE product_id = $1 RETURNING *';
        const result = await pool.query(query, [productId]);
        return result.rows[0];
    } catch (error) {
        console.error('Error in deleteProduct model:', error);
        throw error;
    }
};

// Get all products
const getAllProducts = async () => {
    try {
        const result = await pool.query('SELECT * FROM products');
        return result.rows;
    } catch (error) {
        console.error('Error in getAllProducts model:', error);
        throw error;
    }
};

// Search products
const searchProducts = async (keyword, category, minPrice, maxPrice) => {
    try {
        let query = 'SELECT * FROM products WHERE 1=1';  // Start with a query that always returns true

        const values = [];
        let valueIndex = 1;

        if (keyword) {
            query += ` AND (title LIKE $${valueIndex} OR description LIKE $${valueIndex})`;
            values.push(`%${keyword}%`);
            valueIndex++;
        }

        if (category) {
            query += ` AND category = $${valueIndex}`;
            values.push(category);
            valueIndex++;
        }

        if (minPrice) {
            query += ` AND price >= $${valueIndex}`;
            values.push(minPrice);
            valueIndex++;
        }

        if (maxPrice) {
            query += ` AND price <= $${valueIndex}`;
            values.push(maxPrice);
            valueIndex++;
        }

        const result = await pool.query(query, values);
        return result.rows;
    } catch (error) {
        console.error('Error in searchProducts model:', error);
        throw error;
    }
};

module.exports = { createProduct, getProductById, updateProduct, deleteProduct, getAllProducts, searchProducts };