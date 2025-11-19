const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' });

const Admin = require('../src/models/Admin');
const Store = require('../src/models/Store');
const Driver = require('../src/models/Driver');
const Order = require('../src/models/Order');
const User = require('../src/models/User');

const seedTestData = async () => {
  try {
    // Σύνδεση στη βάση
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Σύνδεση με MongoDB');

    // 1. Δημιουργία ή ενημέρωση Admin με plain text password (pre-save hook θα το hash-άρει)
    let admin = await Admin.findOne({ email: 'admin@fastdelivery.gr' });
    if (admin) {
      // Delete και recreate για να τρέξει το pre-save hook
      await Admin.deleteOne({ email: 'admin@fastdelivery.gr' });
    }
    admin = await Admin.create({
      email: 'admin@fastdelivery.gr',
      password: 'admin123',
      name: 'Διαχειριστής Συστήματος'
    });
    console.log('✅ Δημιουργήθηκε Admin: admin@fastdelivery.gr');

    // 2. Δημιουργία Καταστημάτων (ένα-ένα για να τρέξουν τα pre-save hooks)
    await Store.deleteMany({ email: { $in: ['kafeteria@test.com', 'minimarket@test.com', 'farmakeio@test.com', 'taverna@test.com', 'pending@test.com'] } });
    
    const store1 = await Store.create({
      email: 'kafeteria@test.com',
      password: 'store123',
      businessName: 'Καφετέρια Κεντρική',
      ownerName: 'Γιάννης Παπαδόπουλος',
      phone: '2310123456',
      address: 'Τσιμισκή 25, Θεσσαλονίκη',
      afm: '123456789',
      storeType: 'Καφετέρια',
      location: {
        type: 'Point',
        coordinates: [22.9444, 40.6401]
      },
      isApproved: true
    });
    
    const store2 = await Store.create({
      email: 'minimarket@test.com',
      password: 'store123',
      businessName: 'Mini Market Αγορά',
      ownerName: 'Μαρία Κωνσταντίνου',
      phone: '2310234567',
      address: 'Εγνατία 100, Θεσσαλονίκη',
      afm: '987654321',
      storeType: 'Mini Market',
      location: {
        type: 'Point',
        coordinates: [22.9500, 40.6450]
      },
      isApproved: true
    });
    
    const store3 = await Store.create({
      email: 'farmakeio@test.com',
      password: 'store123',
      businessName: 'Φαρμακείο Υγεία',
      ownerName: 'Δημήτρης Γεωργίου',
      phone: '2310345678',
      address: 'Μητροπόλεως 15, Θεσσαλονίκη',
      afm: '456789123',
      storeType: 'Φαρμακείο',
      location: {
        type: 'Point',
        coordinates: [22.9430, 40.6380]
      },
      isApproved: true
    });
    
    const store4 = await Store.create({
      email: 'taverna@test.com',
      password: 'store123',
      businessName: 'Ταβέρνα Ο Γιώργος',
      ownerName: 'Γιώργος Νικολάου',
      phone: '2310456789',
      address: 'Προξένου Κορομηλά 30, Θεσσαλονίκη',
      afm: '789123456',
      storeType: 'Ταβέρνα',
      location: {
        type: 'Point',
        coordinates: [22.9480, 40.6420]
      },
      isApproved: true
    });
    
    const store5 = await Store.create({
      email: 'pending@test.com',
      password: 'store123',
      businessName: 'Νέο Κατάστημα Σε Αναμονή',
      ownerName: 'Ελένη Αθανασίου',
      phone: '2310567890',
      address: 'Βασιλίσσης Όλγας 50, Θεσσαλονίκη',
      afm: '321654987',
      storeType: 'Άλλο',
      location: {
        type: 'Point',
        coordinates: [22.9520, 40.6390]
      },
      isApproved: false
    });
    
    const stores = [store1, store2, store3, store4, store5];
    console.log(`✅ Δημιουργήθηκαν ${stores.length} Καταστήματα`);

    // 3. Δημιουργία Οδηγών (ένα-ένα για να τρέξουν τα pre-save hooks)
    await Driver.deleteMany({ email: { $in: ['driver1@test.com', 'driver2@test.com', 'driver3@test.com', 'pendingdriver@test.com'] } });
    
    const driver1 = await Driver.create({
      email: 'driver1@test.com',
      password: 'driver123',
      name: 'Δημήτρης Ιωάννου',
      phone: '6971234567',
      vehicleType: 'Μοτοσυκλέτα',
      vehiclePlate: 'ΑΒΓ-1234',
      licenseNumber: 'ΑΜ123456',
      isApproved: true,
      isOnline: true
    });
    
    const driver2 = await Driver.create({
      email: 'driver2@test.com',
      password: 'driver123',
      name: 'Κώστας Παπαδόπουλος',
      phone: '6972345678',
      vehicleType: 'Αυτοκίνητο',
      vehiclePlate: 'ΔΕΖ-5678',
      licenseNumber: 'ΑΜ234567',
      isApproved: true,
      isOnline: true
    });
    
    const driver3 = await Driver.create({
      email: 'driver3@test.com',
      password: 'driver123',
      name: 'Νίκος Γεωργίου',
      phone: '6973456789',
      vehicleType: 'Μοτοσυκλέτα',
      vehiclePlate: 'ΗΘΙ-9012',
      licenseNumber: 'ΑΜ345678',
      isApproved: true,
      isOnline: false
    });
    
    const driver4 = await Driver.create({
      email: 'pendingdriver@test.com',
      password: 'driver123',
      name: 'Οδηγός Σε Αναμονή',
      phone: '6974567890',
      vehicleType: 'Ποδήλατο',
      vehiclePlate: 'Ν/Α',
      licenseNumber: 'ΑΜ456789',
      isApproved: false,
      isOnline: false
    });
    
    const drivers = [driver1, driver2, driver3, driver4];
    console.log(`✅ Δημιουργήθηκαν ${drivers.length} Οδηγοί`);

    // 4. Δημιουργία Πελατών
    const customers = await User.create([
      {
        name: 'Σάκης',
        phone: '6978799299',
        isActive: true
      },
      {
        name: 'Μαρία Κωνσταντίνου',
        phone: '6975123456',
        isActive: true
      },
      {
        name: 'Νίκος Αθανασίου',
        phone: '6976234567',
        isActive: true
      },
      {
        name: 'Ελένη Δημητρίου',
        phone: '6977345678',
        isActive: false
      }
    ]);
    console.log(`✅ Δημιουργήθηκαν ${customers.length} Πελάτες`);

    // 5. Δημιουργία Παραγγελιών με διαφορετικές καταστάσεις
    // ΣΗΜΕΙΩΣΗ: Το orderNumber δημιουργείται αυτόματα από το pre-save hook
    
    // Παραγγελία 1: Ολοκληρωμένη
    const order1 = await Order.create({
      customer: {
        name: 'Σάκης',
        phone: '6978799299',
        address: 'Αγιου Δημητρίου 9'
      },
      storeId: stores[0]._id,
      storeName: stores[0].businessName,
      orderType: 'text',
      orderContent: 'Καφέ Φραπέ, Τοστ με τυρί και ζαμπόν',
      status: 'completed',
      productPrice: 8.50,
      deliveryFee: 2.50,
      totalPrice: 11.00,
      driverId: drivers[0]._id,
      driverName: drivers[0].name,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 ώρες πριν
      completedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000)
    });

    // Παραγγελία 2: Σε παράδοση
    const order2 = await Order.create({
      customer: {
        name: 'Μαρία Κωνσταντίνου',
        phone: '6975123456',
        address: 'Βασιλίσσης Όλγας 45'
      },
      storeId: stores[1]._id,
      storeName: stores[1].businessName,
      orderType: 'text',
      orderContent: 'Γάλα, Ψωμί, Αυγά, Τυρί φέτα',
      status: 'in_delivery',
      productPrice: 12.00,
      deliveryFee: 3.00,
      totalPrice: 15.00,
      driverId: drivers[1]._id,
      driverName: drivers[1].name,
      createdAt: new Date(Date.now() - 30 * 60 * 1000) // 30 λεπτά πριν
    });

    // Παραγγελία 3: Προετοιμασία
    const order3 = await Order.create({
      customer: {
        name: 'Νίκος Αθανασίου',
        phone: '6976234567',
        address: 'Εγνατία 200'
      },
      storeId: stores[3]._id,
      storeName: stores[3].businessName,
      orderType: 'text',
      orderContent: 'Σουβλάκι χοιρινό x2, Πατάτες τηγανητές, Τζατζίκι',
      status: 'preparing',
      productPrice: 15.50,
      deliveryFee: 3.50,
      totalPrice: 19.00,
      driverId: drivers[0]._id,
      driverName: drivers[0].name,
      createdAt: new Date(Date.now() - 20 * 60 * 1000) // 20 λεπτά πριν
    });

    // Παραγγελία 4: Αναμονή επιβεβαίωσης πελάτη
    const order4 = await Order.create({
      customer: {
        name: 'Σάκης',
        phone: '6978799299',
        address: 'Αγιου Δημητρίου 9'
      },
      storeId: stores[0]._id,
      storeName: stores[0].businessName,
      orderType: 'text',
      orderContent: 'Καπουτσίνο, Κρουασάν με σοκολάτα',
      status: 'pending_customer_confirm',
      productPrice: 5.00,
      deliveryFee: 2.00,
      totalPrice: 7.00,
      createdAt: new Date(Date.now() - 10 * 60 * 1000) // 10 λεπτά πριν
    });

    // Παραγγελία 5: Εκκρεμεί Admin (να προσθέσει μεταφορικά)
    const order5 = await Order.create({
      customer: {
        name: 'Μαρία Κωνσταντίνου',
        phone: '6975123456',
        address: 'Τσιμισκή 100'
      },
      storeId: stores[2]._id,
      storeName: stores[2].businessName,
      orderType: 'text',
      orderContent: 'Depon, Βιταμίνη C, Μάσκες μιας χρήσης',
      status: 'pending_admin',
      productPrice: 18.00,
      createdAt: new Date(Date.now() - 8 * 60 * 1000) // 8 λεπτά πριν
    });

    // Παραγγελία 6: Τιμολόγηση (κατάστημα να βάλει τιμή)
    const order6 = await Order.create({
      customer: {
        name: 'Νίκος Αθανασίου',
        phone: '6976234567',
        address: 'Προξένου Κορομηλά 50'
      },
      storeId: stores[1]._id,
      storeName: stores[1].businessName,
      orderType: 'text',
      orderContent: 'Νερό 6άδα, Coca Cola 1.5L, Chips',
      status: 'pricing',
      createdAt: new Date(Date.now() - 5 * 60 * 1000) // 5 λεπτά πριν
    });

    // Παραγγελία 7: Νέα (αναμονή καταστήματος)
    const order7 = await Order.create({
      customer: {
        name: 'Ελένη Δημητρίου',
        phone: '6977345678',
        address: 'Μητροπόλεως 30'
      },
      storeId: stores[0]._id,
      storeName: stores[0].businessName,
      orderType: 'text',
      orderContent: 'Φρεντό Εσπρέσο, Σαλάτα Caesar',
      status: 'pending_store',
      createdAt: new Date(Date.now() - 2 * 60 * 1000) // 2 λεπτά πριν
    });

    // Παραγγελία 8: Ακυρωμένη
    const order8 = await Order.create({
      customer: {
        name: 'Σάκης',
        phone: '6978799299',
        address: 'Αγιου Δημητρίου 9'
      },
      storeId: stores[3]._id,
      storeName: stores[3].businessName,
      orderType: 'text',
      orderContent: 'Γύρος χοιρινός με πίτα',
      status: 'cancelled',
      productPrice: 4.50,
      deliveryFee: 2.00,
      totalPrice: 6.50,
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 ώρες πριν
      cancelledAt: new Date(Date.now() - 2.8 * 60 * 60 * 1000)
    });

    const createdOrders = [order1, order2, order3, order4, order5, order6, order7, order8];
    console.log(`✅ Δημιουργήθηκαν ${createdOrders.length} Παραγγελίες`);

    console.log('\n📊 Περίληψη Test Data:');
    console.log('─────────────────────────');
    console.log(`👤 Admins: 1`);
    console.log(`🏪 Καταστήματα: ${stores.length} (${stores.filter(s => s.isApproved).length} εγκεκριμένα)`);
    console.log(`🚗 Οδηγοί: ${drivers.length} (${drivers.filter(d => d.isApproved).length} εγκεκριμένοι, ${drivers.filter(d => d.isOnline).length} online)`);
    console.log(`👥 Πελάτες: ${customers.length}`);
    console.log(`📦 Παραγγελίες: ${createdOrders.length}`);
    console.log('   - Ολοκληρωμένες: 1');
    console.log('   - Σε παράδοση: 1');
    console.log('   - Προετοιμασία: 1');
    console.log('   - Αναμονή πελάτη: 1');
    console.log('   - Εκκρεμεί Admin: 1');
    console.log('   - Τιμολόγηση: 1');
    console.log('   - Νέες: 1');
    console.log('   - Ακυρωμένες: 1');
    console.log('─────────────────────────');
    console.log('\n✅ Test data δημιουργήθηκαν επιτυχώς!');
    console.log('\n📝 Credentials:');
    console.log('Admin: admin@fastdelivery.gr / admin123');
    console.log('Store: kafeteria@test.com / store123');
    console.log('Driver: driver1@test.com / driver123');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Σφάλμα:', error);
    process.exit(1);
  }
};

seedTestData();
