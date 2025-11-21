const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Order = require('../src/models/Order');
const Driver = require('../src/models/Driver');
const Store = require('../src/models/Store');

const checkOrderDriver = async () => {
  try {
    // Use the connection from database config
    const connectDB = require('../src/config/database');
    await connectDB();
    
    console.log('✅ Connected to MongoDB\n');

    // Find the order
    const orderNumber = 'ORD-20251121-0007';
    const order = await Order.findOne({ orderNumber })
      .populate('storeId', 'businessName')
      .populate('driverId', 'name email');

    if (!order) {
      console.log(`❌ Η παραγγελία ${orderNumber} δεν βρέθηκε!\n`);
      process.exit(0);
    }

    console.log('📦 Στοιχεία Παραγγελίας:');
    console.log('================================');
    console.log(`Αριθμός: ${order.orderNumber}`);
    console.log(`Κατάσταση: ${order.status}`);
    console.log(`Κατάστημα: ${order.storeName || order.storeId?.businessName}`);
    console.log(`StoreId: ${order.storeId}`);
    console.log(`DriverId: ${order.driverId || 'Δεν έχει ανατεθεί'}`);
    console.log(`Driver Name: ${order.driverName || 'Δεν έχει ανατεθεί'}`);
    console.log(`Τιμή: €${order.totalPrice?.toFixed(2) || 'N/A'}`);
    console.log(`Δημιουργήθηκε: ${order.createdAt}`);
    console.log('');

    if (order.driverId) {
      console.log('🚗 Στοιχεία Οδηγού από Populate:');
      console.log('================================');
      console.log(`ID: ${order.driverId._id || order.driverId}`);
      console.log(`Όνομα: ${order.driverId.name || 'N/A'}`);
      console.log(`Email: ${order.driverId.email || 'N/A'}`);
      console.log('');
    }

    // Find driver by name
    const driverName = 'Δημήτρης Ιωάννου';
    const driver = await Driver.findOne({ name: driverName });

    if (!driver) {
      console.log(`❌ Ο οδηγός "${driverName}" δεν βρέθηκε!\n`);
      
      // Show all drivers
      const allDrivers = await Driver.find();
      console.log('📋 Όλοι οι οδηγοί στη βάση:');
      console.log('================================');
      allDrivers.forEach((d, i) => {
        console.log(`${i + 1}. ${d.name} (ID: ${d._id})`);
        console.log(`   Email: ${d.email}`);
        console.log(`   Status: ${d.status}, isApproved: ${d.isApproved}`);
        console.log('');
      });
    } else {
      console.log(`✅ Ο οδηγός "${driverName}" βρέθηκε!`);
      console.log('================================');
      console.log(`ID: ${driver._id}`);
      console.log(`Email: ${driver.email}`);
      console.log(`Status: ${driver.status}`);
      console.log(`isApproved: ${driver.isApproved}`);
      console.log(`isOnline: ${driver.isOnline}`);
      console.log(`Current Order: ${driver.currentOrder || 'Καμία'}`);
      console.log('');

      // Check if order's driverId matches this driver
      if (order.driverId) {
        const orderDriverId = order.driverId._id || order.driverId;
        const match = orderDriverId.toString() === driver._id.toString();
        console.log(`🔍 Ταιριάζει η παραγγελία με τον οδηγό;`);
        console.log(`Order.driverId: ${orderDriverId}`);
        console.log(`Driver._id: ${driver._id}`);
        console.log(`Match: ${match ? '✅ ΝΑΙ' : '❌ ΟΧΙ'}`);
        console.log('');
      }

      // Find all orders for this driver
      const driverOrders = await Order.find({ driverId: driver._id });
      console.log(`📦 Παραγγελίες του οδηγού "${driverName}": ${driverOrders.length}`);
      console.log('================================');
      driverOrders.forEach((o, i) => {
        console.log(`${i + 1}. ${o.orderNumber} - Status: ${o.status} - €${o.totalPrice?.toFixed(2) || 'N/A'}`);
      });
      console.log('');

      // Check what the API would return
      const apiOrders = await Order.find({
        driverId: driver._id,
        status: { $in: ['assigned', 'accepted_driver', 'preparing', 'in_delivery'] }
      });
      console.log(`📱 Παραγγελίες που θα εμφανίζονται στο API (status: assigned, accepted_driver, preparing, in_delivery): ${apiOrders.length}`);
      console.log('================================');
      apiOrders.forEach((o, i) => {
        console.log(`${i + 1}. ${o.orderNumber} - Status: ${o.status}`);
      });
    }

    console.log('\n✅ Αποσύνδεση από MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkOrderDriver();
