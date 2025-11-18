const express = require('express');
const router = express.Router();
const {
  getStores,
  createOrder,
  getOrderStatus,
  confirmOrderPrice,
  uploadVoice
} = require('../controllers/customerController');

// @route   GET /api/v1/stores
router.get('/stores', getStores);

// @route   POST /api/v1/orders
router.post('/orders', uploadVoice, createOrder);

// @route   GET /api/v1/orders/:orderNumber/status
router.get('/orders/:orderNumber/status', getOrderStatus);

// @route   PUT /api/v1/orders/:orderId/confirm
router.put('/orders/:orderId/confirm', confirmOrderPrice);

module.exports = router;
