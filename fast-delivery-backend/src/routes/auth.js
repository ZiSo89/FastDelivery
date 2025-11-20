const express = require('express');
const router = express.Router();
const {
  registerStore,
  registerDriver,
  registerCustomer,
  login
} = require('../controllers/authController');

// @route   POST /api/v1/auth/store/register
router.post('/store/register', registerStore);

// @route   POST /api/v1/auth/driver/register
router.post('/driver/register', registerDriver);

// @route   POST /api/v1/auth/customer/register
router.post('/customer/register', registerCustomer);

// @route   POST /api/v1/auth/login
router.post('/login', login);

module.exports = router;
