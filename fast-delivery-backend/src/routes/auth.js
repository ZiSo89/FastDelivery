const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const Store = require('../models/Store');
const Driver = require('../models/Driver');
const Customer = require('../models/Customer');
const {
  registerStore,
  registerDriver,
  registerCustomer,
  login,
  getStoreTypes,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword
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

// Email verification routes
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);

// Password reset routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Debug endpoint to check environment
router.get('/debug-env', (req, res) => {
  res.json({
    NODE_ENV: process.env.NODE_ENV,
    hasResendKey: !!process.env.RESEND_API_KEY,
    resendKeyPrefix: process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.substring(0, 10) + '...' : null,
    emailFrom: process.env.EMAIL_FROM,
    frontendUrl: process.env.FRONTEND_URL
  });
});

// One-time admin setup (protected by secret key)
router.post('/setup-admin', async (req, res) => {
  try {
    const { email, password, name, setupKey } = req.body;
    
    // Verify setup key (use environment variable or hardcoded for one-time use)
    const SETUP_KEY = process.env.ADMIN_SETUP_KEY || 'FastDelivery2024Setup!';
    
    if (setupKey !== SETUP_KEY) {
      return res.status(403).json({ success: false, message: 'Invalid setup key' });
    }
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    
    if (existingAdmin) {
      // Update password
      const salt = await bcrypt.genSalt(10);
      existingAdmin.password = await bcrypt.hash(password, salt);
      await existingAdmin.save();
      
      return res.json({ 
        success: true, 
        message: 'Admin password updated',
        admin: { email: existingAdmin.email, name: existingAdmin.name }
      });
    }
    
    // Create new admin
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const admin = await Admin.create({
      name: name || 'Admin',
      email,
      password: hashedPassword,
      role: 'admin'
    });
    
    res.status(201).json({ 
      success: true, 
      message: 'Admin created successfully',
      admin: { email: admin.email, name: admin.name }
    });
    
  } catch (error) {
    console.error('Setup admin error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Manual email verification (protected by secret key) - for cases where email doesn't arrive
router.post('/manual-verify', async (req, res) => {
  try {
    const { email, type, setupKey } = req.body;
    
    const SETUP_KEY = process.env.ADMIN_SETUP_KEY || 'FastDelivery2024Setup!';
    
    if (setupKey !== SETUP_KEY) {
      return res.status(403).json({ success: false, message: 'Invalid setup key' });
    }
    
    let Model;
    switch (type) {
      case 'customer': Model = Customer; break;
      case 'store': Model = Store; break;
      case 'driver': Model = Driver; break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid type' });
    }
    
    const user = await Model.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();
    
    res.json({ 
      success: true, 
      message: `Email verified for ${email}`,
      user: { email: user.email, name: user.name || user.businessName, isEmailVerified: true }
    });
    
  } catch (error) {
    console.error('Manual verify error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
