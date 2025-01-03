const { createProduct, getProductById, updateProduct, deleteProduct, getAllProducts, searchProducts } = require('../models/productModel');
const AWS = require('aws-sdk');
const multer = require('multer');

// Set up AWS S3
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

// Image upload function to AWS S3
const uploadImage = async (file) => {
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `${Date.now()}_${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
    };
    const uploadResult = await s3.upload(params).promise();
    return uploadResult.Location;
};

// Middleware to check ownership of the product
const checkOwnership = async (productId, sellerId) => {
    const product = await getProductById(productId);
    if (!product || product.seller_id !== sellerId) {
        throw new Error('Unauthorized: Seller does not own this product');
    }
};

// Controller to create a new product (including image upload)
const createNewProduct = async (req, res) => {
    try {
        const { sellerId, title, description, price, category, images } = req.body;

        let imageUrls = [];
        if (req.files && req.files.length > 0) {
            for (let i = 0; i < req.files.length; i++) {
                const imageUrl = await uploadImage(req.files[i]);
                imageUrls.push(imageUrl);
            }
        }

        const newProduct = await createProduct(sellerId, title, description, price, category, imageUrls.length > 0 ? imageUrls : images);
        res.status(201).json({ message: 'Product created successfully', product: newProduct });
    } catch (error) {
        res.status(500).json({ error: error.message || 'Error creating product' });
    }
};

// Controller to update an existing product (including image update)
const updateExistingProduct = async (req, res) => {
    try {
        const { sellerId, title, description, price, category, images } = req.body;
        const productId = req.params.id;

        // Check ownership
        await checkOwnership(productId, sellerId);

        let imageUrls = [];
        if (req.files && req.files.length > 0) {
            for (let i = 0; i < req.files.length; i++) {
                const imageUrl = await uploadImage(req.files[i]);
                imageUrls.push(imageUrl);
            }
        }

        const updatedProduct = await updateProduct(productId, title, description, price, category, imageUrls.length > 0 ? imageUrls : images);
        res.status(200).json({ message: 'Product updated successfully', product: updatedProduct });
    } catch (error) {
        res.status(500).json({ error: error.message || 'Error updating product' });
    }
};

// Controller to get a product by ID
const getProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await getProductById(productId);
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.status(200).json({ product });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching product' });
    }
};

// Controller to delete a product
const deleteExistingProduct = async (req, res) => {
    try {
        const { sellerId } = req.body;
        const productId = req.params.id;

        // Check ownership
        await checkOwnership(productId, sellerId);

        const deletedProduct = await deleteProduct(productId);
        if (!deletedProduct) return res.status(404).json({ error: 'Product not found' });
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message || 'Error deleting product' });
    }
};

// Controller to get all products
const getAllProductsList = async (req, res) => {
    try {
        const products = await getAllProducts();
        res.status(200).json({ products });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching products' });
    }
};

// Controller to search products
const searchProductsList = async (req, res) => {
    try {
        const { keyword, category, minPrice, maxPrice } = req.query;
        const products = await searchProducts(keyword, category, minPrice, maxPrice);
        res.status(200).json({ products });
    } catch (error) {
        res.status(500).json({ error: 'Error searching products' });
    }
};

module.exports = { createNewProduct, getProduct, updateExistingProduct, deleteExistingProduct, getAllProductsList, searchProductsList };
