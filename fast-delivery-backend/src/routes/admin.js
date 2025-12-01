const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for database backup uploads
const uploadsDir = path.join(__dirname, '../../temp/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `backup-${Date.now()}.zip`)
});

const uploadBackup = multer({ 
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/zip' || file.originalname.endsWith('.zip')) {
      cb(null, true);
    } else {
      cb(new Error('Μόνο αρχεία ZIP επιτρέπονται'), false);
    }
  }
});

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
  updateStoreType,
  getMonthlyExpense,
  updateMonthlyExpense,
  getExtendedStats,
  getAdminProfile,
  updateAdminProfile,
  updateAdminPassword
} = require('../controllers/adminController');

const {
  getDatabaseToolsStatus,
  installDatabaseTools,
  createDatabaseBackup,
  restoreDatabase,
  deleteBackup
} = require('../controllers/backupController');

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
router.put('/settings/store-types/:storeType', updateStoreType);
router.delete('/settings/store-types/:storeType', deleteStoreType);

// Monthly expenses
router.get('/expenses/:year/:month', getMonthlyExpense);
router.put('/expenses/:year/:month', updateMonthlyExpense);

// Admin profile management
router.get('/profile', getAdminProfile);
router.put('/profile', updateAdminProfile);
router.put('/profile/password', updateAdminPassword);

// Database Backup (MongoDB - Full)
router.get('/database/tools-status', getDatabaseToolsStatus);
router.post('/database/install-tools', installDatabaseTools);
router.post('/database/backup', createDatabaseBackup);
router.post('/database/restore', uploadBackup.single('backup'), restoreDatabase);
router.delete('/database/backup', deleteBackup);

module.exports = router;

