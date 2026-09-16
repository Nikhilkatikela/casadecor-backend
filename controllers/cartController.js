// controllers/cartController.js
const CartModel = require('../models/cartModel');

// GET /api/cart
async function getCart(req, res, next) {
  try {
    const items = await CartModel.getByUser(req.user.id);
    const subtotal = items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);
    const delivery = subtotal > 0 ? 100 : 0;
    res.json({ success: true, items, subtotal, delivery, total: subtotal + delivery });
  } catch (err) {
    next(err);
  }
}

// POST /api/cart  { product_id, quantity }
async function addToCart(req, res, next) {
  try {
    const { product_id, quantity = 1 } = req.body;
    if (!product_id) return res.status(400).json({ success: false, message: 'product_id is required.' });
    await CartModel.addOrUpdate(req.user.id, product_id, Number(quantity));
    res.status(201).json({ success: true, message: 'Added to cart.' });
  } catch (err) {
    next(err);
  }
}

// PUT /api/cart/:id  { quantity }  -- also used for increase/decrease from the frontend
async function updateCartItem(req, res, next) {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) {
      return res.status(400).json({ success: false, message: 'quantity must be at least 1.' });
    }
    await CartModel.setQuantity(req.params.id, req.user.id, quantity);
    res.json({ success: true, message: 'Cart updated.' });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/cart/:id
async function removeCartItem(req, res, next) {
  try {
    await CartModel.remove(req.params.id, req.user.id);
    res.json({ success: true, message: 'Item removed from cart.' });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/cart  (clear entire cart)
async function clearCart(req, res, next) {
  try {
    await CartModel.clear(req.user.id);
    res.json({ success: true, message: 'Cart cleared.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, clearCart };
