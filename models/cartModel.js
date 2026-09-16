// models/cartModel.js
const { pool } = require('../config/db');

const CartModel = {
  async getByUser(userId) {
    const [rows] = await pool.query(
      `SELECT ct.id AS cart_id, ct.quantity, p.id AS product_id, p.name, p.price,
              p.original_price, p.image, p.stock
       FROM cart ct
       INNER JOIN products p ON p.id = ct.product_id
       WHERE ct.user_id = ?
       ORDER BY ct.created_at DESC`,
      [userId]
    );
    return rows;
  },

  // Adds the product, or bumps quantity if it's already in the cart.
  async addOrUpdate(userId, productId, quantity) {
    await pool.query(
      `INSERT INTO cart (user_id, product_id, quantity)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
      [userId, productId, quantity]
    );
  },

  async setQuantity(cartId, userId, quantity) {
    await pool.query('UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?', [
      quantity, cartId, userId,
    ]);
  },

  async remove(cartId, userId) {
    await pool.query('DELETE FROM cart WHERE id = ? AND user_id = ?', [cartId, userId]);
  },

  async clear(userId) {
    await pool.query('DELETE FROM cart WHERE user_id = ?', [userId]);
  },
};

module.exports = CartModel;
