// controllers/roomController.js
const RoomModel = require('../models/roomModel');
const ProductModel = require('../models/productModel');

// GET /api/rooms
async function getRooms(req, res, next) {
  try {
    const rooms = await RoomModel.getAll();
    res.json({ success: true, rooms });
  } catch (err) {
    next(err);
  }
}

// GET /api/rooms/:id/products
async function getRoomProducts(req, res, next) {
  try {
    const room = await RoomModel.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found.' });
    const products = await ProductModel.findByRoom(room.name);
    res.json({ success: true, room, products });
  } catch (err) {
    next(err);
  }
}

// POST /api/rooms/build
// body: { room, style, budget }
// Greedily builds a furnished-room package: one product per category,
// picking the best-rated option that still fits inside the remaining budget.
async function buildRoom(req, res, next) {
  try {
    const { room, style, budget } = req.body;
    if (!room || !budget) {
      return res.status(400).json({ success: false, message: 'room and budget are required.' });
    }

    const candidates = await ProductModel.findForRoomBuild({ room, style, maxBudget: Number(budget) });

    const seenCategories = new Set();
    const selected = [];
    let remaining = Number(budget);

    for (const product of candidates) {
      const catKey = product.category_name || 'Other';
      if (seenCategories.has(catKey)) continue; // one item per category, to build a balanced room
      if (Number(product.price) > remaining) continue;

      selected.push(product);
      seenCategories.add(catKey);
      remaining -= Number(product.price);
    }

    const estimatedTotal = selected.reduce((sum, p) => sum + Number(p.price), 0);

    res.json({
      success: true,
      room,
      style: style || 'Any',
      budget: Number(budget),
      products: selected,
      estimatedTotal,
      remaining: Number(budget) - estimatedTotal,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/rooms/build/replace
// body: { room, style, budget, excludeProductId, categoryName }
// Swaps one product in a Build My Room package for an alternative in the same category.
async function replaceRoomProduct(req, res, next) {
  try {
    const { room, style, categoryName, excludeProductId, remainingBudget } = req.body;
    const candidates = await ProductModel.findForRoomBuild({ room, style, maxBudget: Number(remainingBudget) });
    const alternative = candidates.find(
      (p) => p.category_name === categoryName && String(p.id) !== String(excludeProductId)
    );
    if (!alternative) {
      return res.status(404).json({ success: false, message: 'No alternative product found within budget.' });
    }
    res.json({ success: true, product: alternative });
  } catch (err) {
    next(err);
  }
}

module.exports = { getRooms, getRoomProducts, buildRoom, replaceRoomProduct };
