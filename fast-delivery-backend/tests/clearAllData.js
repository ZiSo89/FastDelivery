const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const Admin = require('../src/models/Admin');
const Store = require('../src/models/Store');
const Driver = require('../src/models/Driver');
const Order = require('../src/models/Order');
const User = require('../src/models/User');

const clearAllData = async () => {
  try {
    // Σύνδεση στη βάση
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Σύνδεση με MongoDB');

    // Διαγραφή όλων των δεδομένων
    await Admin.deleteMany({});
    console.log('🗑️  Διαγράφηκαν όλοι οι Admins');

    await Store.deleteMany({});
    console.log('🗑️  Διαγράφηκαν όλα τα Καταστήματα');

    await Driver.deleteMany({});
    console.log('🗑️  Διαγράφηκαν όλοι οι Οδηγοί');

    await Order.deleteMany({});
    console.log('🗑️  Διαγράφηκαν όλες οι Παραγγελίες');

    await User.deleteMany({});
    console.log('🗑️  Διαγράφηκαν όλοι οι Πελάτες');

    console.log('\n✅ Όλα τα δεδομένα διαγράφηκαν επιτυχώς!');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Σφάλμα:', error);
    process.exit(1);
  }
};

clearAllData();
