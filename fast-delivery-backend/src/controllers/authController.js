const Store = require('../models/Store');
const Driver = require('../models/Driver');
const Admin = require('../models/Admin');
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
      default:
        return res.status(400).json({
          success: false,
          message: 'Μη έγκυρος ρόλος'
        });
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
      return res.status(401).json({
        success: false,
        message: 'Λάθος email ή κωδικός'
      });
    }

    // Check if approved (for store/driver)
    if ((role === 'store' || role === 'driver') && !user.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Ο λογαριασμός σας αναμένει έγκριση από διαχειριστή'
      });
    }

    // Generate token
    const token = generateToken(user._id, role);

    // Remove password from response
    user.password = undefined;

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        email: user.email,
        role,
        ...(role === 'store' && { 
          businessName: user.businessName,
          storeType: user.storeType,
          isApproved: user.isApproved
        }),
        ...(role === 'driver' && {
          name: user.name,
          isOnline: user.isOnline,
          isApproved: user.isApproved
        }),
        ...(role === 'admin' && {
          name: user.name
        })
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Σφάλμα σύνδεσης'
    });
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

// @desc    Register Driver
// @route   POST /api/v1/auth/driver/register
// @access  Public
exports.registerDriver = async (req, res) => {
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

    res.status(201).json({
      success: true,
      message: 'Η αίτηση εγγραφής σας υποβλήθηκε. Αναμένετε έγκριση.',
      driver: {
        _id: driver._id,
        name: driver.name,
        email: driver.email,
        status: driver.status
      }
    });
  } catch (error) {
    console.error('Driver registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Σφάλμα εγγραφής'
    });
  }
};
