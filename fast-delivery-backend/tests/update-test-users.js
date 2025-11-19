const mongoose = require('mongoose');
const Store = require('../src/models/Store');
const Driver = require('../src/models/Driver');

async function updateTestUsers() {
  try {
    await mongoose.connect('mongodb+srv://zisos:0KkSEYjzJEOCnX72@cluster0.dqotl.mongodb.net/fast-delivery?retryWrites=true&w=majority');
    console.log('✅ Connected to MongoDB');

    // Update Store Profile - Ελληνικά δεδομένα από Αλεξανδρούπολη
    const storeUpdate = await Store.findOneAndUpdate(
      { email: 'store@test.com' },
      {
        name: 'Μίνι Μάρκετ Αλεξανδρούπολης',
        phone: '2551099999',
        address: 'Λεωφόρος Δημοκρατίας 25, Αλεξανδρούπολη',
        afm: '999888777',
        status: 'approved'
      },
      { new: true }
    );
    console.log('✅ Ενημερώθηκε κατάστημα:', storeUpdate.email);
    console.log('   Όνομα:', storeUpdate.name);
    console.log('   Διεύθυνση:', storeUpdate.address);

    // Update Driver Profile - Ελληνικά δεδομένα από Αλεξανδρούπολη
    const driverUpdate = await Driver.findOneAndUpdate(
      { email: 'driver@test.com' },
      {
        name: 'Γιώργος Παπαδόπουλος',
        phone: '6987654321',
        vehicle: 'Μοτοσυκλέτα',
        licensePlate: 'ΕΒΡ-1234',
        status: 'approved',
        isOnline: true
      },
      { new: true }
    );
    console.log('✅ Ενημερώθηκε οδηγός:', driverUpdate.email);
    console.log('   Όνομα:', driverUpdate.name);
    console.log('   Όχημα:', driverUpdate.vehicle);
    console.log('   Πινακίδα:', driverUpdate.licensePlate);

    await mongoose.connection.close();
    console.log('\n🎉 Οι χρήστες test ενημερώθηκαν επιτυχώς!');
    console.log('\n📋 Στοιχεία σύνδεσης:');
    console.log('Κατάστημα: store@test.com / store123');
    console.log('Οδηγός: driver@test.com / driver123');
  } catch (error) {
    console.error('❌ Σφάλμα:', error.message);
    process.exit(1);
  }
}

updateTestUsers();
