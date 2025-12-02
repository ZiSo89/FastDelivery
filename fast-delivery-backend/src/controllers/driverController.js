const Driver = require('../models/Driver');
const Order = require('../models/Order');
const { broadcastOrderEvent } = require('../utils/socketHelpers');

// @desc    Get driver profile
// @route   GET /api/v1/driver/profile
// @access  Private (Driver)
exports.getDriverProfile = async (req, res) => {
  try {
    const driver = await Driver.findById(req.user._id)
      .select('-password')
      .populate('currentOrder', 'orderNumber status');

    res.json({
      success: true,
      driver
    });
  } catch (error) {
    console.error('Get driver profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Σφάλμα ανάκτησης προφίλ'
    });
  }
};

// @desc    Update driver profile (including push token)
// @route   PUT /api/v1/driver/profile
// @access  Private (Driver)
exports.updateDriverProfile = async (req, res) => {
  try {
    const { pushToken, name, phone, vehicle, licensePlate } = req.body;
    
    const updateData = {};
    if (pushToken !== undefined) updateData.pushToken = pushToken;
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (vehicle) updateData.vehicle = vehicle;
    if (licensePlate) updateData.licensePlate = licensePlate;

    const driver = await Driver.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Το προφίλ ενημερώθηκε',
      driver
    });
  } catch (error) {
    console.error('Update driver profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Σφάλμα ενημέρωσης προφίλ'
    });
  }
};

// @desc    Toggle driver availability (online/offline)
// @route   PUT /api/v1/driver/availability
// @access  Private (Driver)
exports.toggleAvailability = async (req, res) => {
  try {
    const { isOnline } = req.body;
    const driver = await Driver.findById(req.user._id);

    driver.isOnline = isOnline;
    await driver.save();

    // Notify admin only about driver availability change
    const io = req.app.get('io');
    io.to('admin').emit('driver:availability_changed', {
      driverId: driver._id,
      name: driver.name,
      isOnline: driver.isOnline,
      message: `${driver.name} είναι τώρα ${isOnline ? 'online' : 'offline'}`
    });

    res.json({
      success: true,
      message: `Κατάσταση ενημερώθηκε σε: ${isOnline ? 'online' : 'offline'}`,
      driver: {
        isOnline: driver.isOnline
      }
    });
  } catch (error) {
    console.error('Toggle availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Σφάλμα ενημέρωσης διαθεσιμότητας'
    });
  }
};

// @desc    Get driver orders (assigned)
// @route   GET /api/v1/driver/orders
// @access  Private (Driver)
exports.getDriverOrders = async (req, res) => {
  try {
    const driverId = req.user._id;

    const orders = await Order.find({
      driverId,
      status: { $in: ['assigned', 'accepted_driver', 'preparing', 'in_delivery'] }
    })
      .populate('storeId', 'businessName address phone location')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Get driver orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Σφάλμα ανάκτησης παραγγελιών'
    });
  }
};

// @desc    Accept/Reject order assignment
// @route   PUT /api/v1/driver/orders/:orderId/accept
// @access  Private (Driver)
exports.acceptRejectAssignment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { action } = req.body; // 'accept' or 'reject'
    const driverId = req.user._id;

    const order = await Order.findOne({ _id: orderId, driverId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Η παραγγελία δεν βρέθηκε'
      });
    }

    if (order.status !== 'assigned') {
      return res.status(400).json({
        success: false,
        message: 'Η παραγγελία δεν αναμένει αποδοχή'
      });
    }

    const io = req.app.get('io');
    const driver = await Driver.findById(driverId);

    if (action === 'accept') {
      order.status = 'accepted_driver';
      order._updatedBy = 'driver';
      await order.save();

      // Update driver's current order
      driver.currentOrder = order._id;
      await driver.save();

      // Broadcast acceptance to everyone
      broadcastOrderEvent(io, order, 'driver:accepted', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        storeId: order.storeId,
        driverId: order.driverId,
        driverName: driver.name,
        newStatus: 'accepted_driver'
      });

      res.json({
        success: true,
        message: 'Η ανάθεση έγινε αποδεκτή.',
        order: {
          orderNumber: order.orderNumber,
          status: order.status
        }
      });
    } else if (action === 'reject') {
      order.status = 'rejected_driver';
      order.driverId = null;
      order.driverName = null;
      order._updatedBy = 'driver';
      await order.save();

      // Broadcast rejection to everyone
      broadcastOrderEvent(io, order, 'driver:rejected', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        storeId: order.storeId,
        driverId: driverId,
        driverName: driver.name,
        newStatus: 'rejected_driver'
      });

      res.json({
        success: true,
        message: 'Η ανάθεση απορρίφθηκε. Επιστρέφει στον Admin.',
        order: {
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
    console.error('Accept/Reject assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Σφάλμα επεξεργασίας ανάθεσης'
    });
  }
};

// @desc    Update order status (in_delivery, completed)
// @route   PUT /api/v1/driver/orders/:orderId/status
// @access  Private (Driver)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const driverId = req.user._id;

    // Allowed statuses for driver
    if (!['in_delivery', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Μη έγκυρη κατάσταση'
      });
    }

    const order = await Order.findOne({ _id: orderId, driverId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Η παραγγελία δεν βρέθηκε'
      });
    }

    const driver = await Driver.findById(driverId);

    if (status === 'in_delivery' && order.status !== 'preparing') {
      return res.status(400).json({
        success: false,
        message: 'Η παραγγελία δεν είναι έτοιμη για παραλαβή'
      });
    }

    if (status === 'completed' && order.status !== 'in_delivery') {
      return res.status(400).json({
        success: false,
        message: 'Η παραγγελία δεν είναι σε κατάσταση παράδοσης'
      });
    }

    order.status = status;
    order._updatedBy = 'driver';

    if (status === 'completed') {
      order.completedAt = new Date();
      // Free driver
      driver.currentOrder = null;
      await driver.save();
    }

    await order.save();

    // Broadcast to everyone
    const io = req.app.get('io');
    broadcastOrderEvent(io, order, 'order:status_changed', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      storeId: order.storeId,
      driverId: order.driverId,
      newStatus: status
    });

    if (status === 'completed') {
      broadcastOrderEvent(io, order, 'order:completed', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        storeId: order.storeId,
        driverId: order.driverId,
        newStatus: 'completed'
      });
    }

    res.json({
      success: true,
      order: {
        orderNumber: order.orderNumber,
        status: order.status
      }
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Σφάλμα ενημέρωσης κατάστασης'
    });
  }
};
