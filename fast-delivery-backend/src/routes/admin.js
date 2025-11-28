const express = require('express');
const router = express.Router();
const {
  getStores,
  approveRejectStore,
  getDrivers,
  approveRejectDriver,
  getOrders,
  addDeliveryFee,
  assignDriver,
  cancelOrder,
  getCustomers,
  deactivateCustomer,
  getStats,
  getSettings,
  updateSettings,
  addStoreType,
  deleteStoreType,
  getMonthlyExpense,
  updateMonthlyExpense,
  getExtendedStats,
  getAdminProfile,
  updateAdminProfile,
  updateAdminPassword
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(protect);
router.use(authorize('admin'));

// Store management
router.get('/stores', getStores);
router.put('/stores/:storeId/approve', approveRejectStore);

// Driver management
router.get('/drivers', getDrivers);
router.put('/drivers/:driverId/approve', approveRejectDriver);

// Order management
router.get('/orders', getOrders);
router.put('/orders/:orderId/delivery-fee', addDeliveryFee);
router.put('/orders/:orderId/assign-driver', assignDriver);
router.put('/orders/:orderId/cancel', cancelOrder);

// Customer management
router.get('/customers', getCustomers);
router.put('/customers/:customerId/deactivate', deactivateCustomer);

// Dashboard stats
router.get('/stats', getStats);

// Extended statistics
router.get('/stats/extended', getExtendedStats);

// Settings
router.get('/settings', getSettings);
router.put('/settings', updateSettings);
router.post('/settings/store-types', addStoreType);
router.delete('/settings/store-types/:storeType', deleteStoreType);

// Monthly expenses
router.get('/expenses/:year/:month', getMonthlyExpense);
router.put('/expenses/:year/:month', updateMonthlyExpense);

// Admin profile management
router.get('/profile', getAdminProfile);
router.put('/profile', updateAdminProfile);
router.put('/profile/password', updateAdminPassword);

module.exports = router;

