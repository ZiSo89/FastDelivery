/**
 * Socket.IO Helper Functions
 * Broadcast order events to all relevant parties
 */

/**
 * Broadcast order status change to all relevant users
 * @param {Object} io - Socket.IO instance
 * @param {Object} order - Order object with storeId and driverId
 * @param {String} eventName - Event name to emit
 * @param {Object} data - Event data
 */
const broadcastOrderEvent = (io, order, eventName, data) => {
  // 1. Broadcast to ALL admins (they see everything)
  io.emit(eventName, data);
  
  // 2. Send to specific store if exists
  if (order.storeId) {
    io.to(`store:${order.storeId}`).emit(eventName, data);
  }
  
  // 3. Send to specific driver if assigned
  if (order.driverId) {
    io.to(`driver:${order.driverId}`).emit(eventName, data);
  }
  
  console.log(`📡 Broadcast ${eventName}:`, {
    orderNumber: order.orderNumber || order._id,
    toAdmin: true,
    toStore: !!order.storeId,
    toDriver: !!order.driverId
  });
};

/**
 * Broadcast to all admins only
 * @param {Object} io - Socket.IO instance
 * @param {String} eventName - Event name
 * @param {Object} data - Event data
 */
const broadcastToAdmins = (io, eventName, data) => {
  io.emit(eventName, data);
  console.log(`📡 Broadcast to admins: ${eventName}`);
};

module.exports = {
  broadcastOrderEvent,
  broadcastToAdmins
};
