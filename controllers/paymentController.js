// controllers/paymentController.js
// Integrates the Cashfree Payment Gateway (Orders API) for checkout.
// Flow:
//   1. Frontend creates a CasaDecor order (order_status='Ordered', payment_status='Pending')
//   2. Frontend calls POST /api/payment/create-order with that order's id
//   3. This creates a Cashfree order and returns a `payment_session_id`
//   4. Frontend loads the Cashfree JS SDK and opens checkout using that session id
//   5. Cashfree redirects back / fires a webhook; we verify status server-side
//      via GET /api/payment/status/:order_id before ever marking payment as successful.
//
// Credentials (CASHFREE_APP_ID / CASHFREE_SECRET_KEY) live only in .env and
// are never sent to the browser.

const { cashfreeClient } = require('../config/cashfree');
const OrderModel = require('../models/orderModel');
const { pool } = require('../config/db');

// POST /api/payment/create-order  { order_id }
async function createPaymentOrder(req, res, next) {
  try {
    const { order_id } = req.body;
    const order = await OrderModel.findById(order_id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    if (order.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized for this order.' });
    }

    const cfOrderId = `casadecor_${order.id}_${Date.now()}`;

    const payload = {
      order_id: cfOrderId,
      order_amount: Number(order.total_amount),
      order_currency: 'INR',
      customer_details: {
        customer_id: `user_${req.user.id}`,
        customer_name: order.full_name,
        customer_email: order.email,
        customer_phone: order.phone,
      },
            order_meta: {
        return_url: `${process.env.FRONTEND_URL}/order-confirmation.html?order_id=${order.id}&cf_order_id=${cfOrderId}`,
        ...(process.env.BACKEND_URL
          ? { notify_url: `${process.env.BACKEND_URL}/api/payment/webhook` }
          : {}),
      },
    };

    const { data } = await cashfreeClient.post('/orders', payload);

    await pool.query(
      'INSERT INTO payments (order_id, cf_order_id, amount, status) VALUES (?, ?, ?, ?)',
      [order.id, cfOrderId, order.total_amount, 'Pending']
    );

    res.json({
      success: true,
      payment_session_id: data.payment_session_id,
      cf_order_id: cfOrderId,
    });
  } catch (err) {
    // Surface Cashfree's error message when available, without leaking credentials.
    const message = err.response?.data?.message || err.message;
    res.status(500).json({ success: false, message: `Payment gateway error: ${message}` });
  }
}

// GET /api/payment/status/:order_id
// Re-checks payment status directly with Cashfree — never trust the
// frontend's own claim that a payment succeeded.
async function getPaymentStatus(req, res, next) {
  try {
    const order = await OrderModel.findById(req.params.order_id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    const [[payment]] = await pool.query(
      'SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC LIMIT 1',
      [order.id]
    );
    if (!payment) return res.status(404).json({ success: false, message: 'No payment found for this order.' });

    const { data } = await cashfreeClient.get(`/orders/${payment.cf_order_id}`);
    const cfStatus = data.order_status; // 'PAID' | 'ACTIVE' | 'EXPIRED' | ...

    if (cfStatus === 'PAID') {
      await pool.query('UPDATE payments SET status = ?, payment_id = ? WHERE order_id = ?', [
        'Success', data.cf_order_id || payment.cf_order_id, order.id,
      ]);
      await OrderModel.updatePaymentStatus(order.id, 'Paid');
      await OrderModel.updateStatus(order.id, 'Confirmed');
    } else if (cfStatus === 'EXPIRED' || cfStatus === 'TERMINATED') {
      await pool.query('UPDATE payments SET status = ? WHERE order_id = ?', ['Failed', order.id]);
      await OrderModel.updatePaymentStatus(order.id, 'Failed');
    }

    const refreshedOrder = await OrderModel.findById(order.id);
    res.json({ success: true, cashfree_status: cfStatus, order: refreshedOrder });
  } catch (err) {
    const message = err.response?.data?.message || err.message;
    res.status(500).json({ success: false, message: `Payment gateway error: ${message}` });
  }
}

// POST /api/payment/webhook
// Cashfree calls this server-to-server when a payment event happens.
// In production, verify the `x-webhook-signature` header against the raw
// body using CASHFREE_SECRET_KEY before trusting this payload.
async function paymentWebhook(req, res, next) {
  try {
    const event = req.body;
    const cfOrderId = event?.data?.order?.order_id;
    const status = event?.data?.payment?.payment_status; // 'SUCCESS' | 'FAILED'

    if (cfOrderId) {
      const [[payment]] = await pool.query('SELECT * FROM payments WHERE cf_order_id = ?', [cfOrderId]);
      if (payment) {
        if (status === 'SUCCESS') {
          await pool.query('UPDATE payments SET status = ? WHERE id = ?', ['Success', payment.id]);
          await OrderModel.updatePaymentStatus(payment.order_id, 'Paid');
          await OrderModel.updateStatus(payment.order_id, 'Confirmed');
        } else if (status === 'FAILED') {
          await pool.query('UPDATE payments SET status = ? WHERE id = ?', ['Failed', payment.id]);
          await OrderModel.updatePaymentStatus(payment.order_id, 'Failed');
        }
      }
    }
    res.status(200).json({ received: true });
  } catch (err) {
    // Webhook handlers should still return 200 on internal errors to avoid
    // endless retries flooding logs; the error is logged for investigation.
    console.error('Webhook processing error:', err.message);
    res.status(200).json({ received: true });
  }
}

module.exports = { createPaymentOrder, getPaymentStatus, paymentWebhook };
