// controllers/productController.js
const ProductModel = require('../models/productModel');

// GET /api/products
// Supports query params: search, room, category, minPrice, maxPrice, brand,
// material, color, style, minRating, inStock, sort, page, limit
async function getProducts(req, res, next) {
  try {
    const result = await ProductModel.findAll(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

// GET /api/products/:id
async function getProductById(req, res, next) {
  try {
    const product = await ProductModel.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, product });
  } catch (err) {
    next(err);
  }
}

// GET /api/products/compare?ids=1,2,3
async function compareProducts(req, res, next) {
  try {
    const ids = (req.query.ids || '').split(',').filter(Boolean);
    if (ids.length < 2) {
      return res.status(400).json({ success: false, message: 'Provide at least 2 product ids to compare.' });
    }
    const products = await Promise.all(ids.map((id) => ProductModel.findById(id)));
    res.json({ success: true, products: products.filter(Boolean) });
  } catch (err) {
    next(err);
  }
}

// POST /api/products (admin)
async function createProduct(req, res, next) {
  try {
    const body = { ...req.body };
    if (req.file) body.image = req.file.filename;
    if (body.room_ids && typeof body.room_ids === 'string') {
      body.room_ids = JSON.parse(body.room_ids);
    }
    // discount is derived from price vs original_price if not explicitly provided
    if (!body.discount && body.original_price && body.price) {
      body.discount = Math.round(
        ((body.original_price - body.price) / body.original_price) * 100
      );
    }
    const id = await ProductModel.create(body);
    res.status(201).json({ success: true, id, message: 'Product created.' });
  } catch (err) {
    next(err);
  }
}

// PUT /api/products/:id (admin)
async function updateProduct(req, res, next) {
  try {
    const body = { ...req.body };
    if (req.file) body.image = req.file.filename;
    if (body.room_ids && typeof body.room_ids === 'string') {
      body.room_ids = JSON.parse(body.room_ids);
    }
    await ProductModel.update(req.params.id, body);
    res.json({ success: true, message: 'Product updated.' });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/products/:id (admin)
async function deleteProduct(req, res, next) {
  try {
    await ProductModel.remove(req.params.id);
    res.json({ success: true, message: 'Product deleted.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getProducts,
  getProductById,
  compareProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};
