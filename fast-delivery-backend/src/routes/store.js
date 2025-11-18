const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getStoreOrders,
  acceptRejectOrder,
  addProductPrice,
  updateOrderStatus,
  getStoreProfile,
  updateStoreProfile
} = require('../controllers/storeController');

// Protect all routes
router.use(protect);
router.use(authorize('store'));

// @route   GET /api/v1/store/orders
router.get('/orders', getStoreOrders);

// @route   PUT /api/v1/store/orders/:orderId/accept
router.put('/orders/:orderId/accept', acceptRejectOrder);

// @route   PUT /api/v1/store/orders/:orderId/price
router.put('/orders/:orderId/price', addProductPrice);

// @route   PUT /api/v1/store/orders/:orderId/status
router.put('/orders/:orderId/status', updateOrderStatus);

// @route   GET /api/v1/store/profile
router.get('/profile', getStoreProfile);

// @route   PUT /api/v1/store/profile
router.put('/profile', updateStoreProfile);

module.exports = router;
