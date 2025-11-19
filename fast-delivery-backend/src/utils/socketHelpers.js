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
  // 1. Broadcast to ALL connected clients (includes admins who don't join specific rooms)
  // This ensures admins receive all events even without joining rooms
  io.emit(eventName, data);
  
  // Note: We DON'T send to specific store/driver rooms because they already receive
  // the event from io.emit() above. Sending again would create duplicates.
  // Store and driver clients listen to global events and filter by orderNumber.
};

/**
 * Broadcast to all admins only
 * @param {Object} io - Socket.IO instance
 * @param {String} eventName - Event name
 * @param {Object} data - Event data
 */
const broadcastToAdmins = (io, eventName, data) => {
  io.emit(eventName, data);
};

module.exports = {
  broadcastOrderEvent,
  broadcastToAdmins
};
