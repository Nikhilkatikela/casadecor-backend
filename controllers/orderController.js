// controllers/orderController.js
const OrderModel = require('../models/orderModel');
const CartModel = require('../models/cartModel');

// POST /api/orders
// Creates an order from the user's current cart (called after checkout form submit,
// BEFORE payment — the order starts as payment_status = 'Pending').
async function createOrder(req, res, next) {
  try {
    const { shippingAddress, fullName, phone, email } = req.body;
    if (!shippingAddress || !fullName || !phone) {
      return res.status(400).json({ success: false, message: 'Shipping details are incomplete.' });
    }

    const cartItems = await CartModel.getByUser(req.user.id);
    if (!cartItems.length) {
      return res.status(400).json({ success: false, message: 'Your cart is empty.' });
    }

    const subtotal = cartItems.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);
    const deliveryCharge = 100;
    const totalAmount = subtotal + deliveryCharge;

    const items = cartItems.map((i) => ({
      product_id: i.product_id,
      quantity: i.quantity,
      price: i.price,
    }));

    const orderId = await OrderModel.create({
      userId: req.user.id,
      items,
      totalAmount,
      deliveryCharge,
      shippingAddress,
      fullName,
      phone,
      email,
    });

    await CartModel.clear(req.user.id);

    const order = await OrderModel.findById(orderId);
    res.status(201).json({ success: true, order });
  } catch (err) {
    next(err);
  }
}

// GET /api/orders (own orders)
async function getMyOrders(req, res, next) {
  try {
    const orders = await OrderModel.findByUser(req.user.id);
    res.json({ success: true, orders });
  } catch (err) {
    next(err);
  }
}

// GET /api/orders/:id
async function getOrderById(req, res, next) {
  try {
    const order = await OrderModel.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    if (order.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order.' });
    }
    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
}

// GET /api/orders/admin/all (admin)
async function getAllOrders(req, res, next) {
  try {
    const orders = await OrderModel.getAll();
    res.json({ success: true, orders });
  } catch (err) {
    next(err);
  }
}

// PUT /api/orders/:id/status (admin)  { status }
async function updateOrderStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!OrderModel.ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid order status.' });
    }
    await OrderModel.updateStatus(req.params.id, status);
    res.json({ success: true, message: 'Order status updated.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { createOrder, getMyOrders, getOrderById, getAllOrders, updateOrderStatus };
