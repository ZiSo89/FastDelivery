const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Order = require('../src/models/Order');
const Store = require('../src/models/Store');

async function checkOrders() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const orders = await Order.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('storeId', 'businessName');
    
    console.log('=== ΤΕΛΕΥΤΑΙΕΣ 5 ΠΑΡΑΓΓΕΛΙΕΣ ===\n');
    orders.forEach(order => {
      console.log('📦 Order:', order.orderNumber);
      console.log('   Status:', order.status);
      console.log('   Store:', order.storeId?.businessName || order.storeName);
      console.log('   Customer:', order.customer?.name, '-', order.customer?.phone);
      console.log('   Created:', order.createdAt);
      console.log('');
    });
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkOrders();
