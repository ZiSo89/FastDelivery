require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Store = require('../src/models/Store');

async function checkStoreApproval() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB');

    // Get all stores
    const stores = await Store.find({}).select('+password');

    console.log('\n📊 Καταστήματα στη βάση:');
    console.log('='.repeat(80));

    if (stores.length === 0) {
      console.log('❌ Δεν βρέθηκαν καταστήματα');
    } else {
      stores.forEach((store, index) => {
        console.log(`\n${index + 1}. ${store.businessName}`);
        console.log(`   Email: ${store.email}`);
        console.log(`   ΑΦΜ: ${store.afm}`);
        console.log(`   Status: ${store.status}`);
        console.log(`   isApproved: ${store.isApproved}`);
        console.log(`   Τηλέφωνο: ${store.phone}`);
        console.log(`   Διεύθυνση: ${store.address}`);
        console.log(`   Τύπος: ${store.storeType}`);
        console.log(`   Δημιουργήθηκε: ${store.createdAt}`);
      });

      // Check for stores with mismatched status
      const mismatchedStores = stores.filter(s => 
        (s.status === 'approved' && !s.isApproved) ||
        (s.status !== 'approved' && s.isApproved)
      );

      if (mismatchedStores.length > 0) {
        console.log('\n⚠️  ΠΡΟΣΟΧΗ: Βρέθηκαν καταστήματα με ασυμφωνία status/isApproved:');
        mismatchedStores.forEach(store => {
          console.log(`   - ${store.businessName}: status=${store.status}, isApproved=${store.isApproved}`);
        });

        console.log('\n🔧 Θέλεις να τα διορθώσω; (θα θέσω isApproved=true για status=approved)');
      }
    }

    await mongoose.connection.close();
    console.log('\n✅ Αποσύνδεση από MongoDB');

  } catch (error) {
    console.error('❌ Σφάλμα:', error.message);
    process.exit(1);
  }
}

checkStoreApproval();
