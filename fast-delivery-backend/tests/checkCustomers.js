const mongoose = require('mongoose');
const User = require('../src/models/User');
const Order = require('../src/models/Order');

const MONGODB_URI = 'mongodb+srv://fastdelivery:56ynGiuw24D1T8b3@cluster0.istyclo.mongodb.net/fast_delivery';

async function checkCustomers() {
  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas\n');

    // Get all users (customers)
    const users = await User.find();
    console.log(`📊 Total Registered Users in database: ${users.length}\n`);

    if (users.length === 0) {
      console.log('❌ No registered users found in database!');
      console.log('\n💡 Tip: Register customers via the app\n');
    } else {
      console.log('👥 Registered Users List:\n');
      
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        
        // Count orders for this user
        const orderCount = await Order.countDocuments({
          'customer.phone': user.phone
        });
        
        console.log(`${i + 1}. ${user.name || 'N/A'}`);
        console.log(`   📧 Email: ${user.email || 'N/A'}`);
        console.log(`   📞 Phone: ${user.phone}`);
        console.log(`   📍 Address: ${user.address || 'N/A'}`);
        console.log(`   🔑 Password Hash: ${user.password ? 'Set' : 'N/A'}`);
        console.log(`   📦 Total Orders: ${orderCount}`);
        console.log(`   ${user.isActive ? '✅ Active' : '❌ Inactive'}`);
        console.log(`   📅 Created: ${new Date(user.createdAt).toLocaleDateString('el-GR')}`);
        console.log('');
      }
      
      // Check for specific emails
      console.log('\n🔍 Checking for specific emails:\n');
      const emailsToCheck = ['sakis@gmail.com', 'zisoglou@gmail.com', 'zisoglou@hotmail.gr'];
      
      for (const email of emailsToCheck) {
        const userByEmail = await User.findOne({ email: email });
        if (userByEmail) {
          console.log(`✅ Found: ${email} → ${userByEmail.name}`);
        } else {
          console.log(`❌ Not found: ${email}`);
        }
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit();
  }
}

checkCustomers();
