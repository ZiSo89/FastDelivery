const Order = require('../models/Order');
const Store = require('../models/Store');
const { broadcastOrderEvent } = require('../utils/socketHelpers');

// @desc    Get single order by ID
// @route   GET /api/v1/store/orders/:orderId
// @access  Private (Store)
exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const storeId = req.user._id;

    const order = await Order.findOne({ _id: orderId, storeId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Η παραγγελία δεν βρέθηκε'
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Get order by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Σφάλμα ανάκτησης παραγγελίας'
    });
  }
};

// @desc    Get store orders
// @route   GET /api/v1/store/orders
// @access  Private (Store)
exports.getStoreOrders = async (req, res) => {
  try {
    const { status, limit = 20, page = 1 } = req.query;
    const storeId = req.user._id;

    const filter = { storeId };
    if (status) {
      filter.status = status;
    }

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      count: orders.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      orders
    });
  } catch (error) {
    console.error('Get store orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Σφάλμα ανάκτησης παραγγελιών'
    });
  }
};

// @desc    Accept/Reject order
// @route   PUT /api/v1/store/orders/:orderId/accept
// @access  Private (Store)
exports.acceptRejectOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { action } = req.body; // 'accept' or 'reject'
    const storeId = req.user._id;

    const order = await Order.findOne({ _id: orderId, storeId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Η παραγγελία δεν βρέθηκε'
      });
    }

    if (order.status !== 'pending_store') {
      return res.status(400).json({
        success: false,
        message: 'Η παραγγελία δεν αναμένει αποδοχή'
      });
    }

    const io = req.app.get('io');

    if (action === 'accept') {
      order.status = 'pricing';
      order.acceptedAt = new Date();
      order._updatedBy = 'store';
      await order.save();

      // Broadcast acceptance to everyone
      broadcastOrderEvent(io, order, 'order:status_changed', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        newStatus: 'pricing',
        storeId: order.storeId?.toString(),
        driverId: order.driverId?.toString()
      });

      res.json({
        success: true,
        message: 'Η παραγγελία έγινε αποδεκτή. Προσθέστε την τιμή προϊόντων.',
        order: {
          orderNumber: order.orderNumber,
          status: order.status
        }
      });
    } else if (action === 'reject') {
      order.status = 'rejected_store';
      order._updatedBy = 'store';
      await order.save();

      // Broadcast rejection to everyone
      broadcastOrderEvent(io, order, 'order:rejected_store', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        customerPhone: order.customer.phone,
        newStatus: 'rejected_store',
        storeId: order.storeId?.toString(),
        driverId: order.driverId?.toString()
      });

      res.json({
        success: true,
        message: 'Η παραγγελία απορρίφθηκε.',
        order: {
          orderNumber: order.orderNumber,
          status: order.status
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Μη έγκυρη ενέργεια'
      });
    }
  } catch (error) {
    console.error('Accept/Reject order error:', error);
    res.status(500).json({
      success: false,
      message: 'Σφάλμα επεξεργασίας παραγγελίας'
    });
  }
};

// @desc    Add product price
// @route   PUT /api/v1/store/orders/:orderId/price
// @access  Private (Store)
exports.addProductPrice = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { productPrice } = req.body;
    const storeId = req.user._id;

    if (!productPrice || productPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Παρακαλώ εισάγετε έγκυρη τιμή'
      });
    }

    const order = await Order.findOne({ _id: orderId, storeId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Η παραγγελία δεν βρέθηκε'
      });
    }

    if (order.status !== 'pricing') {
      return res.status(400).json({
        success: false,
        message: 'Η παραγγελία δεν αναμένει τιμολόγηση'
      });
    }

    order.productPrice = parseFloat(productPrice);
    order.status = 'pending_admin';
    order._updatedBy = 'store';
    await order.save();

    // Broadcast to everyone
    const io = req.app.get('io');
    broadcastOrderEvent(io, order, 'order:pending_admin', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      productPrice: order.productPrice,
      newStatus: 'pending_admin',
      storeId: order.storeId?.toString(),
      driverId: order.driverId?.toString()
    });

    res.json({
      success: true,
      message: 'Η τιμή καταχωρήθηκε. Αναμονή Admin για κόστος αποστολής.',
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        productPrice: order.productPrice
      }
    });
  } catch (error) {
    console.error('Add price error:', error);
    res.status(500).json({
      success: false,
      message: 'Σφάλμα προσθήκης τιμής'
    });
  }
};

// @desc    Update order status to 'preparing'
// @route   PUT /api/v1/store/orders/:orderId/status
// @access  Private (Store)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const storeId = req.user._id;

    const order = await Order.findOne({ _id: orderId, storeId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Η παραγγελία δεν βρέθηκε'
      });
    }

    // Store can only set to 'preparing'
    if (status !== 'preparing') {
      return res.status(400).json({
        success: false,
        message: 'Μη έγκυρη κατάσταση'
      });
    }

    if (order.status !== 'accepted_driver') {
      return res.status(400).json({
        success: false,
        message: 'Η παραγγελία δεν έχει αποδοχή από διανομέα'
      });
    }

    order.status = status;
    order._updatedBy = 'store';
    await order.save();

    // Broadcast to everyone (admin, driver, store)
    const io = req.app.get('io');
    broadcastOrderEvent(io, order, 'order:status_changed', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      newStatus: status,
      storeId: order.storeId?.toString(),
      driverId: order.driverId?.toString()
    });

    res.json({
      success: true,
      order: {
        orderNumber: order.orderNumber,
        status: order.status
      }
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Σφάλμα ενημέρωσης κατάστασης'
    });
  }
};

// @desc    Get store profile
// @route   GET /api/v1/store/profile
// @access  Private (Store)
exports.getStoreProfile = async (req, res) => {
  try {
    const store = await Store.findById(req.user._id).select('-password');

    res.json({
      success: true,
      store
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Σφάλμα ανάκτησης προφίλ'
    });
  }
};

// @desc    Update store profile
// @route   PUT /api/v1/store/profile
// @access  Private (Store)
exports.updateStoreProfile = async (req, res) => {
  try {
    const { businessName, storeType, afm, workingHours, serviceAreas, phone, description, address, location } = req.body;

    const store = await Store.findById(req.user._id);

    // Επιτρέπεται αλλαγή ονόματος, τύπου, ΑΦΜ
    if (businessName) store.businessName = businessName;
    if (storeType) store.storeType = storeType;
    if (afm) store.afm = afm;
    
    if (workingHours) store.workingHours = workingHours;
    if (serviceAreas) store.serviceAreas = serviceAreas;
    if (phone) store.phone = phone;
    if (description) store.description = description;
    if (address) store.address = address;
    if (location) store.location = location;

    await store.save();

    res.json({
      success: true,
      message: 'Το προφίλ ενημερώθηκε.',
      store: {
        _id: store._id,
        businessName: store.businessName,
        storeType: store.storeType,
        afm: store.afm,
        workingHours: store.workingHours,
        serviceAreas: store.serviceAreas,
        phone: store.phone,
        description: store.description,
        address: store.address,
        location: store.location
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

// @desc    Toggle store online/offline status
// @route   PUT /api/v1/store/online-status
// @access  Private (Store)
exports.toggleOnlineStatus = async (req, res) => {
  try {
    const { isOnline } = req.body;
    
    const store = await Store.findById(req.user._id);
    
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Το κατάστημα δεν βρέθηκε'
      });
    }
    
    store.isOnline = isOnline;
    await store.save();
    
    // Broadcast to all customers that store status changed
    const io = req.app.get('io');
    if (io) {
      io.emit('store:online_status_changed', {
        storeId: store._id.toString(),
        isOnline: store.isOnline,
        businessName: store.businessName
      });
      console.log(`📡 Broadcasted store online status: ${store.businessName} is now ${isOnline ? 'Online' : 'Offline'}`);
    }
    
    res.json({
      success: true,
      message: isOnline ? 'Το κατάστημα είναι Online' : 'Το κατάστημα είναι Offline',
      isOnline: store.isOnline
    });
  } catch (error) {
    console.error('Toggle online status error:', error);
    res.status(500).json({
      success: false,
      message: 'Σφάλμα αλλαγής κατάστασης'
    });
  }
};
