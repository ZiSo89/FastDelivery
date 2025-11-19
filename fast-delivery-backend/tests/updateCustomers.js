const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');

const greekCustomerNames = [
  'Νίκος Ιωάννου',
  'Μαρία Παπαδοπούλου',
  'Γιώργος Κωνσταντίνου',
  'Ελένη Δημητρίου',
  'Κώστας Αλεξίου',
  'Σοφία Νικολάου',
  'Δημήτρης Παπαγεωργίου',
  'Αννα Βασιλείου'
];

const alexandroupoliAddresses = [
  'Λεωφόρος Δημοκρατίας 25, Αλεξανδρούπολη',
  'Κων/νου Παλαιολόγου 10, Αλεξανδρούπολη',
  'Πλατεία Πολυτεχνείου 5, Αλεξανδρούπολη',
  'Οδός Ορφέως 33, Αλεξανδρούπολη',
  'Βενιζέλου 15, Αλεξανδρούπολη',
  'Παραλία Αλεξανδρούπολης 12, Αλεξανδρούπολη',
  'Λεωφόρος Μακρής 78, Αλεξανδρούπολη',
  'Κύπρου 100, Αλεξανδρούπολη'
];

const updateCustomers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Συνδέθηκε στη MongoDB\n');

    const customers = await User.find({}).sort({ createdAt: 1 });
    console.log(`📋 Βρέθηκαν ${customers.length} πελάτες\n`);

    for (let i = 0; i < customers.length; i++) {
      const name = greekCustomerNames[i % greekCustomerNames.length];
      const address = alexandroupoliAddresses[i % alexandroupoliAddresses.length];
      
      const updated = await User.findByIdAndUpdate(
        customers[i]._id,
        {
          $set: {
            name: name + (i >= greekCustomerNames.length ? ` ${Math.floor(i / greekCustomerNames.length) + 1}` : ''),
            address: address
          }
        },
        { new: true }
      );
      
      console.log(`✅ ${i + 1}. ${updated.name}`);
      console.log(`   Τηλ: ${updated.phone}`);
      console.log(`   Διεύθυνση: ${updated.address}\n`);
    }

    console.log('🎉 Όλοι οι πελάτες ενημερώθηκαν με ελληνικά δεδομένα!');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Σφάλμα:', error.message);
    process.exit(1);
  }
};

updateCustomers();
