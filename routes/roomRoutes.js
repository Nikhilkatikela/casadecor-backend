// routes/roomRoutes.js
const express = require('express');
const router = express.Router();
const { getRooms, getRoomProducts, buildRoom, replaceRoomProduct } = require('../controllers/roomController');

router.get('/', getRooms);
router.get('/:id/products', getRoomProducts);
router.post('/build', buildRoom);              // Build My Room + Budget Planner
router.post('/build/replace', replaceRoomProduct);

module.exports = router;
