const Store = require('../models/Store');
const Order = require('../models/Order');
const User = require('../models/User');
const multer = require('multer');
const { uploadToFirebase } = require('../config/firebase');
const { broadcastOrderEvent } = require('../utils/socketHelpers');

// Multer config για voice files (in-memory storage)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Μόνο ηχητικά αρχεία επιτρέπονται'), false);
    }
  }
});

// @desc    Get all stores (for customer)
// @route   GET /api/v1/stores
// @access  Public
exports.getStores = async (req, res) => {
  try {
    const { serviceArea, storeType } = req.query;

    const filter = { status: 'approved', isApproved: true };

    // Filter by service area (partial match)
    if (serviceArea) {
      filter.serviceAreas = new RegExp(serviceArea, 'i');
    }

    // Filter by store type
    if (storeType) {
      filter.storeType = storeType;
    }

    const stores = await Store.find(filter).select('-password');

    res.json({
      success: true,
      count: stores.length,
      stores: stores.map(store => ({
        _id: store._id,
        businessName: store.businessName,
        storeType: store.storeType,
        address: store.address,
        workingHours: store.workingHours,
        serviceAreas: store.serviceAreas,
        location: store.location
      }))
    });
  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({
      success: false,
      message: 'Σφάλμα ανάκτησης καταστημάτων'
    });
  }
};

// @desc    Create order (guest checkout)
// @route   POST /api/v1/orders
// @access  Public
exports.createOrder = async (req, res) => {
  try {
    const { customer, storeId, orderType, orderContent } = req.body;

    // Validation
    if (!customer?.name || !customer?.phone || !customer?.address) {
      return res.status(400).json({
        success: false,
        message: 'Παρακαλώ συμπληρώστε όλα τα στοιχεία πελάτη'
      });
    }

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Παρακαλώ επιλέξτε κατάστημα'
      });
    }

    // Check if store exists and is approved
    const store = await Store.findById(storeId);
    if (!store || !store.isApproved) {
      return res.status(404).json({
        success: false,
        message: 'Το κατάστημα δεν βρέθηκε ή δεν είναι ενεργό'
      });
    }

    // Create or find user (guest)
    let user = await User.findOne({ phone: customer.phone });
    if (!user) {
      user = await User.create({
        name: customer.name,
        phone: customer.phone
      });
    }

    // Handle voice order
    let orderVoiceUrl = null;
    if (orderType === 'voice' && req.file) {
      orderVoiceUrl = await uploadToFirebase(req.file, 'orders/voice');
    }

    // Create order
    const order = await Order.create({
      customer: {
        name: customer.name,
        phone: customer.phone,
        address: customer.address
      },
      storeId,
      storeName: store.businessName,
      orderType,
      orderContent: orderType === 'text' ? orderContent : '',
      orderVoiceUrl,
      status: 'pending_store'
    });

    // Broadcast new order to everyone
    const io = req.app.get('io');
    broadcastOrderEvent(io, order, 'order:new', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      storeName: order.storeName,
      customer: order.customer,
      orderType: order.orderType,
      orderContent: order.orderContent,
      orderVoiceUrl: order.orderVoiceUrl
    });

    res.status(201).json({
      success: true,
      message: 'Η παραγγελία σας υποβλήθηκε επιτυχώς!',
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        customer: order.customer,
        storeName: order.storeName,
        createdAt: order.createdAt
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Σφάλμα δημιουργίας παραγγελίας'
    });
  }
};

// @desc    Get order status (by orderNumber - guest access)
// @route   GET /api/v1/orders/:orderNumber/status
// @access  Public
exports.getOrderStatus = async (req, res) => {
  try {
    const { orderNumber } = req.params;

    const order = await Order.findOne({ orderNumber })
      .populate('storeId', 'businessName phone')
      .populate('driverId', 'name phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Η παραγγελία δεν βρέθηκε'
      });
    }

    res.json({
      success: true,
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        customer: order.customer,
        storeName: order.storeName,
        productPrice: order.productPrice,
        deliveryFee: order.deliveryFee,
        totalPrice: order.totalPrice,
        driverName: order.driverName,
        statusHistory: order.statusHistory,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      }
    });
  } catch (error) {
    console.error('Get order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Σφάλμα ανάκτησης παραγγελίας'
    });
  }
};

// @desc    Confirm/Cancel order price (customer)
// @route   PUT /api/v1/orders/:orderId/confirm
// @access  Public (requires phone verification)
exports.confirmOrderPrice = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { phone, confirm } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Η παραγγελία δεν βρέθηκε'
      });
    }

    // Verify phone
    if (order.customer.phone !== phone) {
      return res.status(403).json({
        success: false,
        message: 'Μη εξουσιοδοτημένη πρόσβαση'
      });
    }

    // Check status
    if (order.status !== 'pending_customer_confirm') {
      return res.status(400).json({
        success: false,
        message: 'Η παραγγελία δεν αναμένει επιβεβαίωση'
      });
    }

    const io = req.app.get('io');

    if (confirm) {
      // Customer confirmed
      order.status = 'confirmed';
      order.confirmedAt = new Date();
      await order.save();

      // Notify admin
      io.emit('order:confirmed', {
        orderId: order._id,
        orderNumber: order.orderNumber
      });

      res.json({
        success: true,
        message: 'Η παραγγελία σας επιβεβαιώθηκε!',
        order: {
          orderNumber: order.orderNumber,
          status: order.status,
          totalPrice: order.totalPrice
        }
      });
    } else {
      // Customer cancelled
      order.status = 'cancelled';
      await order.save();

      // Broadcast cancellation to everyone
      broadcastOrderEvent(io, order, 'order:cancelled', {
        orderId: order._id,
        orderNumber: order.orderNumber
      });

      res.json({
        success: true,
        message: 'Η παραγγελία ακυρώθηκε.',
        order: {
          orderNumber: order.orderNumber,
          status: order.status
        }
      });
    }
  } catch (error) {
    console.error('Confirm order error:', error);
    res.status(500).json({
      success: false,
      message: 'Σφάλμα επιβεβαίωσης παραγγελίας'
    });
  }
};

exports.uploadVoice = upload.single('voiceFile');
