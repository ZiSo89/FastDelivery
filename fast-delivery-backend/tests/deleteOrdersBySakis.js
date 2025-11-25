require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Order = require('../src/models/Order');

const deleteOrdersBySakis = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all orders where customer name contains "Σακης"
    const ordersToDelete = await Order.find({
      'customer.name': { $regex: 'Ζήσογλου', $options: 'i' }
    });

    console.log(`\n📦 Found ${ordersToDelete.length} orders with customer name containing "Σακης":`);
    ordersToDelete.forEach(order => {
      console.log(`  - ${order.orderNumber}: ${order.customer.name} (${order.status})`);
    });

    if (ordersToDelete.length === 0) {
      console.log('\n✅ No orders to delete');
      process.exit(0);
    }

    // Delete the orders
    const result = await Order.deleteMany({
      'customer.name': { $regex: 'Σακης', $options: 'i' }
    });

    console.log(`\n🗑️  Deleted ${result.deletedCount} orders`);
    console.log('✅ Cleanup completed successfully!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

deleteOrdersBySakis();
