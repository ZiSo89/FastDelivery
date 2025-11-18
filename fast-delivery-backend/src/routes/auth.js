const express = require('express');
const router = express.Router();
const {
  login,
  registerStore,
  registerDriver
} = require('../controllers/authController');

// @route   POST /api/v1/auth/login
router.post('/login', login);

// @route   POST /api/v1/auth/store/register
router.post('/store/register', registerStore);

// @route   POST /api/v1/auth/driver/register
router.post('/driver/register', registerDriver);

module.exports = router;
