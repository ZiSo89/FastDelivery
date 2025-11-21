require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Store = require('../src/models/Store');

async function fixStoreApproval() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB');

    // Fix stores with status=approved but isApproved=false
    const result = await Store.updateMany(
      { status: 'approved', isApproved: false },
      { $set: { isApproved: true } }
    );

    console.log(`\n🔧 Διορθώθηκαν ${result.modifiedCount} καταστήματα`);

    // Show all stores after fix
    const stores = await Store.find({}).select('-password');
    
    console.log('\n📊 Καταστήματα μετά τη διόρθωση:');
    console.log('='.repeat(80));
    
    stores.forEach((store, index) => {
      console.log(`\n${index + 1}. ${store.businessName}`);
      console.log(`   Email: ${store.email}`);
      console.log(`   Status: ${store.status}`);
      console.log(`   isApproved: ${store.isApproved}`);
      console.log(`   ✅ ${store.status === 'approved' && store.isApproved ? 'ΣΩΣΤΟ' : '⚠️ ΠΡΟΒΛΗΜΑ'}`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Ολοκληρώθηκε');

  } catch (error) {
    console.error('❌ Σφάλμα:', error.message);
    process.exit(1);
  }
}

fixStoreApproval();
