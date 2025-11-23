/**
 * Socket.IO Helper Functions
 * Broadcast order events to relevant parties only
 */

/**
 * Broadcast order status change to relevant users only (not all users)
 * @param {Object} io - Socket.IO instance
 * @param {Object} order - Order object with storeId and driverId
 * @param {String} eventName - Event name to emit
 * @param {Object} data - Event data
 */
const broadcastOrderEvent = (io, order, eventName, data) => {
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
