const Store = require('../models/Store');
const Driver = require('../models/Driver');
const Order = require('../models/Order');
const User = require('../models/User');
const Customer = require('../models/Customer');
const { broadcastOrderEvent } = require('../utils/socketHelpers');

// @desc    Get all stores
// @route   GET /api/v1/admin/stores
// @access  Private (Admin)
exports.getStores = async (req, res) => {
  try {
    const { status } = req.query;

    const filter = {};
    if (status) {
      filter.status = status;
    }

    const stores = await Store.find(filter).select('-password').sort({ createdAt: -1 });

    res.json({
      success: true,
      count: stores.length,
      stores
    });
  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({
      success: false,
      message: 'Σφάλμα ανάκτησης καταστημάτων'
    });
  }
};

// @desc    Approve/Reject/Pending store
// @route   PUT /api/v1/admin/stores/:storeId/approve
// @access  Private (Admin)
exports.approveRejectStore = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { action } = req.body; // 'approve', 'reject', or 'pending'

    const store = await Store.findById(storeId);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Το κατάστημα δεν βρέθηκε'
      });
    }

    if (action === 'approve') {
      store.status = 'approved';
      store.isApproved = true;
    } else if (action === 'reject') {
      store.status = 'rejected';
      store.isApproved = false;
    } else if (action === 'pending') {
      store.status = 'pending';
      store.isApproved = false;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Μη έγκυρη ενέργεια'
      });
    }

    await store.save();

    // Broadcast store approval/rejection to the store
    const io = req.app.get('io');
    if (io) {
      io.to(`store:${store._id}`).emit('store:status_changed', {
        status: store.status,
        isApproved: store.isApproved,
        message: `Το κατάστημά σας ${action === 'approve' ? 'εγκρίθηκε' : 'απορρίφθηκε'}.`
      });
    }

    const actionMessages = {
      approve: 'εγκρίθηκε',
      reject: 'απορρίφθηκε',
      pending: 'τέθηκε σε αναμονή'
    };

    res.json({
      success: true,
      message: `Το κατάστημα ${actionMessages[action]}.`,
      store: {
        _id: store._id,
        businessName: store.businessName,
        status: store.status,
        isApproved: store.isApproved
      }
    });
  } catch (error) {
    console.error('Approve/Reject store error:', error);
    res.status(500).json({
      success: false,
      message: 'Σφάλμα επεξεργασίας καταστήματος'
    });
  }
};

// @desc    Get all drivers
// @route   GET /api/v1/admin/drivers
// @access  Private (Admin)
exports.getDrivers = async (req, res) => {
  try {
    const { status, isOnline } = req.query;

    const filter = {};
    if (status) {
      filter.status = status;
    }
    if (isOnline !== undefined) {
      filter.isOnline = isOnline === 'true';
    }

    const drivers = await Driver.find(filter)
      .select('-password')
      .populate('currentOrder', 'orderNumber status')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: drivers.length,
      drivers
    });
  } catch (error) {
    console.error('Get drivers error:', error);
    res.status(500).json({
      success: false,
      message: 'Σφάλμα ανάκτησης διανομέων'
    });
  }
};

// @desc    Approve/Reject/Pending driver
// @route   PUT /api/v1/admin/drivers/:driverId/approve
// @access  Private (Admin)
exports.approveRejectDriver = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { action } = req.body; // 'approve', 'reject', or 'pending'

    const driver = await Driver.findById(driverId);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Ο διανομέας δεν βρέθηκε'
      });
    }

    if (action === 'approve') {
      driver.status = 'approved';
      driver.isApproved = true;
    } else if (action === 'reject') {
      driver.status = 'rejected';
      driver.isApproved = false;
    } else if (action === 'pending') {
      driver.status = 'pending';
      driver.isApproved = false;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Μη έγκυρη ενέργεια'
      });
    }

    await driver.save();

    // Broadcast driver approval/rejection to the driver
    const io = req.app.get('io');
    if (io) {
      io.to(`driver:${driver._id}`).emit('driver:status_changed', {
        status: driver.status,
        isApproved: driver.isApproved,
        message: `Η εγγραφή σας ${action === 'approve' ? 'εγκρίθηκε' : 'απορρίφθηκε'}.`
      });
    }

    const actionMessages = {
      approve: 'εγκρίθηκε',
      reject: 'απορρίφθηκε',
      pending: 'τέθηκε σε αναμονή'
    };

    res.json({
      success: true,
      message: `Ο διανομέας ${actionMessages[action]}.`,
      driver: {
        _id: driver._id,
        name: driver.name,
        status: driver.status,
        isApproved: driver.isApproved
      }
    });
  } catch (error) {
    console.error('Approve/Reject driver error:', error);
    res.status(500).json({
      success: false,
      message: 'Σφάλμα επεξεργασίας διανομέα'
    });
  }
};

// @desc    Get all orders
// @route   GET /api/v1/admin/orders
// @access  Private (Admin)
exports.getOrders = async (req, res) => {
  try {
    const { status, limit = 20, page = 1 } = req.query;

    const filter = {};
    if (status) {
      filter.status = status;
    }

    const orders = await Order.find(filter)
      .populate('storeId', 'businessName phone address')
      .populate('driverId', 'name phone isOnline')
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
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Σφάλμα ανάκτησης παραγγελιών'
    });
  }
};

// @desc    Add delivery fee to order
// @route   PUT /api/v1/admin/orders/:orderId/delivery-fee
// @access  Private (Admin)
exports.addDeliveryFee = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryFee } = req.body;

    if (!deliveryFee || deliveryFee < 0) {
      return res.status(400).json({
        success: false,
        message: 'Παρακαλώ εισάγετε έγκυρο κόστος αποστολής'
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Η παραγγελία δεν βρέθηκε'
      });
    }

    if (order.status !== 'pending_admin') {
      return res.status(400).json({
        success: false,
        message: 'Η παραγγελία δεν αναμένει κόστος αποστολής'
      });
    }

    order.deliveryFee = parseFloat(deliveryFee);
    order.totalPrice = order.productPrice + order.deliveryFee;
    order.status = 'pending_customer_confirm';
    order._updatedBy = 'admin';
    await order.save();

    // Broadcast to everyone
    const io = req.app.get('io');
    broadcastOrderEvent(io, order, 'order:price_ready', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      customerPhone: order.customer.phone,
      totalPrice: order.totalPrice,
      newStatus: 'pending_customer_confirm',
      breakdown: {
        productPrice: order.productPrice,
        deliveryFee: order.deliveryFee
      }
    });

    res.json({
      success: true,
      message: 'Το κόστος αποστολής προστέθηκε. Αναμονή επιβεβαίωσης πελάτη.',
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        productPrice: order.productPrice,
        deliveryFee: order.deliveryFee,
        totalPrice: order.totalPrice
      }
    });
  } catch (error) {
    console.error('Add delivery fee error:', error);
    res.status(500).json({
      success: false,
      message: 'Σφάλμα προσθήκης κόστους αποστολής'
    });
  }
};

// @desc    Assign driver to order
// @route   PUT /api/v1/admin/orders/:orderId/assign-driver
// @access  Private (Admin)
exports.assignDriver = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { driverId } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Η παραγγελία δεν βρέθηκε'
      });
    }

    // Allow assignment for confirmed orders OR orders rejected by driver
    if (!['confirmed', 'rejected_driver'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Η παραγγελία δεν είναι έτοιμη για ανάθεση'
      });
    }

    const driver = await Driver.findById(driverId);

    if (!driver || !driver.isApproved) {
      return res.status(404).json({
        success: false,
        message: 'Ο διανομέας δεν βρέθηκε ή δεν είναι εγκεκριμένος'
      });
    }

    if (!driver.isOnline) {
      return res.status(400).json({
        success: false,
        message: 'Ο διανομέας δεν είναι online'
      });
    }

    if (driver.currentOrder) {
      return res.status(400).json({
        success: false,
        message: 'Ο διανομέας έχει ήδη ενεργή παραγγελία'
      });
    }

    order.driverId = driver._id;
    order.driverName = driver.name;
    order.status = 'assigned';
    order._updatedBy = 'admin';
    await order.save();

    // Broadcast to everyone
    const io = req.app.get('io');
    broadcastOrderEvent(io, order, 'order:assigned', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      storeId: order.storeId,
      driverId: order.driverId,
      driverName: driver.name,
      newStatus: 'assigned',
      pickup: {
        storeName: order.storeName,
        address: order.customer.address // Will add store address later
      },
      delivery: order.customer.address,
      totalPrice: order.totalPrice,
      deliveryFee: order.deliveryFee
    });

    res.json({
      success: true,
      message: `Η παραγγελία ανατέθηκε στον ${driver.name}.`,
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        driverId: driver._id,
        driverName: driver.name
      }
    });
  } catch (error) {
    console.error('Assign driver error:', error);
    res.status(500).json({
      success: false,
      message: 'Σφάλμα ανάθεσης διανομέα'
    });
  }
};

// @desc    Cancel order (admin only)
// @route   PUT /api/v1/admin/orders/:orderId/cancel
// @access  Private (Admin)
exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Η παραγγελία δεν βρέθηκε'
      });
    }

    if (order.status === 'completed' || order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Η παραγγελία έχει ήδη ολοκληρωθεί ή ακυρωθεί'
      });
    }

    // Free driver if assigned
    if (order.driverId) {
      await Driver.findByIdAndUpdate(order.driverId, { currentOrder: null });
    }

    order.status = 'cancelled';
    order._updatedBy = 'admin';
    await order.save();

    // Broadcast to everyone
    const io = req.app.get('io');
    broadcastOrderEvent(io, order, 'order:cancelled', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      reason
    });

    res.json({
      success: true,
      message: 'Η παραγγελία ακυρώθηκε.',
      order: {
        orderNumber: order.orderNumber,
        status: order.status
      }
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Σφάλμα ακύρωσης παραγγελίας'
    });
  }
};

// @desc    Get all customers
// @route   GET /api/v1/admin/customers
// @access  Private (Admin)
exports.getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().select('-password').sort({ createdAt: -1 });

    // Get order count for each customer
    const customersWithOrders = await Promise.all(
      customers.map(async (customer) => {
        const orderCount = await Order.countDocuments({
          'customer.phone': customer.phone
        });
        return {
          ...customer.toObject(),
          totalOrders: orderCount
        };
      })
    );

    res.json({
      success: true,
      count: customersWithOrders.length,
      customers: customersWithOrders
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Σφάλμα ανάκτησης πελατών'
    });
  }
};

// @desc    Deactivate customer
// @route   PUT /api/v1/admin/customers/:customerId/deactivate
// @access  Private (Admin)
exports.deactivateCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Ο πελάτης δεν βρέθηκε'
      });
    }

    customer.isActive = false;
    await customer.save();

    res.json({
      success: true,
      message: 'Ο πελάτης απενεργοποιήθηκε.',
      customer: {
        _id: customer._id,
        isActive: customer.isActive
      }
    });
  } catch (error) {
    console.error('Deactivate customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Σφάλμα απενεργοποίησης πελάτη'
    });
  }
};

// @desc    Get dashboard stats
// @route   GET /api/v1/admin/stats
// @access  Private (Admin)
exports.getStats = async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;

    switch (period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    // Total orders
    const totalOrders = await Order.countDocuments();

    // Orders by status
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const statusObj = {};
    ordersByStatus.forEach(item => {
      statusObj[item._id] = item.count;
    });

    // Total revenue (delivery fees only)
    const revenueData = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$deliveryFee' } } }
    ]);

    const totalRevenue = revenueData[0]?.total || 0;

    // Active stores and drivers
    const activeStores = await Store.countDocuments({ status: 'approved', isApproved: true });
    const activeDrivers = await Driver.countDocuments({ status: 'approved', isApproved: true });

    // Orders in period
    const ordersInPeriod = await Order.countDocuments({
      createdAt: { $gte: startDate }
    });

    // Today's orders
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const ordersToday = await Order.countDocuments({
      createdAt: { $gte: todayStart }
    });

    // This week's orders
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const ordersThisWeek = await Order.countDocuments({
      createdAt: { $gte: weekStart }
    });

    // This month's orders
    const monthStart = new Date();
    monthStart.setMonth(monthStart.getMonth() - 1);
    const ordersThisMonth = await Order.countDocuments({
      createdAt: { $gte: monthStart }
    });

    res.json({
      success: true,
      stats: {
        totalOrders,
        ordersByStatus: statusObj,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        activeStores,
        activeDrivers,
        ordersToday,
        ordersThisWeek,
        ordersThisMonth,
        ordersInPeriod
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Σφάλμα ανάκτησης στατιστικών'
    });
  }
};
