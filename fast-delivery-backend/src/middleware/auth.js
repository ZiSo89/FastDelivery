const { verifyToken } = require('../utils/jwt');
const Store = require('../models/Store');
const Driver = require('../models/Driver');
const Admin = require('../models/Admin');
const Customer = require('../models/Customer');

// Protect routes - verify JWT
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Μη εξουσιοδοτημένη πρόσβαση. Παρακαλώ συνδεθείτε.'
      });
    }

    // Verify token
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Μη έγκυρο token. Παρακαλώ συνδεθείτε ξανά.'
      });
    }

    // Find user based on role
    let user;
    switch (decoded.role) {
      case 'store':
        user = await Store.findById(decoded.id);
        break;
      case 'driver':
        user = await Driver.findById(decoded.id);
        break;
      case 'admin':
        user = await Admin.findById(decoded.id);
        break;
      case 'customer':
        user = await Customer.findById(decoded.id);
        break;
      default:
        return res.status(401).json({
          success: false,
          message: 'Άγνωστος ρόλος χρήστη'
        });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Ο χρήστης δεν βρέθηκε'
      });
    }

    // NOTE: Removed global isApproved check - each endpoint will check this individually
    // This allows unapproved users to still access their profile and see approval status

    // Attach user and role to request
    req.user = user;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Σφάλμα επαλήθευσης'
    });
  }
};

// Authorize specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Δεν έχετε δικαίωμα πρόσβασης σε αυτόν τον πόρο'
      });
    }
    next();
  };
};
