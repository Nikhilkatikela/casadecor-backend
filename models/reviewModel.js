// models/reviewModel.js
const { pool } = require('../config/db');

const ReviewModel = {
  async create({ userId, productId, rating, comment }) {
    const [result] = await pool.query(
      'INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?)',
      [userId, productId, rating, comment]
    );
    return result.insertId;
  },

  async findByProduct(productId) {
    const [rows] = await pool.query(
      `SELECT rv.*, u.name AS user_name FROM reviews rv
       INNER JOIN users u ON u.id = rv.user_id
       WHERE rv.product_id = ?
       ORDER BY rv.created_at DESC`,
      [productId]
    );
    return rows;
  },

  // A user may only review a product they've actually received, to keep reviews genuine.
  async hasPurchased(userId, productId) {
    const [rows] = await pool.query(
      `SELECT 1 FROM order_items oi
       INNER JOIN orders o ON o.id = oi.order_id
       WHERE o.user_id = ? AND oi.product_id = ? AND o.order_status = 'Delivered'
       LIMIT 1`,
      [userId, productId]
    );
    return rows.length > 0;
  },

  async getAllForAdmin() {
    const [rows] = await pool.query(
      `SELECT rv.*, u.name AS user_name, p.name AS product_name FROM reviews rv
       INNER JOIN users u ON u.id = rv.user_id
       INNER JOIN products p ON p.id = rv.product_id
       ORDER BY rv.created_at DESC`
    );
    return rows;
  },

  async remove(id) {
    await pool.query('DELETE FROM reviews WHERE id = ?', [id]);
  },
};

module.exports = ReviewModel;
