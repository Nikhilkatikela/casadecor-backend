// controllers/wishlistController.js
const WishlistModel = require('../models/wishlistModel');

async function getWishlist(req, res, next) {
  try {
    const items = await WishlistModel.getByUser(req.user.id);
    res.json({ success: true, items });
  } catch (err) {
    next(err);
  }
}

async function addToWishlist(req, res, next) {
  try {
    const { product_id } = req.body;
    if (!product_id) return res.status(400).json({ success: false, message: 'product_id is required.' });
    await WishlistModel.add(req.user.id, product_id);
    res.status(201).json({ success: true, message: 'Added to wishlist.' });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/wishlist/:id  -- :id here is the product_id for simplicity on the frontend
async function removeFromWishlist(req, res, next) {
  try {
    await WishlistModel.remove(req.user.id, req.params.id);
    res.json({ success: true, message: 'Removed from wishlist.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
