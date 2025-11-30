const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getStores,
  getServiceStatus,
  createOrder,
  getOrderStatus,
  confirmOrderPrice,
  uploadVoice,
  getMyOrders,
  getActiveOrderByPhone,
  updateProfile,
  deleteAccount
} = require('../controllers/customerController');

// @route   GET /api/v1/orders/stores
router.get('/stores', getStores);

// @route   GET /api/v1/orders/service-status
router.get('/service-status', getServiceStatus);

// @route   GET /api/v1/orders/my-orders
router.get('/my-orders', protect, getMyOrders);

// @route   PUT /api/v1/orders/profile
router.put('/profile', protect, updateProfile);

// @route   DELETE /api/v1/orders/profile
router.delete('/profile', protect, deleteAccount);

// @route   GET /api/v1/orders/active-by-phone/:phone
router.get('/active-by-phone/:phone', getActiveOrderByPhone);

// @route   POST /api/v1/orders
router.post('/', uploadVoice, createOrder);

// @route   GET /api/v1/orders/:orderNumber/status
router.get('/:orderNumber/status', getOrderStatus);

// @route   PUT /api/v1/orders/:orderId/confirm
router.put('/:orderId/confirm', confirmOrderPrice);

module.exports = router;
