const Order = require('../models/Order');
const Store = require('../models/Store');

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
      order._updatedBy = 'store';
      await order.save();

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

      // Notify customer
      io.emit('order:rejected_store', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        customerPhone: order.customer.phone
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

    // Notify admin
    const io = req.app.get('io');
    io.emit('order:pending_admin', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      productPrice: order.productPrice
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

    // Notify customer and driver
    const io = req.app.get('io');
    io.to(`order:${order._id}`).emit('order:status_changed', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      newStatus: status
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
    const { workingHours, serviceAreas, phone } = req.body;

    const store = await Store.findById(req.user._id);

    if (workingHours) store.workingHours = workingHours;
    if (serviceAreas) store.serviceAreas = serviceAreas;
    if (phone) store.phone = phone;

    await store.save();

    res.json({
      success: true,
      message: 'Το προφίλ ενημερώθηκε.',
      store: {
        _id: store._id,
        businessName: store.businessName,
        workingHours: store.workingHours,
        serviceAreas: store.serviceAreas,
        phone: store.phone
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
