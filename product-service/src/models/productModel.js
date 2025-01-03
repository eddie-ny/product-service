const { Pool } = require('pg');
const AWS = require('aws-sdk');
const { Client } = require('@elastic/elasticsearch');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const esClient = new Client({
    node: process.env.ELASTICSEARCH_URL,  // Add your Elasticsearch URL
});

// Create a new product and add to Elasticsearch for faster search
const createProduct = async (sellerId, title, description, price, category, images) => {
    const query = `
        INSERT INTO products (seller_id, title, description, price, category, images)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
    const values = [sellerId, title, description, price, category, images];
    const result = await pool.query(query, values);
    const product = result.rows[0];

    // Index product in Elasticsearch
    await esClient.index({
        index: 'products',
        id: product.id.toString(),
        body: {
            title: product.title,
            description: product.description,
            price: product.price,
            category: product.category,
            images: product.images,
        },
    });

    return product;
};

// Get a product by ID
const getProductById = async (productId) => {
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [productId]);
    return result.rows[0];
};

// Update an existing product and update in Elasticsearch
const updateProduct = async (productId, title, description, price, category, images) => {
    const query = `
        UPDATE products
        SET title = $1, description = $2, price = $3, category = $4, images = $5, updated_at = CURRENT_TIMESTAMP
        WHERE id = $6 RETURNING *`;
    const values = [title, description, price, category, images, productId];
    const result = await pool.query(query, values);
    const updatedProduct = result.rows[0];

    // Update product in Elasticsearch
    await esClient.index({
        index: 'products',
        id: updatedProduct.id.toString(),
        body: {
            title: updatedProduct.title,
            description: updatedProduct.description,
            price: updatedProduct.price,
            category: updatedProduct.category,
            images: updatedProduct.images,
        },
    });

    return updatedProduct;
};

// Delete a product and remove from Elasticsearch
const deleteProduct = async (productId) => {
    const query = 'DELETE FROM products WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [productId]);
    const deletedProduct = result.rows[0];

    // Delete product from Elasticsearch
    await esClient.delete({
        index: 'products',
        id: deletedProduct.id.toString(),
    });

    return deletedProduct;
};

// Get all products
const getAllProducts = async () => {
    const result = await pool.query('SELECT * FROM products');
    return result.rows;
};

// Search products in Elasticsearch
const searchProducts = async (keyword, category, minPrice, maxPrice) => {
    const filters = [];

    if (keyword) {
        filters.push({
            multi_match: {
                query: keyword,
                fields: ['title', 'description'],
                operator: 'and',
            },
        });
    }

    if (category) {
        filters.push({
            term: { category },
        });
    }

    if (minPrice && maxPrice) {
        filters.push({
            range: {
                price: { gte: minPrice, lte: maxPrice },
            },
        });
    }

    const { body } = await esClient.search({
        index: 'products',
        body: {
            query: {
                bool: {
                    must: filters,
                },
            },
        },
    });

    return body.hits.hits.map(hit => hit._source);
};

module.exports = { createProduct, getProductById, updateProduct, deleteProduct, getAllProducts, searchProducts };
