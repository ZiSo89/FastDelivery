const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getDriverProfile,
  updateDriverProfile,
  toggleAvailability,
  getDriverOrders,
  acceptRejectAssignment,
  updateOrderStatus
} = require('../controllers/driverController');

// Protect all routes
router.use(protect);
router.use(authorize('driver'));

// @route   GET /api/v1/driver/profile
router.get('/profile', getDriverProfile);

// @route   PUT /api/v1/driver/profile
router.put('/profile', updateDriverProfile);

// @route   PUT /api/v1/driver/availability
router.put('/availability', toggleAvailability);

// @route   GET /api/v1/driver/orders
router.get('/orders', getDriverOrders);

// @route   PUT /api/v1/driver/orders/:orderId/accept
router.put('/orders/:orderId/accept', acceptRejectAssignment);

// @route   PUT /api/v1/driver/orders/:orderId/status
router.put('/orders/:orderId/status', updateOrderStatus);

module.exports = router;
