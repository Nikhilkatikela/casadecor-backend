// config/cashfree.js
// Thin wrapper around the Cashfree Payment Gateway REST API.
// Docs: https://docs.cashfree.com/docs/payment-gateway-overview
//
// Credentials are read from environment variables only — never hard-code
// keys here and never send them to the frontend.

const axios = require('axios');
require('dotenv').config();

const BASE_URL =
  process.env.CASHFREE_ENV === 'PRODUCTION'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';

const cashfreeClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'x-client-id': process.env.CASHFREE_APP_ID,
    'x-client-secret': process.env.CASHFREE_SECRET_KEY,
    'x-api-version': process.env.CASHFREE_API_VERSION || '2023-08-01',
    'Content-Type': 'application/json',
  },
});

module.exports = { cashfreeClient };
