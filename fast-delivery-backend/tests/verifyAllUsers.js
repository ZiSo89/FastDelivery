/**
 * Migration Script: Set all users as email verified
 * 
 * Run this script to verify all existing users:
 * node tests/verifyAllUsers.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/database');

async function verifyAllUsers() {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;

    // ==================== STORES ====================
    console.log('🏪 STORES:');
    const storesCollection = db.collection('stores');
    
    // Count before
    const storesTotal = await storesCollection.countDocuments();
    const storesUnverified = await storesCollection.countDocuments({ 
      $or: [
        { isEmailVerified: false },
        { isEmailVerified: { $exists: false } }
      ]
    });
    
    console.log(`   Total: ${storesTotal}`);
    console.log(`   Unverified: ${storesUnverified}`);
    
    // Update all stores
    const storesResult = await storesCollection.updateMany(
      {},
      { 
        $set: { 
          isEmailVerified: true,
          emailVerifiedAt: new Date()
        },
        $unset: {
          emailVerificationToken: "",
          emailVerificationExpires: ""
        }
      }
    );
    console.log(`   ✅ Updated: ${storesResult.modifiedCount} stores\n`);

    // ==================== DRIVERS ====================
    console.log('🚗 DRIVERS:');
    const driversCollection = db.collection('drivers');
    
    const driversTotal = await driversCollection.countDocuments();
    const driversUnverified = await driversCollection.countDocuments({ 
      $or: [
        { isEmailVerified: false },
        { isEmailVerified: { $exists: false } }
      ]
    });
    
    console.log(`   Total: ${driversTotal}`);
    console.log(`   Unverified: ${driversUnverified}`);
    
    const driversResult = await driversCollection.updateMany(
      {},
      { 
        $set: { 
          isEmailVerified: true,
          emailVerifiedAt: new Date()
        },
        $unset: {
          emailVerificationToken: "",
          emailVerificationExpires: ""
        }
      }
    );
    console.log(`   ✅ Updated: ${driversResult.modifiedCount} drivers\n`);

    // ==================== CUSTOMERS ====================
    console.log('👤 CUSTOMERS:');
    const customersCollection = db.collection('customers');
    
    const customersTotal = await customersCollection.countDocuments();
    const customersUnverified = await customersCollection.countDocuments({ 
      $or: [
        { isEmailVerified: false },
        { isEmailVerified: { $exists: false } }
      ]
    });
    
    console.log(`   Total: ${customersTotal}`);
    console.log(`   Unverified: ${customersUnverified}`);
    
    const customersResult = await customersCollection.updateMany(
      {},
      { 
        $set: { 
          isEmailVerified: true,
          emailVerifiedAt: new Date()
        },
        $unset: {
          emailVerificationToken: "",
          emailVerificationExpires: ""
        }
      }
    );
    console.log(`   ✅ Updated: ${customersResult.modifiedCount} customers\n`);

    // ==================== SUMMARY ====================
    console.log('═══════════════════════════════════════');
    console.log('✅ ALL USERS VERIFIED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the script
verifyAllUsers();
