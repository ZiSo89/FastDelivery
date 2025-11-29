/**
 * Script to create production admin account
 * Run this script once to create the initial admin
 * 
 * Usage: node scripts/createProductionAdmin.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Production MongoDB URI - replace with your actual URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://fastdelivery:56ynGiuw24D1T8b3@cluster0.istyclo.mongodb.net/fast_delivery';

// Admin credentials
const ADMIN_EMAIL = 'zisoglou@hotmail.gr';
const ADMIN_PASSWORD = 'Sakis!1989';
const ADMIN_NAME = 'Sakis Admin';

// Admin Schema (simplified)
const adminSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'admin' },
  createdAt: { type: Date, default: Date.now }
});

const Admin = mongoose.model('Admin', adminSchema);

async function createAdmin() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: ADMIN_EMAIL });
    
    if (existingAdmin) {
      console.log('⚠️ Admin already exists with this email');
      console.log('📧 Email:', ADMIN_EMAIL);
      
      // Update password if needed
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);
      
      existingAdmin.password = hashedPassword;
      await existingAdmin.save();
      
      console.log('✅ Password updated successfully');
    } else {
      // Create new admin
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

      const admin = new Admin({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: hashedPassword,
        role: 'admin'
      });

      await admin.save();
      console.log('✅ Admin created successfully!');
      console.log('📧 Email:', ADMIN_EMAIL);
      console.log('🔐 Password: [hidden]');
    }

    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdmin();
