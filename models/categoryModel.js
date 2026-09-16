// models/categoryModel.js
const { pool } = require('../config/db');

const CategoryModel = {
  async getAll() {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    return rows;
  },
  async create({ name, description, image }) {
    const [result] = await pool.query(
      'INSERT INTO categories (name, description, image) VALUES (?, ?, ?)',
      [name, description, image]
    );
    return result.insertId;
  },
  async update(id, { name, description, image }) {
    await pool.query('UPDATE categories SET name = ?, description = ?, image = ? WHERE id = ?', [
      name, description, image, id,
    ]);
  },
  async remove(id) {
    await pool.query('DELETE FROM categories WHERE id = ?', [id]);
  },
};

module.exports = CategoryModel;
