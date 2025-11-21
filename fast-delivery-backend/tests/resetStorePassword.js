require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Store = require('../src/models/Store');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function resetStorePassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB\n');

    // Get store by email
    const email = 'sakis@hotmail.gr';
    
    const store = await Store.findOne({ email }).select('+password');

    if (!store) {
      console.log('❌ Το κατάστημα δεν βρέθηκε');
      await mongoose.connection.close();
      rl.close();
      return;
    }

    console.log('📦 Κατάστημα:');
    console.log(`   Επωνυμία: ${store.businessName}`);
    console.log(`   Email: ${store.email}`);
    console.log(`   Status: ${store.status}`);
    console.log(`   isApproved: ${store.isApproved}`);
    console.log(`   Τηλέφωνο: ${store.phone}\n`);

    // Ask for new password
    rl.question('Νέος κωδικός (πάτα Enter για "123456"): ', async (newPassword) => {
      const password = newPassword.trim() || '123456';
      
      store.password = password;
      await store.save();

      console.log('\n✅ Ο κωδικός άλλαξε επιτυχώς!');
      console.log('\n📋 Στοιχεία Login:');
      console.log('='.repeat(50));
      console.log(`   Email: ${store.email}`);
      console.log(`   Κωδικός: ${password}`);
      console.log(`   Ρόλος: Κατάστημα (store)`);
      console.log('='.repeat(50));

      await mongoose.connection.close();
      rl.close();
    });

  } catch (error) {
    console.error('❌ Σφάλμα:', error.message);
    rl.close();
    process.exit(1);
  }
}

resetStorePassword();
