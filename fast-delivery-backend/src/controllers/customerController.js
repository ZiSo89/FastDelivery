const Store = require('../models/Store');
const Order = require('../models/Order');
const User = require('../models/User');
const Customer = require('../models/Customer'); // Import Customer model
const Settings = require('../models/Settings'); // Import Settings model
const multer = require('multer');
const { uploadToFirebase } = require('../config/firebase');
const { broadcastOrderEvent } = require('../utils/socketHelpers');
const { geocodeAddress, toGeoJSONPoint } = require('../utils/geocoding');

// Helper function to check if service is open
const isServiceOpen = (settings) => {
  if (!settings.serviceHoursEnabled) {
    return { isOpen: true };
  }
  
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute; // Convert to minutes
  
  const [startHour, startMinute] = settings.serviceHoursStart.split(':').map(Number);
  const [endHour, endMinute] = settings.serviceHoursEnd.split(':').map(Number);
  
  const startTime = startHour * 60 + startMinute;
  const endTime = endHour * 60 + endMinute;
  
  // Handle overnight hours (e.g., 22:00 - 02:00)
  let isOpen;
  if (endTime > startTime) {
    // Normal hours (e.g., 09:00 - 23:00)
    isOpen = currentTime >= startTime && currentTime < endTime;
  } else {
    // Overnight hours (e.g., 22:00 - 02:00)
    isOpen = currentTime >= startTime || currentTime < endTime;
  }
  
  return {
    isOpen,
    serviceHoursStart: settings.serviceHoursStart,
    serviceHoursEnd: settings.serviceHoursEnd
  };
};

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

    // Only show approved stores to customers
    const filter = { 
      isApproved: true,
      status: 'approved'
    };

    // Filter by service area (partial match)
    if (serviceArea) {
      filter.serviceAreas = new RegExp(serviceArea, 'i');
    }

    // Filter by store type
    if (storeType) {
      filter.storeType = storeType;
    }

    // Get ALL approved stores - no geo filter (worldwide support)
    const stores = await Store.find(filter).select('-password');

    res.json({
      success: true,
      count: stores.length,
      stores: stores.map(store => ({
        _id: store._id,
        businessName: store.businessName,
        storeType: store.storeType,
        address: store.address,
        phone: store.phone,
        description: store.description,
        workingHours: store.workingHours,
        serviceAreas: store.serviceAreas,
        location: store.location,
        image: store.image || 'https://via.placeholder.com/150' // Add placeholder if no image
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

// @desc    Get service status (open/closed)
// @route   GET /api/v1/orders/service-status
// @access  Public
exports.getServiceStatus = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const serviceStatus = isServiceOpen(settings);
    
    res.json({
      success: true,
      ...serviceStatus,
      serviceHoursEnabled: settings.serviceHoursEnabled
    });
  } catch (error) {
    console.error('Get service status error:', error);
    res.status(500).json({
      success: false,
      message: 'Σφάλμα ελέγχου κατάστασης υπηρεσίας'
    });
  }
};

// @desc    Create order (guest checkout)
// @route   POST /api/v1/orders
// @access  Public
exports.createOrder = async (req, res) => {
  try {
    let { customer, storeId, orderType, orderContent } = req.body;

    // Check service hours first
    const settings = await Settings.getSettings();
    const serviceStatus = isServiceOpen(settings);
    
    if (!serviceStatus.isOpen) {
      return res.status(403).json({
        success: false,
        message: `Η υπηρεσία είναι κλειστή. Ώρες λειτουργίας: ${serviceStatus.serviceHoursStart} - ${serviceStatus.serviceHoursEnd}`,
        serviceHoursStart: serviceStatus.serviceHoursStart,
        serviceHoursEnd: serviceStatus.serviceHoursEnd,
        isServiceClosed: true
      });
    }

    // Parse customer if it's a string (from FormData)
    if (typeof customer === 'string') {
      try {
        customer = JSON.parse(customer);
      } catch (e) {
        console.error('JSON parse error for customer:', e);
        return res.status(400).json({ success: false, message: 'Μη έγκυρα δεδομένα πελάτη' });
      }
    }

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

    // Geocode customer address for map display
    let deliveryLocation = { type: 'Point', coordinates: [0, 0] };
    try {
      const coords = await geocodeAddress(customer.address);
      if (coords) {
        deliveryLocation = toGeoJSONPoint(coords.lat, coords.lng);
      }
    } catch (geoError) {
      console.warn('⚠️ Geocoding failed, order will be created without coordinates:', geoError.message);
    }

    // Create order
    const order = await Order.create({
      customer: {
        name: customer.name,
        phone: customer.phone,
        email: customer.email, // Save email if provided
        address: customer.address
      },
      deliveryLocation,
      storeId,
      storeName: store.businessName,
      orderType,
      orderContent: orderContent || '',
      orderVoiceUrl,
      status: 'pending_store'
    });

    // Broadcast new order to specific store and admins only (NOT to drivers)
    const io = req.app.get('io');
    if (io) {
      const orderData = {
        orderId: order._id,
        orderNumber: order.orderNumber,
        storeId: order.storeId?.toString(),
        storeName: order.storeName,
        customer: order.customer,
        orderType: order.orderType,
        orderContent: order.orderContent,
        orderVoiceUrl: order.orderVoiceUrl,
        status: order.status
      };

      // Send to specific store only
      io.to(`store:${order.storeId}`).emit('order:new', orderData);
      
      // Send to all admins
      io.to('admin').emit('order:new', orderData);
    }

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
      .populate('storeId', 'businessName phone address location')
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
        deliveryLocation: order.deliveryLocation, // Include delivery coordinates for map
        storeId: order.storeId, // Include populated store data with location
        storeName: order.storeName,
        orderType: order.orderType,
        orderContent: order.orderContent,
        orderVoiceUrl: order.orderVoiceUrl,
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

      // Use broadcastOrderEvent to notify all parties AND send push notification
      broadcastOrderEvent(io, order, 'order:status_changed', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        storeId: order.storeId?.toString(),
        newStatus: 'confirmed'
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
        orderNumber: order.orderNumber,
        storeId: order.storeId?.toString(),
        driverId: order.driverId?.toString(),
        newStatus: 'cancelled'
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

// @desc    Get my orders (logged in customer)
// @route   GET /api/v1/orders/my-orders
// @access  Private (Customer)
exports.getMyOrders = async (req, res) => {
  try {
    // Strict check: Find orders where BOTH customer.phone matches user's phone AND customer.email matches user's email
    // This ensures users only see their own orders and prevents phone number spoofing/collisions
    
    if (!req.user.phone || !req.user.email) {
       return res.status(400).json({
        success: false,
        message: 'Λείπουν στοιχεία ταυτοποίησης (τηλέφωνο ή email) από το προφίλ σας'
      });
    }

    const { page, limit } = req.query;
    
    const query = {
      'customer.phone': new RegExp(`^${req.user.phone.trim()}$`)
    };

    // Pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10; // Default 10 for mobile/web customers
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const totalCount = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limitNum);

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('storeId', 'businessName image');

    res.json({
      success: true,
      count: orders.length,
      totalCount,
      totalPages,
      currentPage: pageNum,
      hasMore: pageNum < totalPages,
      orders
    });
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Σφάλμα ανάκτησης ιστορικού παραγγελιών'
    });
  }
};

// @desc    Get active order by phone
// @route   GET /api/v1/orders/active-by-phone/:phone
// @access  Public
exports.getActiveOrderByPhone = async (req, res) => {
  try {
    const { phone } = req.params;

    // Find the most recent active order
    const order = await Order.findOne({
      'customer.phone': phone,
      status: { $nin: ['completed', 'cancelled', 'rejected_store', 'rejected_driver'] }
    })
    .sort({ createdAt: -1 })
    .populate('storeId', 'businessName');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Δεν βρέθηκε ενεργή παραγγελία με αυτό το τηλέφωνο'
      });
    }

    res.json({
      success: true,
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        storeName: order.storeName,
        createdAt: order.createdAt
      }
    });
  } catch (error) {
    console.error('Get active order by phone error:', error);
    res.status(500).json({
      success: false,
      message: 'Σφάλμα αναζήτησης'
    });
  }
};

// @desc    Update customer profile
// @route   PUT /api/v1/orders/profile
// @access  Private (Customer)
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, address, location, pushToken } = req.body;
    
    // Find customer by ID (from auth middleware)
    const customer = await Customer.findById(req.user._id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Ο χρήστης δεν βρέθηκε'
      });
    }

    // Update fields
    if (name) customer.name = name;
    if (phone) customer.phone = phone;
    if (address) customer.address = address;
    if (location) customer.location = location;
    if (pushToken) customer.pushToken = pushToken;

    await customer.save();

    res.json({
      success: true,
      message: 'Το προφίλ ενημερώθηκε επιτυχώς',
      user: {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        location: customer.location,
        pushToken: customer.pushToken,
        role: 'customer'
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Σφάλμα ενημέρωσης προφίλ'
    });
  }
};

exports.uploadVoice = upload.single('voiceFile');

// @desc    Delete customer account (soft delete)
// @route   DELETE /api/v1/orders/profile
// @access  Private (Customer)
exports.deleteAccount = async (req, res) => {
  try {
    // Find customer
    const customer = await Customer.findById(req.user._id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Ο χρήστης δεν βρέθηκε'
      });
    }

    // Soft delete: anonymize personal data but keep record
    const deletedId = customer._id.toString();
    customer.email = `deleted_${deletedId}@deleted.local`;
    customer.phone = '0000000000';
    customer.name = 'Διαγραμμένος Χρήστης';
    customer.address = 'Διαγραμμένη διεύθυνση';
    customer.location = { type: 'Point', coordinates: [0, 0] };
    customer.pushToken = null;
    customer.isActive = false;
    customer.isDeleted = true;
    customer.deletedAt = new Date();
    customer.password = await require('bcryptjs').hash(`deleted_${Date.now()}_${Math.random()}`, 10);

    await customer.save();

    res.json({
      success: true,
      message: 'Ο λογαριασμός σας διαγράφηκε επιτυχώς'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Σφάλμα διαγραφής λογαριασμού'
    });
  }
};
