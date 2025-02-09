const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const productRoutes = require('./routes/productRoutes');
const dotenv = require('dotenv');
  // Import your routes
// dotenv.config({ path: './env' });
dotenv.config({ path: '../../.env' });



const app = express();
const PORT = process.env.PORT || 3000; // Use environment variable for port

// Middleware
app.use(cors()); // Enable CORS first
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON request bodies

// Routes
app.use('/products', productRoutes); // Mount product routes

// Basic route (for testing if the server is up)
app.get('/', (req, res) => {
    res.send('Multi-Vendor Platform API is running!');
});

// Error handling middleware (place at the end)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log("JWT_SECRET:", process.env.JWT_SECRET);

});