// routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const {
  getCart, addToCart, updateCartItem, removeCartItem, clearCart,
} = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // every cart route requires login

router.get('/', getCart);
router.post('/', addToCart);
router.put('/:id', updateCartItem);
router.delete('/:id', removeCartItem);
router.delete('/', clearCart);

module.exports = router;
