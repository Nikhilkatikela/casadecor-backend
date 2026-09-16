// models/orderModel.js
const { pool } = require('../config/db');

const ORDER_STATUSES = [
  'Ordered', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled',
];

const OrderModel = {
  ORDER_STATUSES,

  // Creates the order + its line items inside a single transaction so
  // a failure partway through never leaves a half-written order.
  async create({ userId, items, totalAmount, deliveryCharge, shippingAddress, fullName, phone, email }) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [orderResult] = await conn.query(
        `INSERT INTO orders (user_id, total_amount, delivery_charge, shipping_address, full_name, phone, email)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, totalAmount, deliveryCharge, shippingAddress, fullName, phone, email]
      );
      const orderId = orderResult.insertId;

      for (const item of items) {
        await conn.query(
          'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
          [orderId, item.product_id, item.quantity, item.price]
        );
        await conn.query('UPDATE products SET stock = stock - ? WHERE id = ?', [
          item.quantity, item.product_id,
        ]);
      }

      await conn.commit();
      return orderId;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async findByUser(userId) {
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    for (const order of orders) {
      const [items] = await pool.query(
        `SELECT oi.*, p.name, p.image FROM order_items oi
         LEFT JOIN products p ON p.id = oi.product_id
         WHERE oi.order_id = ?`,
        [order.id]
      );
      order.items = items;
    }
    return orders;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (!rows[0]) return null;
    const [items] = await pool.query(
      `SELECT oi.*, p.name, p.image FROM order_items oi
       LEFT JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = ?`,
      [id]
    );
    return { ...rows[0], items };
  },

  async getAll() {
    const [rows] = await pool.query(
      `SELECT o.*, u.name AS customer_name, u.email AS customer_email
       FROM orders o INNER JOIN users u ON u.id = o.user_id
       ORDER BY o.created_at DESC`
    );
    return rows;
  },

  async updateStatus(id, status) {
    await pool.query('UPDATE orders SET order_status = ? WHERE id = ?', [status, id]);
  },

  async updatePaymentStatus(id, status) {
    await pool.query('UPDATE orders SET payment_status = ? WHERE id = ?', [status, id]);
  },

  async revenueStats() {
    const [[totals]] = await pool.query(
      `SELECT COUNT(*) AS total_orders, COALESCE(SUM(total_amount),0) AS total_revenue
       FROM orders WHERE payment_status = 'Paid'`
    );
    const [monthly] = await pool.query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, SUM(total_amount) AS revenue
       FROM orders WHERE payment_status = 'Paid'
       GROUP BY month ORDER BY month DESC LIMIT 12`
    );
    const [byRoom] = await pool.query(
      `SELECT r.name AS room, SUM(oi.quantity * oi.price) AS revenue
       FROM order_items oi
       INNER JOIN products p ON p.id = oi.product_id
       INNER JOIN product_rooms pr ON pr.product_id = p.id
       INNER JOIN rooms r ON r.id = pr.room_id
       GROUP BY r.name ORDER BY revenue DESC`
    );
    const [byCategory] = await pool.query(
      `SELECT c.name AS category, SUM(oi.quantity * oi.price) AS revenue
       FROM order_items oi
       INNER JOIN products p ON p.id = oi.product_id
       LEFT JOIN categories c ON c.id = p.category_id
       GROUP BY c.name ORDER BY revenue DESC`
    );
    const [popular] = await pool.query(
      `SELECT p.id, p.name, SUM(oi.quantity) AS units_sold
       FROM order_items oi INNER JOIN products p ON p.id = oi.product_id
       GROUP BY p.id ORDER BY units_sold DESC LIMIT 10`
    );
    return { totals, monthly, byRoom, byCategory, popular };
  },
};

module.exports = OrderModel;
