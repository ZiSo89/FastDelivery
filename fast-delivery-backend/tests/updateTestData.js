const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Store = require('../src/models/Store');
const Driver = require('../src/models/Driver');

const updateTestUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Συνδέθηκε στη MongoDB');

    // Update Store: store@test.com με ελληνικά δεδομένα
    const storeUpdate = await Store.findOneAndUpdate(
      { email: 'store@test.com' },
      {
        $set: {
          businessName: 'Σούπερ Μάρκετ Αλεξανδρούπολης',
          storeType: 'Mini Market',
          phone: '2551099999',
          address: 'Λεωφόρος Δημοκρατίας 25, Αλεξανδρούπολη',
          afm: '999888777',
          status: 'approved',
          isApproved: true,
          workingHours: 'Δευ-Κυρ: 08:00-23:00',
          serviceAreas: 'Αλεξανδρούπολη'
        }
      },
      { new: true }
    );

    if (storeUpdate) {
      console.log('\n✅ Ενημερώθηκε το κατάστημα:');
      console.log('   Email:', storeUpdate.email);
      console.log('   Επωνυμία:', storeUpdate.businessName);
      console.log('   Τύπος:', storeUpdate.storeType);
      console.log('   Διεύθυνση:', storeUpdate.address);
      console.log('   Τηλέφωνο:', storeUpdate.phone);
      console.log('   ΑΦΜ:', storeUpdate.afm);
      console.log('   Ωράριο:', storeUpdate.workingHours);
    } else {
      console.log('❌ Δε βρέθηκε κατάστημα με email: store@test.com');
    }

    // Update Driver: driver@test.com με ελληνικά δεδομένα
    const driverUpdate = await Driver.findOneAndUpdate(
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
      },
      { new: true }
    );

    if (driverUpdate) {
      console.log('\n✅ Ενημερώθηκε ο οδηγός:');
      console.log('   Email:', driverUpdate.email);
      console.log('   Όνομα:', driverUpdate.name);
      console.log('   Τηλέφωνο:', driverUpdate.phone);
      console.log('   Όχημα:', driverUpdate.vehicle);
      console.log('   Πινακίδα:', driverUpdate.licensePlate);
      console.log('   Κατάσταση:', driverUpdate.isOnline ? 'Online ✅' : 'Offline');
    } else {
      console.log('❌ Δε βρέθηκε οδηγός με email: driver@test.com');
    }

    console.log('\n🎉 Ολοκληρώθηκε η ενημέρωση!');
    console.log('\n📋 Στοιχεία σύνδεσης:');
    console.log('   Κατάστημα: store@test.com / store123');
    console.log('   Οδηγός: driver@test.com / driver123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Σφάλμα:', error.message);
    console.error(error);
    process.exit(1);
  }
};

updateTestUsers();
