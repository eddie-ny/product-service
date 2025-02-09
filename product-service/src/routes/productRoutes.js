const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() }); // Store files in memory
const authenticateToken = require('../middleware/authenticateToken'); // Import your authentication middleware

router.post('/', authenticateToken, upload.array('images', 10), productController.createNewProduct); // Apply middleware here
router.get('/:id', productController.getProduct);
router.put('/:id', authenticateToken, upload.array('images', 10), productController.updateExistingProduct);
router.delete('/:id', authenticateToken, productController.deleteExistingProduct);
router.get('/', productController.getAllProductsList);
router.get('/search', productController.searchProductsList);

module.exports = router;