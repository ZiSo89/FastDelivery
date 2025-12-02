require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

async function checkAndFix() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const ordersCollection = db.collection('orders');
    
    // Find the problematic order and update its orderNumber
    const result = await ordersCollection.updateOne(
      { _id: new mongoose.Types.ObjectId('692e1ff929a0d0cad2b43f3d') },
      { $set: { orderNumber: 'ORD-20251201-0027' } }
    );
    
    console.log('Updated:', result.modifiedCount);
    
    // Verify
    const order = await ordersCollection.findOne({ _id: new mongoose.Types.ObjectId('692e1ff929a0d0cad2b43f3d') });
    console.log('New orderNumber:', order.orderNumber);
    
    await mongoose.disconnect();
    console.log('\nDone! Now you can create new orders.');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkAndFix();
