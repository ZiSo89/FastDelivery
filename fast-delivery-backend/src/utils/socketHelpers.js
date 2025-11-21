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
  // Broadcast to ALL clients (includes admins, stores, drivers, and customers)
  // Each client will filter events based on their context:
  // - Admins: receive all events
  // - Stores: filter by storeId
  // - Drivers: filter by driverId
  // - Customers: filter by orderNumber
  io.emit(eventName, data);
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
