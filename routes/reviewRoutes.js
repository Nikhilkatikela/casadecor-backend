// routes/reviewRoutes.js
const express = require('express');
const router = express.Router();
const { createReview, getAllReviews, deleteReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');

router.post('/', protect, createReview);
router.get('/admin/all', protect, requireAdmin, getAllReviews);
router.delete('/:id', protect, requireAdmin, deleteReview);

module.exports = router;
