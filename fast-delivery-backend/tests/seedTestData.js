const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config(); // Default looks for .env in CWD

const Admin = require('../src/models/Admin');
const Store = require('../src/models/Store');
const Driver = require('../src/models/Driver');
const Order = require('../src/models/Order');
const Customer = require('../src/models/Customer');

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
    await Store.deleteMany({});
    
    const store1 = await Store.create({
      email: 'kafeteria@test.com',
      password: 'store123',
      businessName: 'Καφετέρια Κεντρική',
      ownerName: 'Γιάννης Παπαδόπουλος',
      phone: '2551012345',
      address: 'Λεωφόρος Δημοκρατίας 25, Αλεξανδρούπολη',
      afm: '123456789',
      storeType: 'Καφετέρια',
      location: {
        type: 'Point',
        coordinates: [25.8739, 40.8457]
      },
      isApproved: true,
      status: 'approved',
      workingHours: '08:00 - 22:00'
    });
    
    const store2 = await Store.create({
      email: 'minimarket@test.com',
      password: 'store123',
      businessName: 'Mini Market Αγορά',
      ownerName: 'Μαρία Κωνσταντίνου',
      phone: '2551023456',
      address: '14ης Μαΐου 10, Αλεξανδρούπολη',
      afm: '987654321',
      storeType: 'Mini Market',
      location: {
        type: 'Point',
        coordinates: [25.8750, 40.8460]
      },
      isApproved: true,
      status: 'approved',
      workingHours: '07:00 - 23:00'
    });
    
    const store3 = await Store.create({
      email: 'farmakeio@test.com',
      password: 'store123',
      businessName: 'Φαρμακείο Υγεία',
      ownerName: 'Δημήτρης Γεωργίου',
      phone: '2551034567',
      address: 'Βενιζέλου 15, Αλεξανδρούπολη',
      afm: '456789123',
      storeType: 'Φαρμακείο',
      location: {
        type: 'Point',
        coordinates: [25.8720, 40.8440]
      },
      isApproved: true,
      status: 'approved',
      workingHours: '08:30 - 21:00'
    });
    
    const store4 = await Store.create({
      email: 'taverna@test.com',
      password: 'store123',
      businessName: 'Ταβέρνα Ο Γιώργος',
      ownerName: 'Γιώργος Νικολάου',
      phone: '2551045678',
      address: 'Παραλιακή Οδός 30, Αλεξανδρούπολη',
      afm: '789123456',
      storeType: 'Ταβέρνα',
      location: {
        type: 'Point',
        coordinates: [25.8700, 40.8430]
      },
      isApproved: true,
      status: 'approved',
      workingHours: '12:00 - 00:00'
    });

    const store5 = await Store.create({
      email: 'sweets@test.com',
      password: 'store123',
      businessName: 'Γλυκοπωλείο Η Απόλαυση',
      ownerName: 'Ελένη Παπαδοπούλου',
      phone: '2551056789',
      address: 'Ιωακείμ Καβύρη 5, Αλεξανδρούπολη',
      afm: '321654987',
      storeType: 'Γλυκά', // Updated to specific type
      location: {
        type: 'Point',
        coordinates: [25.8745, 40.8455]
      },
      isApproved: true,
      status: 'approved',
      workingHours: '09:00 - 22:00'
    });
    
    const store6 = await Store.create({
      email: 'pending@test.com',
      password: 'store123',
      businessName: 'Νέο Κατάστημα Σε Αναμονή',
      ownerName: 'Ελένη Αθανασίου',
      phone: '2551067890',
      address: 'Μαζαράκη 50, Αλεξανδρούπολη',
      afm: '147258369',
      storeType: 'Άλλο',
      location: {
        type: 'Point',
        coordinates: [25.8760, 40.8470]
      },
      isApproved: false
    });

    const storeGraz = await Store.create({
      email: 'graz@test.com',
      password: 'store123',
      businessName: 'Graz Test Store',
      ownerName: 'Hans Muller',
      phone: '43123456789',
      address: 'Herrengasse 1, Graz',
      afm: '999999999',
      storeType: 'Καφετέρια',
      location: {
        type: 'Point',
        coordinates: [15.4307936, 47.0734004]
      },
      isApproved: true,
      status: 'approved',
      workingHours: '08:00 - 22:00'
    });
    
    const stores = [store1, store2, store3, store4, store5, store6, storeGraz];
    console.log(`✅ Δημιουργήθηκαν ${stores.length} Καταστήματα`);

    // 3. Δημιουργία Οδηγών (ένα-ένα για να τρέξουν τα pre-save hooks)
    await Driver.deleteMany({});
    
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
    await Customer.deleteMany({});
    
    const customer1 = await Customer.create({
      name: 'Σάκης Ζήσογλου',
      email: 'sakis@test.com',
      password: 'password123',
      phone: '6978799299',
      address: 'Αγίου Δημητρίου 9, Αλεξανδρούπολη',
      isActive: true
    });

    const customer2 = await Customer.create({
      name: 'Μαρία Κωνσταντίνου',
      email: 'maria@test.com',
      password: 'password123',
      phone: '6975123456',
      address: '14ης Μαΐου 45, Αλεξανδρούπολη',
      isActive: true
    });

    const customer3 = await Customer.create({
      name: 'Νίκος Αθανασίου',
      email: 'nikos@test.com',
      password: 'password123',
      phone: '6976234567',
      address: 'Λεωφόρος Δημοκρατίας 200, Αλεξανδρούπολη',
      isActive: true
    });

    const customer4 = await Customer.create({
      name: 'Ελένη Δημητρίου',
      email: 'eleni@test.com',
      password: 'password123',
      phone: '6977345678',
      address: 'Βενιζέλου 30, Αλεξανδρούπολη',
      isActive: false
    });

    const customers = [customer1, customer2, customer3, customer4];
    console.log(`✅ Δημιουργήθηκαν ${customers.length} Πελάτες`);

    // 5. Δημιουργία Παραγγελιών με διαφορετικές καταστάσεις
    await Order.deleteMany({});
    
    // Παραγγελία 1: Ολοκληρωμένη
    const order1 = await Order.create({
      customer: {
        name: customer1.name,
        phone: customer1.phone,
        email: customer1.email,
        address: customer1.address
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
        name: customer2.name,
        phone: customer2.phone,
        email: customer2.email,
        address: customer2.address
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
        name: customer3.name,
        phone: customer3.phone,
        email: customer3.email,
        address: customer3.address
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
        name: customer1.name,
        phone: customer1.phone,
        email: customer1.email,
        address: customer1.address
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
        name: customer2.name,
        phone: customer2.phone,
        email: customer2.email,
        address: customer2.address
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
        name: customer3.name,
        phone: customer3.phone,
        email: customer3.email,
        address: customer3.address
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
        name: customer4.name,
        phone: customer4.phone,
        email: customer4.email,
        address: customer4.address
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
        name: customer1.name,
        phone: customer1.phone,
        email: customer1.email,
        address: customer1.address
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
    console.log('─────────────────────────');
    console.log('\n✅ Test data δημιουργήθηκαν επιτυχώς!');
    console.log('\n📝 Credentials:');
    console.log('Admin: admin@fastdelivery.gr / admin123');
    console.log('Store: kafeteria@test.com / store123');
    console.log('Driver: driver1@test.com / driver123');
    console.log('Customer: sakis@test.com / password123');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Σφάλμα:', error);
    process.exit(1);
  }
};

seedTestData();
