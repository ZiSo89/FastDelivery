const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');

const updateSpecificCustomer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Συνδέθηκε στη MongoDB\n');

    const updated = await User.findOneAndUpdate(
      { phone: '6977123456' },
      {
        $set: {
          name: 'Νίκος Ιωάννου',
          address: 'Κων/νου Παλαιολόγου 10, Αλεξανδρούπολη'
        }
      },
      { new: true }
    );

    if (updated) {
      console.log('✅ Ενημερώθηκε ο πελάτης:');
      console.log('   Όνομα:', updated.name);
      console.log('   Τηλέφωνο:', updated.phone);
      console.log('   Διεύθυνση:', updated.address);
      console.log('\n🎉 Ολοκληρώθηκε!');
    } else {
      console.log('❌ Δε βρέθηκε πελάτης με τηλέφωνο: 6977123456');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Σφάλμα:', error.message);
    process.exit(1);
  }
};

updateSpecificCustomer();
