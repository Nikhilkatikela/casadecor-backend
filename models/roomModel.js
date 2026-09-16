// models/roomModel.js
const { pool } = require('../config/db');

const RoomModel = {
  async getAll() {
    const [rows] = await pool.query('SELECT * FROM rooms ORDER BY id ASC');
    return rows;
  },
  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM rooms WHERE id = ?', [id]);
    return rows[0];
  },
  async findByName(name) {
    const [rows] = await pool.query('SELECT * FROM rooms WHERE name = ?', [name]);
    return rows[0];
  },
};

module.exports = RoomModel;
