const express = require('express');
const router = express.Router();
const {
  getStores,
  createOrder,
  getOrderStatus,
  confirmOrderPrice,
  uploadVoice
} = require('../controllers/customerController');

// @route   GET /api/v1/orders/stores
router.get('/stores', getStores);

// @route   POST /api/v1/orders
router.post('/', uploadVoice, createOrder);

// @route   GET /api/v1/orders/:orderNumber/status
router.get('/:orderNumber/status', getOrderStatus);

// @route   PUT /api/v1/orders/:orderId/confirm
router.put('/:orderId/confirm', confirmOrderPrice);

module.exports = router;
