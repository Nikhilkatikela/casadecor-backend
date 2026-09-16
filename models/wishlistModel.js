// models/wishlistModel.js
const { pool } = require('../config/db');

const WishlistModel = {
  async getByUser(userId) {
    const [rows] = await pool.query(
      `SELECT w.id AS wishlist_id, p.id AS product_id, p.name, p.price, p.original_price,
              p.image, p.rating, p.stock
       FROM wishlist w
       INNER JOIN products p ON p.id = w.product_id
       WHERE w.user_id = ?
       ORDER BY w.created_at DESC`,
      [userId]
    );
    return rows;
  },

  async add(userId, productId) {
    await pool.query(
      'INSERT IGNORE INTO wishlist (user_id, product_id) VALUES (?, ?)',
      [userId, productId]
    );
  },

  async remove(userId, productId) {
    await pool.query('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?', [
      userId, productId,
    ]);
  },
};

module.exports = WishlistModel;
