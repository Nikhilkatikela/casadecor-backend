// routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const {
  getCategories, createCategory, updateCategory, deleteCategory,
} = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/', getCategories);
router.post('/', protect, requireAdmin, upload.single('image'), createCategory);
router.put('/:id', protect, requireAdmin, upload.single('image'), updateCategory);
router.delete('/:id', protect, requireAdmin, deleteCategory);

module.exports = router;
