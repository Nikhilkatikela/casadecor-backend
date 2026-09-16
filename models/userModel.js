// models/userModel.js
const { pool } = require('../config/db');

const UserModel = {
  async create({ name, email, phone, hashedPassword }) {
    const [result] = await pool.query(
      'INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)',
      [name, email, phone, hashedPassword]
    );
    return result.insertId;
  },

  async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  },

  async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  },

  async getAll() {
    const [rows] = await pool.query(
      'SELECT id, name, email, phone, role, created_at FROM users ORDER BY created_at DESC'
    );
    return rows;
  },

  async count() {
        const [rows] = await pool.query('SELECT COUNT(*) AS total FROM users WHERE role = ?', ['customer']);
    return rows[0].total;
  },
};

module.exports = UserModel;
