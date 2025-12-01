/**
 * Clear Test Data Script
 * Διαγράφει μόνο test data (orders, customers) - Ασφαλές
 * 
 * Usage: node tests/clearTestData.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');

// Models
const Order = require('../src/models/Order');
const Customer = require('../src/models/Customer');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase());
    });
  });
};

const clearTestData = async () => {
  try {
    // Connect to MongoDB
    console.log('🔌 Σύνδεση στη βάση δεδομένων...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Συνδέθηκε στη MongoDB!\n');

    // Count current data
    const orderCount = await Order.countDocuments();
    const customerCount = await Customer.countDocuments();

    console.log('📊 Τρέχοντα δεδομένα:');
    console.log(`   - Παραγγελίες: ${orderCount}`);
    console.log(`   - Πελάτες: ${customerCount}`);
    console.log('');

    if (orderCount === 0 && customerCount === 0) {
      console.log('ℹ️  Δεν υπάρχουν δεδομένα για διαγραφή.');
      rl.close();
      await mongoose.connection.close();
      return;
    }

    // Ask for confirmation
    const answer = await askQuestion('⚠️  Θέλεις να διαγράψεις ΟΛΕΣ τις παραγγελίες και πελάτες; (yes/no): ');

    if (answer !== 'yes' && answer !== 'y') {
      console.log('❌ Ακυρώθηκε.');
      rl.close();
      await mongoose.connection.close();
      return;
    }

    console.log('\n🗑️  Διαγραφή δεδομένων...');

    // Delete orders
    const deletedOrders = await Order.deleteMany({});
    console.log(`   ✅ Διαγράφηκαν ${deletedOrders.deletedCount} παραγγελίες`);

    // Delete customers
    const deletedCustomers = await Customer.deleteMany({});
    console.log(`   ✅ Διαγράφηκαν ${deletedCustomers.deletedCount} πελάτες`);

    console.log('\n🎉 Η διαγραφή ολοκληρώθηκε!');
    console.log('   Τα καταστήματα, οδηγοί και admins παραμένουν ανέπαφα.');

    rl.close();
    await mongoose.connection.close();
    console.log('\n👋 Αποσύνδεση από τη βάση.');

  } catch (error) {
    console.error('❌ Σφάλμα:', error.message);
    rl.close();
    process.exit(1);
  }
};

clearTestData();
