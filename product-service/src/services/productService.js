const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory product data for example purposes
let products = [
    { productId: 1, name: 'Product A', inventory: 100 },
    { productId: 2, name: 'Product B', inventory: 50 }
];

// Endpoint to create a new product
app.post('/products', (req, res) => {
    const { name, description, price, stock_quantity, image_url } = req.body;

    if (!name || price === undefined || stock_quantity === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const newProduct = {
        productId: products.length + 1,
        name,
        description,
        price,
        stock_quantity,
        image_url
    };

    products.push(newProduct);

    res.status(201).json({
        message: 'Product uploaded successfully',
        product: newProduct
    });
});

// Endpoint to retrieve all products
app.get('/products', (req, res) => {
    res.json({ products });
});

// Endpoint to retrieve a specific product by ID
app.get('/products/:productId', (req, res) => {
    const { productId } = req.params;
    const product = products.find(p => p.productId == productId);

    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ product });
});

// Endpoint to update product details (name and inventory)
app.put('/products/:productId', (req, res) => {
    const { productId } = req.params;
    const { name, quantityChange } = req.body; // `quantityChange` can be positive (add) or negative (subtract)

    const product = products.find(p => p.productId == productId);

    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }

    // Update product name if provided
    if (name) {
        product.name = name;
    }

    // Update inventory if quantityChange is provided
    if (quantityChange !== undefined) {
        if (product.inventory + quantityChange < 0) {
            return res.status(400).json({ error: 'Insufficient inventory' });
        }
        product.inventory += quantityChange;
    }

    res.json({ message: 'Product updated successfully', product });
});

// Endpoint to delete a product
app.delete('/products/:productId', (req, res) => {
    const { productId } = req.params;

    const productIndex = products.findIndex(p => p.productId == productId);

    if (productIndex === -1) {
        return res.status(404).json({ error: 'Product not found' });
    }

    const deletedProduct = products.splice(productIndex, 1);

    res.json({ message: 'Product deleted successfully', product: deletedProduct[0] });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Product service running on port ${PORT}`);
});
