// controllers/reviewController.js
const ReviewModel = require('../models/reviewModel');
const ProductModel = require('../models/productModel');

// POST /api/reviews  { product_id, rating, comment }
async function createReview(req, res, next) {
  try {
    const { product_id, rating, comment } = req.body;
    if (!product_id || !rating) {
      return res.status(400).json({ success: false, message: 'product_id and rating are required.' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'rating must be between 1 and 5.' });
    }

    const purchased = await ReviewModel.hasPurchased(req.user.id, product_id);
    if (!purchased) {
      return res.status(403).json({
        success: false,
        message: 'You can only review products from orders that have been delivered to you.',
      });
    }

    const id = await ReviewModel.create({ userId: req.user.id, productId: product_id, rating, comment });
    await ProductModel.recalculateRating(product_id);

    res.status(201).json({ success: true, id, message: 'Review submitted.' });
  } catch (err) {
    next(err);
  }
}

// GET /api/products/:id/reviews
async function getProductReviews(req, res, next) {
  try {
    const reviews = await ReviewModel.findByProduct(req.params.id);
    res.json({ success: true, reviews });
  } catch (err) {
    next(err);
  }
}

// GET /api/reviews/admin/all (admin)
async function getAllReviews(req, res, next) {
  try {
    const reviews = await ReviewModel.getAllForAdmin();
    res.json({ success: true, reviews });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/reviews/:id (admin)
async function deleteReview(req, res, next) {
  try {
    await ReviewModel.remove(req.params.id);
    res.json({ success: true, message: 'Review deleted.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { createReview, getProductReviews, getAllReviews, deleteReview };
