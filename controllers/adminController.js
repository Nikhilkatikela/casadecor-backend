// controllers/adminController.js
const UserModel = require('../models/userModel');
const OrderModel = require('../models/orderModel');
const ProductModel = require('../models/productModel');
const { pool } = require('../config/db');

// GET /api/admin/dashboard
async function getDashboardStats(req, res, next) {
  try {
    const [[productCount]] = await pool.query('SELECT COUNT(*) AS total FROM products');
    const customerCount = await UserModel.count();
    const { totals, monthly, byRoom, byCategory, popular } = await OrderModel.revenueStats();
    const lowStock = await ProductModel.lowStock(5);

    res.json({
      success: true,
      stats: {
        totalProducts: productCount.total,
        totalCustomers: customerCount,
        totalOrders: totals.total_orders,
        totalRevenue: totals.total_revenue,
        lowStockCount: lowStock.length,
      },
      charts: { monthlySales: monthly, salesByRoom: byRoom, salesByCategory: byCategory, mostPopular: popular },
      lowStockProducts: lowStock,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/users
async function getUsers(req, res, next) {
  try {
    const users = await UserModel.getAll();
    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDashboardStats, getUsers };
