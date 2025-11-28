const Store = require('../models/Store');
const Driver = require('../models/Driver');
const Order = require('../models/Order');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Settings = require('../models/Settings');
const MonthlyExpense = require('../models/MonthlyExpense');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
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

// ==================== SETTINGS ====================

// @desc    Get settings
// @route   GET /api/v1/admin/settings
// @access  Private (Admin)
exports.getSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Σφάλμα ανάκτησης ρυθμίσεων'
    });
  }
};

// @desc    Update settings
// @route   PUT /api/v1/admin/settings
// @access  Private (Admin)
exports.updateSettings = async (req, res) => {
  try {
    const { driverSalary, defaultDeliveryFee, serviceArea, serviceHours } = req.body;
    
    const updates = {};
    if (driverSalary !== undefined) updates.driverSalary = driverSalary;
    if (defaultDeliveryFee !== undefined) updates.defaultDeliveryFee = defaultDeliveryFee;
    if (serviceArea) updates.serviceArea = serviceArea;
    if (serviceHours) updates.serviceHours = serviceHours;
    
    const settings = await Settings.updateSettings(updates);
    
    res.json({
      success: true,
      message: 'Οι ρυθμίσεις ενημερώθηκαν',
      settings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Σφάλμα ενημέρωσης ρυθμίσεων'
    });
  }
};

// @desc    Add store type
// @route   POST /api/v1/admin/settings/store-types
// @access  Private (Admin)
exports.addStoreType = async (req, res) => {
  try {
    const { storeType } = req.body;
    
    if (!storeType || storeType.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Ο τύπος καταστήματος είναι υποχρεωτικός'
      });
    }
    
    const settings = await Settings.getSettings();
    
    // Check if already exists
    if (settings.storeTypes.includes(storeType.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Αυτός ο τύπος καταστήματος υπάρχει ήδη'
      });
    }
    
    settings.storeTypes.push(storeType.trim());
    await settings.save();
    
    res.json({
      success: true,
      message: 'Ο τύπος καταστήματος προστέθηκε',
      storeTypes: settings.storeTypes
    });
  } catch (error) {
    console.error('Add store type error:', error);
    res.status(500).json({
      success: false,
      message: 'Σφάλμα προσθήκης τύπου καταστήματος'
    });
  }
};

// @desc    Delete store type
// @route   DELETE /api/v1/admin/settings/store-types/:storeType
// @access  Private (Admin)
exports.deleteStoreType = async (req, res) => {
  try {
    const { storeType } = req.params;
    
    // Check if any store uses this type
    const storesWithType = await Store.countDocuments({ storeType });
    
    if (storesWithType > 0) {
      return res.status(400).json({
        success: false,
        message: `Δεν μπορεί να διαγραφεί - ${storesWithType} καταστήματα χρησιμοποιούν αυτόν τον τύπο`
      });
    }
    
    const settings = await Settings.getSettings();
    settings.storeTypes = settings.storeTypes.filter(t => t !== storeType);
    await settings.save();
    
    res.json({
      success: true,
      message: 'Ο τύπος καταστήματος διαγράφηκε',
      storeTypes: settings.storeTypes
    });
  } catch (error) {
    console.error('Delete store type error:', error);
    res.status(500).json({
      success: false,
      message: 'Σφάλμα διαγραφής τύπου καταστήματος'
    });
  }
};

// ==================== MONTHLY EXPENSES ====================

// @desc    Get monthly expense
// @route   GET /api/v1/admin/expenses/:year/:month
// @access  Private (Admin)
exports.getMonthlyExpense = async (req, res) => {
  try {
    const { year, month } = req.params;
    const expense = await MonthlyExpense.getOrCreateForMonth(parseInt(year), parseInt(month));
    
    res.json({
      success: true,
      expense
    });
  } catch (error) {
    console.error('Get monthly expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Σφάλμα ανάκτησης εξόδων μήνα'
    });
  }
};

// @desc    Update monthly expense
// @route   PUT /api/v1/admin/expenses/:year/:month
// @access  Private (Admin)
exports.updateMonthlyExpense = async (req, res) => {
  try {
    const { year, month } = req.params;
    const { amount, notes } = req.body;
    
    const expense = await MonthlyExpense.updateForMonth(
      parseInt(year), 
      parseInt(month), 
      amount || 0, 
      notes || '',
      req.user._id
    );
    
    res.json({
      success: true,
      message: 'Τα έξοδα ενημερώθηκαν',
      expense
    });
  } catch (error) {
    console.error('Update monthly expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Σφάλμα ενημέρωσης εξόδων μήνα'
    });
  }
};

// ==================== EXTENDED STATISTICS ====================

// @desc    Get extended statistics with financial data
// @route   GET /api/v1/admin/stats/extended
// @access  Private (Admin)
exports.getExtendedStats = async (req, res) => {
  try {
    const { year, month } = req.query;
    const targetYear = parseInt(year) || new Date().getFullYear();
    const targetMonth = parseInt(month) || new Date().getMonth() + 1;
    
    // Get settings for driver salary
    const settings = await Settings.getSettings();
    const driverSalary = settings.driverSalary;
    
    // Get monthly expense
    const monthlyExpense = await MonthlyExpense.getOrCreateForMonth(targetYear, targetMonth);
    
    // Count approved drivers
    const approvedDrivers = await Driver.countDocuments({ status: 'approved', isApproved: true });
    
    // Calculate total salaries
    const totalSalaries = approvedDrivers * driverSalary;
    
    // Get revenue for the month
    const monthStart = new Date(targetYear, targetMonth - 1, 1);
    const monthEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59);
    
    const monthlyRevenue = await Order.aggregate([
      { 
        $match: { 
          status: 'completed',
          completedAt: { $gte: monthStart, $lte: monthEnd }
        } 
      },
      { $group: { _id: null, total: { $sum: '$deliveryFee' } } }
    ]);
    
    const revenue = monthlyRevenue[0]?.total || 0;
    
    // Calculate net result
    const netResult = revenue - totalSalaries - monthlyExpense.amount;
    
    // Get TODAY's revenue
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    const todayRevenue = await Order.aggregate([
      { 
        $match: { 
          status: 'completed',
          completedAt: { $gte: todayStart, $lte: todayEnd }
        } 
      },
      { $group: { _id: null, total: { $sum: '$deliveryFee' }, orders: { $sum: 1 } } }
    ]);
    
    const dailyRevenue = todayRevenue[0]?.total || 0;
    const dailyOrders = todayRevenue[0]?.orders || 0;
    
    // Get orders per day for the month (for chart)
    const ordersPerDay = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: monthStart, $lte: monthEnd }
        }
      },
      {
        $group: {
          _id: { $dayOfMonth: '$createdAt' },
          count: { $sum: 1 },
          revenue: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$deliveryFee', 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Get revenue per month for the year (for chart)
    const yearStart = new Date(targetYear, 0, 1);
    const yearEnd = new Date(targetYear, 11, 31, 23, 59, 59);
    
    const revenuePerMonth = await Order.aggregate([
      {
        $match: {
          status: 'completed',
          completedAt: { $gte: yearStart, $lte: yearEnd }
        }
      },
      {
        $group: {
          _id: { $month: '$completedAt' },
          revenue: { $sum: '$deliveryFee' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Top stores
    const topStores = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$storeId', orderCount: { $sum: 1 }, totalRevenue: { $sum: '$deliveryFee' } } },
      { $sort: { orderCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'stores',
          localField: '_id',
          foreignField: '_id',
          as: 'store'
        }
      },
      { $unwind: '$store' },
      {
        $project: {
          storeName: '$store.businessName',
          orderCount: 1,
          totalRevenue: 1
        }
      }
    ]);
    
    // Top drivers
    const topDrivers = await Order.aggregate([
      { $match: { status: 'completed', driverId: { $ne: null } } },
      { $group: { _id: '$driverId', deliveries: { $sum: 1 }, totalEarned: { $sum: '$deliveryFee' } } },
      { $sort: { deliveries: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'drivers',
          localField: '_id',
          foreignField: '_id',
          as: 'driver'
        }
      },
      { $unwind: '$driver' },
      {
        $project: {
          driverName: '$driver.name',
          deliveries: 1,
          totalEarned: 1
        }
      }
    ]);
    
    // Top customers
    const topCustomers = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$customer.phone', name: { $first: '$customer.name' }, orderCount: { $sum: 1 }, totalSpent: { $sum: '$totalPrice' } } },
      { $sort: { orderCount: -1 } },
      { $limit: 5 }
    ]);
    
    // Average values
    const averages = await Order.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: null,
          avgOrderValue: { $avg: '$totalPrice' },
          avgDeliveryFee: { $avg: '$deliveryFee' }
        }
      }
    ]);
    
    const avgOrderValue = averages[0]?.avgOrderValue || 0;
    const avgDeliveryFee = averages[0]?.avgDeliveryFee || 0;
    
    res.json({
      success: true,
      stats: {
        // Today's stats
        today: {
          revenue: parseFloat(dailyRevenue.toFixed(2)),
          orders: dailyOrders
        },
        // Financial summary for selected month
        financial: {
          year: targetYear,
          month: targetMonth,
          revenue: parseFloat(revenue.toFixed(2)),
          driverSalary,
          approvedDrivers,
          totalSalaries,
          extraExpenses: monthlyExpense.amount,
          expenseNotes: monthlyExpense.notes,
          netResult: parseFloat(netResult.toFixed(2))
        },
        // Charts data
        charts: {
          ordersPerDay,
          revenuePerMonth
        },
        // Top performers
        topPerformers: {
          stores: topStores,
          drivers: topDrivers,
          customers: topCustomers
        },
        // Averages
        averages: {
          orderValue: parseFloat(avgOrderValue.toFixed(2)),
          deliveryFee: parseFloat(avgDeliveryFee.toFixed(2))
        }
      }
    });
  } catch (error) {
    console.error('Get extended stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Σφάλμα ανάκτησης εκτεταμένων στατιστικών'
    });
  }
};

// ==================== ADMIN PROFILE ====================

// @desc    Get admin profile
// @route   GET /api/v1/admin/profile
// @access  Private (Admin)
exports.getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user._id).select('-password');
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Ο διαχειριστής δεν βρέθηκε'
      });
    }
    
    res.json({
      success: true,
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        createdAt: admin.createdAt
      }
    });
  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Σφάλμα ανάκτησης προφίλ'
    });
  }
};

// @desc    Update admin profile (name, email)
// @route   PUT /api/v1/admin/profile
// @access  Private (Admin)
exports.updateAdminProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Το όνομα και το email είναι υποχρεωτικά'
      });
    }
    
    // Check if email already exists (for different admin)
    const existingAdmin = await Admin.findOne({ email, _id: { $ne: req.user._id } });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Το email χρησιμοποιείται ήδη'
      });
    }
    
    const admin = await Admin.findByIdAndUpdate(
      req.user._id,
      { name, email },
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json({
      success: true,
      message: 'Το προφίλ ενημερώθηκε επιτυχώς',
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Update admin profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Σφάλμα ενημέρωσης προφίλ'
    });
  }
};

// @desc    Update admin password
// @route   PUT /api/v1/admin/profile/password
// @access  Private (Admin)
exports.updateAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Ο τρέχων και ο νέος κωδικός είναι υποχρεωτικοί'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Ο νέος κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες'
      });
    }
    
    // Get admin with password
    const admin = await Admin.findById(req.user._id).select('+password');
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Ο διαχειριστής δεν βρέθηκε'
      });
    }
    
    // Check current password
    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Ο τρέχων κωδικός είναι λάθος'
      });
    }
    
    // Update password (will be hashed by pre-save hook)
    admin.password = newPassword;
    await admin.save();
    
    res.json({
      success: true,
      message: 'Ο κωδικός ενημερώθηκε επιτυχώς'
    });
  } catch (error) {
    console.error('Update admin password error:', error);
    res.status(500).json({
      success: false,
      message: 'Σφάλμα αλλαγής κωδικού'
    });
  }
};
