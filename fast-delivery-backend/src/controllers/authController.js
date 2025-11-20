const Store = require('../models/Store');
const Driver = require('../models/Driver');
const Admin = require('../models/Admin');
const Customer = require('../models/Customer');
const jwt = require('jsonwebtoken');
const { generateToken } = require('../utils/jwt');

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
        message: 'Λάθος email ή κωδικός'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Μη έγκυρα διαπιστευτήρια' });
    }

    // For Store and Driver, check if they are approved
    if ((role === 'store' || role === 'driver') && !user.isApproved) {
        return res.status(401).json({ success: false, message: 'Ο λογαριασμός σας αναμένει έγκριση από διαχειριστή.' });
    }

    const token = generateToken(user._id, user.role || role);

    // Prepare user object for response
    const userResponse = {
        _id: user._id,
        email: user.email,
        role: user.role || role,
        name: user.name || user.businessName,
        phone: user.phone,
        address: user.address
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
      serviceAreas,
      status: 'pending',
      isApproved: false
    });

    // Notify all admins about new store registration
    const io = req.app.get('io');
    if (io) {
      io.emit('store:registered', {
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
      isOnline: false
    });

    // Notify all admins about new driver registration
    const io = req.app.get('io');
    if (io) {
      io.emit('driver:registered', {
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
    const { name, email, password, phone, address } = req.body;

    // Create customer
    const customer = await Customer.create({
      name,
      email,
      password,
      phone,
      address
    });

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
        role: 'customer'
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Κάτι πήγε στραβά. ' + error.message });
  }
};
