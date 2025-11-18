const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const Admin = require('./src/models/Admin');

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@fastdelivery.gr' });
    
    if (existingAdmin) {
      console.log('⚠️  Admin already exists!');
      process.exit(0);
    }

    // Create new admin
    const admin = await Admin.create({
      name: 'Administrator',
      email: 'admin@fastdelivery.gr',
      password: 'admin123',
      role: 'admin'
    });

    console.log('✅ Admin created successfully!');
    console.log('📧 Email:', admin.email);
    console.log('👤 Name:', admin.name);
    console.log('\n🔐 Login credentials:');
    console.log('   Email: admin@fastdelivery.gr');
    console.log('   Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createAdmin();
