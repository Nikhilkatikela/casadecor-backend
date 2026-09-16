// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { getDashboardStats, getUsers } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');

router.use(protect, requireAdmin);

router.get('/dashboard', getDashboardStats);
router.get('/users', getUsers);

module.exports = router;
