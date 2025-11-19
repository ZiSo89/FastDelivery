const mongoose = require('mongoose');

async function updateTestUsers() {
  try {
    await mongoose.connect('mongodb+srv://zisos:0KkSEYjzJEOCnX72@cluster0.dqotl.mongodb.net/fast-delivery?retryWrites=true&w=majority&appName=Cluster0');
    console.log('Connected to MongoDB Atlas');

    const storesCollection = mongoose.connection.collection('stores');
    const driversCollection = mongoose.connection.collection('drivers');

    // Update Store: store@test.com
    const storeResult = await storesCollection.updateOne(
      { email: 'store@test.com' },
      {
        $set: {
          businessName: 'Σούπερ Μάρκετ Αλεξανδρούπολης',
          storeType: 'Σούπερ Μάρκετ',
          ownerName: 'Δημήτρης Γεωργίου',
          phone: '2551099999',
          address: 'Λεωφόρος Δημοκρατίας 25, Αλεξανδρούπολη',
          afm: '999888777',
          status: 'approved',
          isApproved: true
        }
      }
    );
    console.log('✅ Store updated:', storeResult.modifiedCount, 'documents');

    // Update Driver: driver@test.com
    const driverResult = await driversCollection.updateOne(
      { email: 'driver@test.com' },
      {
        $set: {
          name: 'Γιώργος Παπαδόπουλος',
          phone: '6987654321',
          vehicle: 'Μοτοσυκλέτα Honda',
          licensePlate: 'ΕΒΡ-1234',
          status: 'approved',
          isApproved: true,
          isOnline: true
        }
      }
    );
    console.log('✅ Driver updated:', driverResult.modifiedCount, 'documents');

    // Verify updates
    const store = await storesCollection.findOne({ email: 'store@test.com' });
    console.log('\n📋 Store Data:');
    console.log('   Όνομα:', store.businessName);
    console.log('   Τύπος:', store.storeType);
    console.log('   Ιδιοκτήτης:', store.ownerName);
    console.log('   Διεύθυνση:', store.address);
    console.log('   Τηλέφωνο:', store.phone);
    console.log('   ΑΦΜ:', store.afm);

    const driver = await driversCollection.findOne({ email: 'driver@test.com' });
    console.log('\n🚗 Driver Data:');
    console.log('   Όνομα:', driver.name);
    console.log('   Τηλέφωνο:', driver.phone);
    console.log('   Όχημα:', driver.vehicle);
    console.log('   Πινακίδα:', driver.licensePlate);
    console.log('   Online:', driver.isOnline);

    await mongoose.connection.close();
    console.log('\n🎉 Ολοκληρώθηκε επιτυχώς!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateTestUsers();
