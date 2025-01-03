const express = require('express');
const router = express.Router();
const { createNewProduct, getProduct, updateExistingProduct, deleteExistingProduct, getAllProductsList, searchProductsList } = require('../controllers/productController');

// Routes for product CRUD operations
router.post('/products', createNewProduct);  // Create a new product
router.get('/products/:id', getProduct);     // Get a product by ID
router.put('/products/:id', updateExistingProduct); // Update an existing product
router.delete('/products/:id', deleteExistingProduct); // Delete a product
router.get('/products', getAllProductsList); // Get all products
router.get('/products/search', searchProductsList); // Search products

module.exports = router;
