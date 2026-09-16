// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const {
  createOrder, getMyOrders, getOrderById, getAllOrders, updateOrderStatus,
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');

router.use(protect);

router.post('/', createOrder);
router.get('/', getMyOrders);
router.get('/admin/all', requireAdmin, getAllOrders);
router.get('/:id', getOrderById);
router.put('/:id/status', requireAdmin, updateOrderStatus);

module.exports = router;
