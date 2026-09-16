// models/productModel.js
const { pool } = require('../config/db');

const SORT_MAP = {
  price_low: 'p.price ASC',
  price_high: 'p.price DESC',
  rating: 'p.rating DESC',
  popular: 'p.review_count DESC',
  new: 'p.created_at DESC',
  discount: 'p.discount DESC',
};

const ProductModel = {
  // Builds a dynamic WHERE clause from optional filters, then paginates.
  async findAll(filters = {}) {
    const {
      search,
      room,
      category,
      minPrice,
      maxPrice,
      brand,
      material,
      color,
      minRating,
      style,
      inStock,
      sort,
      page = 1,
      limit = 20,
    } = filters;

    const where = [];
    const params = [];
    let joinRooms = '';

    if (room) {
      joinRooms = 'INNER JOIN product_rooms pr ON pr.product_id = p.id INNER JOIN rooms r ON r.id = pr.room_id';
      where.push('r.name = ?');
      params.push(room);
    }
    if (search) {
      where.push('MATCH(p.name, p.description, p.material, p.color) AGAINST (? IN NATURAL LANGUAGE MODE)');
      params.push(search);
    }
    if (category) {
      where.push('c.name = ?');
      params.push(category);
    }
    if (minPrice) {
      where.push('p.price >= ?');
      params.push(minPrice);
    }
    if (maxPrice) {
      where.push('p.price <= ?');
      params.push(maxPrice);
    }
    if (brand) {
      where.push('p.brand = ?');
      params.push(brand);
    }
    if (material) {
      where.push('p.material LIKE ?');
      params.push(`%${material}%`);
    }
    if (color) {
      where.push('p.color LIKE ?');
      params.push(`%${color}%`);
    }
    if (style) {
      where.push('p.style = ?');
      params.push(style);
    }
    if (minRating) {
      where.push('p.rating >= ?');
      params.push(minRating);
    }
    if (inStock === 'true') {
      where.push('p.stock > 0');
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const orderClause = SORT_MAP[sort] ? `ORDER BY ${SORT_MAP[sort]}` : 'ORDER BY p.created_at DESC';
    const offset = (Number(page) - 1) * Number(limit);

    const sql = `
      SELECT DISTINCT p.*, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      ${joinRooms}
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `;
    const [rows] = await pool.query(sql, [...params, Number(limit), offset]);

    const countSql = `
      SELECT COUNT(DISTINCT p.id) AS total
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      ${joinRooms}
      ${whereClause}
    `;
    const [countRows] = await pool.query(countSql, params);

    return { products: rows, total: countRows[0].total, page: Number(page), limit: Number(limit) };
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category_name FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.id = ?`,
      [id]
    );
    if (!rows[0]) return null;

    const [rooms] = await pool.query(
      `SELECT r.id, r.name FROM rooms r
       INNER JOIN product_rooms pr ON pr.room_id = r.id
       WHERE pr.product_id = ?`,
      [id]
    );
    return { ...rows[0], rooms };
  },

  async create(data) {
    const {
      name, description, category_id, price, original_price, discount,
      stock, material, dimensions, color, style, brand, image, room_ids = [],
    } = data;

    const [result] = await pool.query(
      `INSERT INTO products
       (name, description, category_id, price, original_price, discount, stock, material, dimensions, color, style, brand, image)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, description, category_id, price, original_price, discount, stock, material, dimensions, color, style, brand || 'CasaDecor', image]
    );

    const productId = result.insertId;
    if (room_ids.length) {
      const values = room_ids.map((roomId) => [productId, roomId]);
      await pool.query('INSERT INTO product_rooms (product_id, room_id) VALUES ?', [values]);
    }
    return productId;
  },

  async update(id, data) {
    const fields = [];
    const params = [];
    const allowed = [
      'name', 'description', 'category_id', 'price', 'original_price', 'discount',
      'stock', 'material', 'dimensions', 'color', 'style', 'brand', 'image',
    ];
    allowed.forEach((field) => {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        params.push(data[field]);
      }
    });
    if (!fields.length) return false;

    params.push(id);
    await pool.query(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, params);

    if (data.room_ids) {
      await pool.query('DELETE FROM product_rooms WHERE product_id = ?', [id]);
      if (data.room_ids.length) {
        const values = data.room_ids.map((roomId) => [id, roomId]);
        await pool.query('INSERT INTO product_rooms (product_id, room_id) VALUES ?', [values]);
      }
    }
    return true;
  },

  async remove(id) {
    await pool.query('DELETE FROM products WHERE id = ?', [id]);
    return true;
  },

  async updateStock(id, delta) {
    await pool.query('UPDATE products SET stock = stock + ? WHERE id = ?', [delta, id]);
  },

  async findByRoom(roomName) {
    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category_name FROM products p
       INNER JOIN product_rooms pr ON pr.product_id = p.id
       INNER JOIN rooms r ON r.id = pr.room_id
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE r.name = ?
       ORDER BY p.is_bestseller DESC, p.rating DESC`,
      [roomName]
    );
    return rows;
  },

  // Used by "Build My Room": picks best-fit products for a room + style within budget,
  // greedily selecting one product per functional category until the budget is used up.
  async findForRoomBuild({ room, style, maxBudget }) {
    const params = [room];
    let styleClause = '';
    if (style) {
      styleClause = 'AND p.style = ?';
      params.push(style);
    }
    params.push(maxBudget);

    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category_name FROM products p
       INNER JOIN product_rooms pr ON pr.product_id = p.id
       INNER JOIN rooms r ON r.id = pr.room_id
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE r.name = ? ${styleClause} AND p.price <= ?
       ORDER BY c.id ASC, p.rating DESC`,
      params
    );
    return rows;
  },

  async recalculateRating(productId) {
    const [rows] = await pool.query(
      'SELECT AVG(rating) AS avg_rating, COUNT(*) AS cnt FROM reviews WHERE product_id = ?',
      [productId]
    );
    const avg = rows[0].avg_rating ? Number(rows[0].avg_rating).toFixed(1) : 0;
    await pool.query('UPDATE products SET rating = ?, review_count = ? WHERE id = ?', [
      avg,
      rows[0].cnt,
      productId,
    ]);
  },

  async lowStock(threshold = 5) {
    const [rows] = await pool.query('SELECT * FROM products WHERE stock <= ? ORDER BY stock ASC', [threshold]);
    return rows;
  },
};

module.exports = ProductModel;
