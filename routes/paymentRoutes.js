// routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const { createPaymentOrder, getPaymentStatus, paymentWebhook } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create-order', protect, createPaymentOrder);
router.get('/status/:order_id', protect, getPaymentStatus);
router.post('/webhook', paymentWebhook); // called by Cashfree, not the frontend — no user JWT present

module.exports = router;
