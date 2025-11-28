const Customer = require('../models/Customer');
const { sendPushNotification } = require('./pushNotifications');

/**
 * Socket.IO Helper Functions
 * Broadcast order events to relevant parties only
 */

const STATUS_MESSAGES = {
  'pricing': 'Η παραγγελία σας έγινε αποδεκτή από το κατάστημα.',
  'pending_customer_confirm': 'Η παραγγελία σας κοστολογήθηκε. Παρακαλώ επιβεβαιώστε.',
  'confirmed': 'Η παραγγελία σας επιβεβαιώθηκε και αναζητούμε διανομέα.',
  'preparing': 'Η παραγγελία σας ετοιμάζεται.',
  'in_delivery': 'Ο διανομέας παρέλαβε την παραγγελία σας.',
  'completed': 'Η παραγγελία σας ολοκληρώθηκε.',
  'rejected_store': 'Η παραγγελία σας απορρίφθηκε από το κατάστημα.',
  'rejected_driver': 'Δεν βρέθηκε διαθέσιμος διανομέας.',
  'cancelled': 'Η παραγγελία ακυρώθηκε.'
};

/**
 * Broadcast order status change to relevant users only (not all users)
 * @param {Object} io - Socket.IO instance
 * @param {Object} order - Order object with storeId and driverId
 * @param {String} eventName - Event name to emit
 * @param {Object} data - Event data
 */
const broadcastOrderEvent = async (io, order, eventName, data) => {
  if (!io) return;

  // Always send to admins
  io.to('admin').emit(eventName, data);

  // Send to the specific store involved
  if (order.storeId) {
    io.to(`store:${order.storeId}`).emit(eventName, data);
  }

  // Send to the specific driver if assigned
  if (order.driverId) {
    io.to(`driver:${order.driverId}`).emit(eventName, data);
  }

  // Send to customer (using phone number or order number as room)
  if (order.customer?.phone) {
    io.to(`customer:${order.customer.phone}`).emit(eventName, data);

    // Send Push Notification to Customer
    try {
      // Find customer by phone to get push token
      const customer = await Customer.findOne({ phone: order.customer.phone });
      
      if (customer && customer.pushToken) {
        const message = STATUS_MESSAGES[data.newStatus];
        if (message) {
          await sendPushNotification(
            customer.pushToken,
            'Ενημέρωση Παραγγελίας',
            message,
            { orderId: order._id, orderNumber: order.orderNumber, status: data.newStatus }
          );
        }
      }
    } catch (error) {
      console.error('❌ Error sending push notification in broadcast:', error);
    }
  }
};

/**
 * Broadcast to all admins only
 * @param {Object} io - Socket.IO instance
 * @param {String} eventName - Event name
 * @param {Object} data - Event data
 */
const broadcastToAdmins = (io, eventName, data) => {
  io.to('admin').emit(eventName, data);
};

module.exports = {
  broadcastOrderEvent,
  broadcastToAdmins
};
