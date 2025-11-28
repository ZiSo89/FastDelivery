const express = require('express');
const router = express.Router();
const {
  registerStore,
  registerDriver,
  registerCustomer,
  login,
  getStoreTypes
} = require('../controllers/authController');

// @route   POST /api/v1/auth/store/register
router.post('/store/register', registerStore);

// @route   POST /api/v1/auth/driver/register
router.post('/driver/register', registerDriver);

// @route   POST /api/v1/auth/customer/register
router.post('/customer/register', registerCustomer);

// @route   POST /api/v1/auth/login
router.post('/login', login);

// @route   GET /api/v1/auth/store-types (public - for registration form)
router.get('/store-types', getStoreTypes);

module.exports = router;
