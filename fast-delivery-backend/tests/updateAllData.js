const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Store = require('../src/models/Store');
const Driver = require('../src/models/Driver');

const greekStoreNames = [
  { name: 'Σούπερ Μάρκετ Αλεξανδρούπολης', type: 'Mini Market', address: 'Λεωφόρος Δημοκρατίας 25, Αλεξανδρούπολη' },
  { name: 'Φαρμακείο Υγεία', type: 'Φαρμακείο', address: 'Κων/νου Παλαιολόγου 45, Αλεξανδρούπολη' },
  { name: 'Ταβέρνα Το Λιμάνι', type: 'Ταβέρνα', address: 'Παραλία Αλεξανδρούπολης 12, Αλεξανδρούπολη' },
  { name: 'Καφέ Μπαρ Ακρογιάλι', type: 'Καφετέρια', address: 'Λεωφόρος Μακρής 78, Αλεξανδρούπολη' },
  { name: 'Μίνι Μάρκετ Κέντρο', type: 'Mini Market', address: 'Πλατεία Πολυτεχνείου 5, Αλεξανδρούπολη' },
  { name: 'Φούρναρης Γεύσεις', type: 'Άλλο', address: 'Οδός Ορφέως 33, Αλεξανδρούπολη' },
  { name: 'Καφετέρια Κεντρική', type: 'Καφετέρια', address: 'Βενιζέλου 15, Αλεξανδρούπολη' }
];

const greekDriverNames = [
  { name: 'Γιώργος Παπαδόπουλος', vehicle: 'Μοτοσυκλέτα Honda', plate: 'ΕΒΡ-1234' },
  { name: 'Μαρία Νικολάου', vehicle: 'Σκούτερ Piaggio', plate: 'ΕΒΡ-5678' },
  { name: 'Νίκος Δημητρίου', vehicle: 'Μοτοσυκλέτα Yamaha', plate: 'ΕΒΡ-9012' },
  { name: 'Ελένη Κωνσταντίνου', vehicle: 'Αυτοκίνητο Smart', plate: 'ΕΒΡ-3456' },
  { name: 'Δημήτρης Ιωάννου', vehicle: 'Μοτοσυκλέτα Suzuki', plate: 'ΕΒΡ-7890' }
];

const updateAllData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Συνδέθηκε στη MongoDB\n');

    // Get all stores
    const stores = await Store.find({}).sort({ createdAt: 1 });
    console.log(`📋 Βρέθηκαν ${stores.length} καταστήματα`);

    // Update each store with Greek data
    for (let i = 0; i < stores.length; i++) {
      const storeData = greekStoreNames[i % greekStoreNames.length];
      const updated = await Store.findByIdAndUpdate(
        stores[i]._id,
        {
          $set: {
            businessName: storeData.name + (i >= greekStoreNames.length ? ` ${Math.floor(i / greekStoreNames.length) + 1}` : ''),
            storeType: storeData.type,
            address: storeData.address,
            workingHours: 'Δευ-Κυρ: 08:00-23:00',
            serviceAreas: 'Αλεξανδρούπολη',
            status: 'approved',
            isApproved: true
          }
        },
        { new: true }
      );
      console.log(`  ✅ ${i + 1}. ${updated.businessName} (${updated.storeType})`);
    }

    // Get all drivers
    const drivers = await Driver.find({}).sort({ createdAt: 1 });
    console.log(`\n🚗 Βρέθηκαν ${drivers.length} οδηγοί`);

    // Update each driver with Greek data
    for (let i = 0; i < drivers.length; i++) {
      const driverData = greekDriverNames[i % greekDriverNames.length];
      const updated = await Driver.findByIdAndUpdate(
        drivers[i]._id,
        {
          $set: {
            name: driverData.name + (i >= greekDriverNames.length ? ` ${Math.floor(i / greekDriverNames.length) + 1}` : ''),
            vehicle: driverData.vehicle,
            licensePlate: driverData.plate,
            status: 'approved',
            isApproved: true,
            isOnline: i < 3 // First 3 drivers online
          }
        },
        { new: true }
      );
      console.log(`  ✅ ${i + 1}. ${updated.name} - ${updated.vehicle} (${updated.licensePlate}) ${updated.isOnline ? '🟢 Online' : '⚪ Offline'}`);
    }

    console.log('\n🎉 Όλα τα δεδομένα ενημερώθηκαν με ελληνικά!');
    console.log('\n📋 Στοιχεία σύνδεσης test users:');
    console.log('   Admin: admin@fastdelivery.gr / admin123');
    console.log('   Store: store@test.com / store123');
    console.log('   Driver: driver@test.com / driver123');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Σφάλμα:', error.message);
    console.error(error);
    process.exit(1);
  }
};

updateAllData();
