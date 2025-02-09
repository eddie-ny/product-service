const { createProduct, getProductById, updateProduct, deleteProduct, getAllProducts, searchProducts } = require('../models/productModel');
const AWS = require('aws-sdk');
const multer = require('multer');
const validator = require('validator'); // Import validator

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
    try {
        const product = await getProductById(productId);
        if (!product || product.seller_id !== sellerId) {
            throw new Error('Unauthorized: Seller does not own this product');
        }
    } catch (error) {
        console.error('Error checking ownership:', error);
        throw error;
    }
};

// Function to validate a URL
function isValidImageUrl(url) {
    return validator.isURL(url, { require_protocol: true }); // Enforce https or http
}

// Controller to create a new product (including image upload)
const createNewProduct = async (req, res) => {
    console.log('Creating new product...');
    try {
        // Remove sellerId from destructuring
        const { title, description, price, category, images, stock_quantity } = req.body;
        // Get sellerId from req.user (or wherever your auth middleware puts it)
        const sellerId = req.user.user_id; // Assuming the userId is stored in req.user.user_id (check your database column name)
        console.log('Request body:', req.body);

        // Remove sellerId from required fields check
        if (!title || price === undefined || stock_quantity === undefined) {
            console.log('Missing required fields');
            return res.status(400).json({ error: 'Missing required fields' });
        }

        let imageUrls = [];
        if (req.files && req.files.length > 0) {
            for (let i = 0; i < req.files.length; i++) {
                const imageUrl = await uploadImage(req.files[i]);
                imageUrls.push(imageUrl);
            }
        }

        let productImages = imageUrls.length > 0 ? imageUrls : images;

        // Validate image URLs
        if (productImages && Array.isArray(productImages)) {
            for (const imageUrl of productImages) {
                if (!isValidImageUrl(imageUrl)) {
                    return res.status(400).json({ error: 'Invalid image URL: ' + imageUrl });
                }
            }
        } else {
            productImages = []; // Ensure it's an empty array if no images are provided
        }

        console.log("controller about to call model create")
        const newProduct = await createProduct(sellerId, title, description, price, category, productImages, stock_quantity);
        console.log('New product created:', newProduct);
        res.status(201).json({ message: 'Product created successfully', product: newProduct });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: error.message || 'Error creating product' });
    }
};

// Controller to update an existing product (including image update)
const updateExistingProduct = async (req, res) => {
    console.log('Updating existing product...');
    try {
        const { title, description, price, category, images, stock_quantity } = req.body;
        const productId = req.params.id;

        // Get sellerId from req.user
        const sellerId = req.user.user_id;  //Assuming the userId is stored in req.user.user_id

        console.log(`Request to update product ID: ${productId} with data:`, req.body);

        // Check ownership
        await checkOwnership(productId, sellerId);

        let imageUrls = [];
        if (req.files && req.files.length > 0) {
            for (let i = 0; i < req.files.length; i++) {
                const imageUrl = await uploadImage(req.files[i]);
                imageUrls.push(imageUrl);
            }
        }

        let productImages = imageUrls.length > 0 ? imageUrls : images;

        // Validate image URLs
        if (productImages && Array.isArray(productImages)) {
            for (const imageUrl of productImages) {
                if (!isValidImageUrl(imageUrl)) {
                    return res.status(400).json({ error: 'Invalid image URL: ' + imageUrl });
                }
            }
        } else {
            productImages = []; // Ensure it's an empty array if no images are provided
        }

        const updatedProduct = await updateProduct(productId, title, description, price, category, productImages, stock_quantity);
        console.log('Product updated successfully:', updatedProduct);
        res.status(200).json({ message: 'Product updated successfully', product: updatedProduct });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: error.message || 'Error updating product' });
    }
};

// Controller to get a product by ID
const getProduct = async (req, res) => {
    console.log('Getting product by ID...');
    try {
        const productId = req.params.id;
        console.log(`Request to get product ID: ${productId}`);
        const product = await getProductById(productId);

        if (!product) {
            console.log('Product not found');
            return res.status(404).json({ error: 'Product not found' });
        }

        console.log('Product found:', product);
        res.status(200).json({ product });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Error fetching product' });
    }
};

// Controller to delete a product
const deleteExistingProduct = async (req, res) => {
    console.log('Deleting existing product...');
    try {

        const productId = req.params.id;
        // Get sellerId from req.user
        const sellerId = req.user.user_id;  //Assuming the userId is stored in req.user.user_id

        console.log(`Request to delete product ID: ${productId}`);

        // Check ownership
        await checkOwnership(productId, sellerId);

        const deletedProduct = await deleteProduct(productId);

        if (!deletedProduct) {
            console.log('Product not found');
            return res.status(404).json({ error: 'Product not found' });
        }

        console.log('Product deleted successfully');
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: error.message || 'Error deleting product' });
    }
};

// Controller to get all products
const getAllProductsList = async (req, res) => {
    console.log('Getting all products...');
    try {
        const products = await getAllProducts();
        console.log(`Found ${products.length} products`);
        res.status(200).json({ products });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Error fetching products' });
    }
};

// Controller to search products
const searchProductsList = async (req, res) => {
    console.log('Searching products...');
    try {
        const { keyword, category, minPrice, maxPrice } = req.query;
        console.log('Search parameters:', req.query);
        const products = await searchProducts(keyword, category, minPrice, maxPrice);
        console.log(`Found ${products.length} products matching search criteria`);
        res.status(200).json({ products });
    } catch (error) {
        console.error('Error searching products:', error);
        res.status(500).json({ error: 'Error searching products' });
    }
};

module.exports = { createNewProduct, getProduct, updateExistingProduct, deleteExistingProduct, getAllProductsList, searchProductsList };