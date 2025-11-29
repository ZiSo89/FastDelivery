const Store = require('../models/Store');
const Driver = require('../models/Driver');
const Admin = require('../models/Admin');
const Customer = require('../models/Customer');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { generateToken } = require('../utils/jwt');
const { geocodeAddress } = require('../utils/geocoding');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/emailService');

// Helper: Generate verification token
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// @desc    Login (Store/Driver/Admin)
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validation
    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Παρακαλώ συμπληρώστε όλα τα πεδία'
      });
    }

    // Find user based on role
    let user;
    let Model;

    switch (role) {
      case 'store':
        Model = Store;
        break;
      case 'driver':
        Model = Driver;
        break;
      case 'admin':
        Model = Admin;
        break;
      case 'customer':
        Model = Customer;
        break;
      default:
        return res.status(400).json({ success: false, message: 'Μη έγκυρος ρόλος χρήστη' });
    }

    user = await Model.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Δεν βρέθηκε λογαριασμός με αυτό το email. Παρακαλώ κάντε εγγραφή.'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Λάθος κωδικός πρόσβασης' });
    }

    // For Store and Driver, check if they are approved
    if ((role === 'store' || role === 'driver') && !user.isApproved) {
        return res.status(401).json({ success: false, message: 'Ο λογαριασμός σας αναμένει έγκριση από διαχειριστή.' });
    }

    // Check email verification (only in production)
    if (process.env.NODE_ENV === 'production' && role !== 'admin') {
      if (!user.isEmailVerified) {
        return res.status(401).json({ 
          success: false, 
          message: 'Παρακαλώ επιβεβαιώστε το email σας πρώτα. Ελέγξτε τα εισερχόμενά σας.',
          needsVerification: true
        });
      }
    }

    const token = generateToken(user._id, user.role || role);

    // For customers, check if we need to geocode their address
    let userLocation = user.location;
    if (role === 'customer' && user.address) {
      // Check if location is missing or default [0,0]
      const hasValidLocation = user.location?.coordinates && 
        (user.location.coordinates[0] !== 0 || user.location.coordinates[1] !== 0);
      
      if (!hasValidLocation) {
        try {
          const coords = await geocodeAddress(user.address);
          if (coords) {
            userLocation = {
              type: 'Point',
              coordinates: [coords.lng, coords.lat]
            };
            // Update user in database
            await Customer.findByIdAndUpdate(user._id, { location: userLocation });
          }
        } catch (geocodeError) {
          // Silent fail - continue without location
        }
      }
    }

    // Prepare user object for response
    const userResponse = {
        _id: user._id,
        email: user.email,
        role: user.role || role,
        name: user.name || user.businessName,
        phone: user.phone,
        address: user.address,
        location: userLocation,
        isApproved: user.isApproved,
        status: user.status
    };

    res.status(200).json({
        success: true,
        token,
        user: userResponse
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// @desc    Register Store
// @route   POST /api/v1/auth/store/register
// @access  Public
exports.registerStore = async (req, res) => {
  try {
    const {
      businessName,
      afm,
      email,
      password,
      phone,
      address,
      storeType,
      workingHours,
      description,
      serviceAreas,
      location
    } = req.body;

    // Check if store exists
    const existingStore = await Store.findOne({ $or: [{ email }, { afm }] });

    if (existingStore) {
      return res.status(400).json({
        success: false,
        message: existingStore.email === email ? 'Το email υπάρχει ήδη' : 'Το ΑΦΜ υπάρχει ήδη'
      });
    }

    // Create store
    const store = await Store.create({
      businessName,
      afm,
      email,
      password,
      phone,
      address,
      location,
      storeType,
      workingHours,
      description,
      serviceAreas,
      status: 'pending',
      isApproved: false,
      isEmailVerified: process.env.NODE_ENV === 'development' // Auto-verify in development
    });

    // Send verification email (only in production)
    if (process.env.NODE_ENV === 'production') {
      const verificationToken = generateVerificationToken();
      store.emailVerificationToken = verificationToken;
      store.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
      await store.save();
      
      await sendVerificationEmail(email, businessName, verificationToken, 'store');
    }

    // Notify all admins about new store registration
    const io = req.app.get('io');
    if (io) {
      io.to('admin').emit('store:registered', {
        storeId: store._id,
        businessName: store.businessName,
        storeType: store.storeType,
        message: `Νέο κατάστημα: ${store.businessName}`
      });
    }

    res.status(201).json({
      success: true,
      message: 'Η αίτηση εγγραφής σας υποβλήθηκε. Αναμένετε έγκριση από διαχειριστή.',
      store: {
        _id: store._id,
        businessName: store.businessName,
        email: store.email,
        status: store.status
      }
    });
  } catch (error) {
    console.error('Store registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Σφάλμα εγγραφής'
    });
  }
};

// @desc    Register a new driver
// @route   POST /api/v1/auth/driver/register
// @access  Public
exports.registerDriver = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if driver exists
    const existingDriver = await Driver.findOne({ email });

    if (existingDriver) {
      return res.status(400).json({
        success: false,
        message: 'Το email υπάρχει ήδη'
      });
    }

    // Create driver
    const driver = await Driver.create({
      name,
      email,
      password,
      phone,
      status: 'pending',
      isApproved: false,
      isOnline: false,
      isEmailVerified: process.env.NODE_ENV === 'development' // Auto-verify in development
    });

    // Send verification email (only in production)
    if (process.env.NODE_ENV === 'production') {
      const verificationToken = generateVerificationToken();
      driver.emailVerificationToken = verificationToken;
      driver.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
      await driver.save();
      
      await sendVerificationEmail(email, name, verificationToken, 'driver');
    }

    // Notify all admins about new driver registration
    const io = req.app.get('io');
    if (io) {
      io.to('admin').emit('driver:registered', {
        driverId: driver._id,
        name: driver.name,
        message: `Νέος οδηγός: ${driver.name}`
      });
    }

    res.status(201).json({ success: true, message: 'Η αίτηση εγγραφής σας υποβλήθηκε. Αναμένετε έγκριση.', driver });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Register a new customer
// @route   POST /api/v1/auth/customer/register
// @access  Public
exports.registerCustomer = async (req, res, next) => {
  try {
    const { name, email, password, phone, address, location } = req.body;

    // Check if customer exists
    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'Το email χρησιμοποιείται ήδη'
      });
    }

    // Create customer
    const customer = await Customer.create({
      name,
      email,
      password,
      phone,
      address,
      location, // GeoJSON Point
      isEmailVerified: process.env.NODE_ENV === 'development' // Auto-verify in development
    });

    // Send verification email (only in production)
    if (process.env.NODE_ENV === 'production') {
      const verificationToken = generateVerificationToken();
      customer.emailVerificationToken = verificationToken;
      customer.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
      await customer.save();
      
      await sendVerificationEmail(email, name, verificationToken, 'customer');
      
      return res.status(201).json({
        success: true,
        message: 'Η εγγραφή σας ολοκληρώθηκε! Ελέγξτε το email σας για επιβεβαίωση.',
        needsVerification: true
      });
    }

    // Create token
    const token = generateToken(customer._id, 'customer');

    res.status(201).json({
      success: true,
      message: 'Η εγγραφή σας ολοκληρώθηκε με επιτυχία!',
      token,
      user: {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        location: customer.location,
        role: 'customer'
      }
    });
  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Το email χρησιμοποιείται ήδη'
      });
    }
    res.status(400).json({ success: false, message: 'Κάτι πήγε στραβά. ' + error.message });
  }
};

// @desc    Get store types (public - for registration)
// @route   GET /api/v1/auth/store-types
// @access  Public
exports.getStoreTypes = async (req, res) => {
  try {
    const Settings = require('../models/Settings');
    const settings = await Settings.getSettings();
    
    res.json({
      success: true,
      storeTypes: settings.storeTypes || ['Mini Market', 'Φαρμακείο', 'Ταβέρνα', 'Καφετέρια', 'Γλυκά', 'Άλλο']
    });
  } catch (error) {
    console.error('Get store types error:', error);
    // Return default types on error
    res.json({
      success: true,
      storeTypes: ['Mini Market', 'Φαρμακείο', 'Ταβέρνα', 'Καφετέρια', 'Γλυκά', 'Άλλο']
    });
  }
};

// ==================== EMAIL VERIFICATION ====================

// @desc    Verify email with token
// @route   GET /api/v1/auth/verify-email
// @access  Public
exports.verifyEmail = async (req, res) => {
  try {
    const { token, type } = req.query;

    if (!token || !type) {
      return res.status(400).json({
        success: false,
        message: 'Token και τύπος χρήστη είναι απαραίτητα'
      });
    }

    // Find user by token
    let Model;
    switch (type) {
      case 'customer':
        Model = Customer;
        break;
      case 'store':
        Model = Store;
        break;
      case 'driver':
        Model = Driver;
        break;
      default:
        return res.status(400).json({ success: false, message: 'Μη έγκυρος τύπος χρήστη' });
    }

    const user = await Model.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Το link επιβεβαίωσης είναι άκυρο ή έχει λήξει'
      });
    }

    // Verify email
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    res.json({
      success: true,
      message: 'Το email επιβεβαιώθηκε επιτυχώς! Μπορείτε να συνδεθείτε.'
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({
      success: false,
      message: 'Σφάλμα επιβεβαίωσης email'
    });
  }
};

// @desc    Resend verification email
// @route   POST /api/v1/auth/resend-verification
// @access  Public
exports.resendVerification = async (req, res) => {
  try {
    const { email, type } = req.body;

    if (!email || !type) {
      return res.status(400).json({
        success: false,
        message: 'Email και τύπος χρήστη είναι απαραίτητα'
      });
    }

    // Find user
    let Model;
    let nameField;
    switch (type) {
      case 'customer':
        Model = Customer;
        nameField = 'name';
        break;
      case 'store':
        Model = Store;
        nameField = 'businessName';
        break;
      case 'driver':
        Model = Driver;
        nameField = 'name';
        break;
      default:
        return res.status(400).json({ success: false, message: 'Μη έγκυρος τύπος χρήστη' });
    }

    const user = await Model.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Δεν βρέθηκε χρήστης με αυτό το email'
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Το email έχει ήδη επιβεβαιωθεί'
      });
    }

    // Generate new token
    const verificationToken = generateVerificationToken();
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();

    // Send email
    await sendVerificationEmail(email, user[nameField], verificationToken, type);

    res.json({
      success: true,
      message: 'Το email επιβεβαίωσης στάλθηκε ξανά'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Σφάλμα αποστολής email'
    });
  }
};

// @desc    Request password reset
// @route   POST /api/v1/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email, type } = req.body;

    if (!email || !type) {
      return res.status(400).json({
        success: false,
        message: 'Email και τύπος χρήστη είναι απαραίτητα'
      });
    }

    // Find user
    let Model;
    let nameField;
    switch (type) {
      case 'customer':
        Model = Customer;
        nameField = 'name';
        break;
      case 'store':
        Model = Store;
        nameField = 'businessName';
        break;
      case 'driver':
        Model = Driver;
        nameField = 'name';
        break;
      default:
        return res.status(400).json({ success: false, message: 'Μη έγκυρος τύπος χρήστη' });
    }

    const user = await Model.findOne({ email });

    if (!user) {
      // Don't reveal if email exists
      return res.json({
        success: true,
        message: 'Αν το email υπάρχει, θα λάβετε οδηγίες επαναφοράς κωδικού'
      });
    }

    // Generate reset token
    const resetToken = generateVerificationToken();
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    // Send email
    await sendPasswordResetEmail(email, user[nameField], resetToken, type);

    res.json({
      success: true,
      message: 'Αν το email υπάρχει, θα λάβετε οδηγίες επαναφοράς κωδικού'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Σφάλμα αποστολής email'
    });
  }
};

// @desc    Reset password with token
// @route   POST /api/v1/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { token, type, password } = req.body;

    if (!token || !type || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token, τύπος χρήστη και νέος κωδικός είναι απαραίτητα'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Ο κωδικός πρέπει να είναι τουλάχιστον 6 χαρακτήρες'
      });
    }

    // Find user by token
    let Model;
    switch (type) {
      case 'customer':
        Model = Customer;
        break;
      case 'store':
        Model = Store;
        break;
      case 'driver':
        Model = Driver;
        break;
      default:
        return res.status(400).json({ success: false, message: 'Μη έγκυρος τύπος χρήστη' });
    }

    const user = await Model.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Το link επαναφοράς κωδικού είναι άκυρο ή έχει λήξει'
      });
    }

    // Update password
    user.password = password; // Will be hashed by pre-save hook
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    res.json({
      success: true,
      message: 'Ο κωδικός άλλαξε επιτυχώς! Μπορείτε να συνδεθείτε.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Σφάλμα επαναφοράς κωδικού'
    });
  }
};
