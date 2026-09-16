// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const {
  getProducts, getProductById, compareProducts, createProduct, updateProduct, deleteProduct,
} = require('../controllers/productController');
const { getProductReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public
router.get('/', getProducts);
router.get('/compare', compareProducts);
router.get('/:id', getProductById);
router.get('/:id/reviews', getProductReviews);

// Admin only
router.post('/', protect, requireAdmin, upload.single('image'), createProduct);
router.put('/:id', protect, requireAdmin, upload.single('image'), updateProduct);
router.delete('/:id', protect, requireAdmin, deleteProduct);

module.exports = router;
