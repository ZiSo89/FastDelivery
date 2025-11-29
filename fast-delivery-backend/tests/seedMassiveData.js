/**
 * Massive Data Seed Script
 * 
 * Δημιουργεί ρεαλιστικά δεδομένα για 2 χρόνια λειτουργίας:
 * - 30 καταστήματα
 * - 10 οδηγούς
 * - 500 πελάτες
 * - ~50,000 παραγγελίες
 * 
 * Run: node tests/seedMassiveData.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Order = require('../src/models/Order');
const Customer = require('../src/models/Customer');
const Store = require('../src/models/Store');
const Driver = require('../src/models/Driver');

// ============== CONFIGURATION ==============
const CONFIG = {
  YEARS_OF_DATA: 2,
  TARGET_STORES: 30,
  TARGET_DRIVERS: 10,
  TARGET_CUSTOMERS: 500,
  CANCELLATION_RATE: 0.05, // 5%
  BASE_ORDERS_PER_DAY: 70, // Μέση τιμή για 2 χρόνια
};

// Ελληνικά ονόματα
const FIRST_NAMES = [
  'Γιάννης', 'Μαρία', 'Κώστας', 'Ελένη', 'Δημήτρης', 'Αγγελική', 'Νίκος', 'Σοφία',
  'Παναγιώτης', 'Αικατερίνη', 'Γεώργιος', 'Βασιλική', 'Χρήστος', 'Ευαγγελία', 'Αθανάσιος',
  'Παρασκευή', 'Ιωάννης', 'Δέσποινα', 'Μιχάλης', 'Σταυρούλα', 'Αλέξανδρος', 'Θεοδώρα',
  'Σπύρος', 'Χριστίνα', 'Βασίλης', 'Άννα', 'Πέτρος', 'Ειρήνη', 'Θανάσης', 'Μαργαρίτα'
];

const LAST_NAMES = [
  'Παπαδόπουλος', 'Παπανικολάου', 'Γεωργίου', 'Νικολάου', 'Βασιλείου', 'Κωνσταντίνου',
  'Δημητρίου', 'Αθανασίου', 'Ιωάννου', 'Χριστοδούλου', 'Αλεξίου', 'Μιχαηλίδης',
  'Καραγιάννης', 'Παπαγεωργίου', 'Οικονόμου', 'Σταματίου', 'Αντωνίου', 'Μακρής',
  'Παππάς', 'Σπυρόπουλος', 'Καλλίρης', 'Πετρίδης', 'Χατζής', 'Τσακίρης', 'Μαυρίδης'
];

const STREET_NAMES = [
  'Λεωφόρος Δημοκρατίας', '14ης Μαΐου', 'Βενιζέλου', 'Κύπρου', 'Αγίου Δημητρίου',
  'Παλαιολόγου', 'Μεγάλου Αλεξάνδρου', 'Διονυσίου Σολωμού', 'Εθνικής Αντίστασης',
  'Ιουστινιανού', 'Καραϊσκάκη', 'Κουντουριώτη', 'Ελευθερίου Βενιζέλου', 'Φιλελλήνων',
  'Μακεδονίας', 'Θράκης', 'Αριστοτέλους', 'Πλάτωνος', 'Σωκράτους', 'Περικλέους'
];

// Τύποι καταστημάτων με προϊόντα
const STORE_TYPES = {
  'Καφετέρια': {
    names: ['Espresso House', 'Coffee Lab', 'Aroma Café', 'The Daily Grind', 'Καφέ Νέον'],
    products: [
      { name: 'Καφέ Φραπέ', price: 2.50 },
      { name: 'Καπουτσίνο', price: 3.00 },
      { name: 'Φρέντο Εσπρέσο', price: 3.50 },
      { name: 'Σοκολάτα ζεστή', price: 3.00 },
      { name: 'Τοστ με τυρί-ζαμπόν', price: 3.50 },
      { name: 'Club Sandwich', price: 5.50 },
      { name: 'Χυμός πορτοκάλι', price: 3.00 }
    ]
  },
  'Mini Market': {
    names: ['Express Market', 'Αγορά 24', 'Quick Stop', 'Γωνιακό', 'My Market'],
    products: [
      { name: 'Γάλα 1L', price: 1.80 },
      { name: 'Ψωμί', price: 1.50 },
      { name: 'Αυγά 6άδα', price: 3.50 },
      { name: 'Τυρί φέτα 400γρ', price: 5.00 },
      { name: 'Νερό 6άδα', price: 2.50 },
      { name: 'Coca Cola 1.5L', price: 2.20 }
    ]
  },
  'Φαρμακείο': {
    names: ['Φαρμακείο Υγεία', 'Ηλιος Pharmacy', 'Φαρμακείο Κεντρικό', 'PharmaPlus'],
    products: [
      { name: 'Depon 500mg', price: 3.50 },
      { name: 'Βιταμίνη C', price: 8.00 },
      { name: 'Αντισηπτικό χεριών', price: 4.00 },
      { name: 'Παυσίπονο', price: 4.50 },
      { name: 'Σιρόπι για βήχα', price: 7.00 }
    ]
  },
  'Ταβέρνα': {
    names: ['Ο Γιώργος', 'Παραδοσιακή Γωνιά', 'Τα Κύματα', 'Μεζεδοπωλείο Θράκη', 'Η Παλιά Αυλή'],
    products: [
      { name: 'Σουβλάκι χοιρινό', price: 3.00 },
      { name: 'Γύρος πίτα', price: 3.50 },
      { name: 'Μερίδα πατάτες', price: 3.00 },
      { name: 'Σαλάτα χωριάτικη', price: 6.00 },
      { name: 'Μουσακάς', price: 9.00 },
      { name: 'Μπριζόλα χοιρινή', price: 12.00 }
    ]
  },
  'Γλυκά': {
    names: ['Sweet Corner', 'Ζαχαροπλαστείο Άρωμα', 'Γλυκές Στιγμές', 'La Dolce Vita'],
    products: [
      { name: 'Γαλακτομπούρεκο', price: 4.00 },
      { name: 'Μπακλαβάς', price: 4.50 },
      { name: 'Προφιτερόλ', price: 5.00 },
      { name: 'Τούρτα σοκολάτα', price: 5.50 },
      { name: 'Παγωτό 2 μπάλες', price: 3.50 }
    ]
  },
  'Πιτσαρία': {
    names: ['Pizza Roma', 'Napoli Express', 'Pizza House', 'Italian Corner'],
    products: [
      { name: 'Μαργαρίτα', price: 8.00 },
      { name: 'Πεπερόνι', price: 10.00 },
      { name: 'Special', price: 12.00 },
      { name: 'Calzone', price: 9.00 }
    ]
  }
};

// Helpers
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomPhone = () => `69${randomBetween(70, 79)}${String(randomBetween(100000, 999999))}`;

// Generate random coordinates near Alexandroupoli
const randomLocation = () => ({
  type: 'Point',
  coordinates: [
    25.87 + (Math.random() - 0.5) * 0.04, // lng
    40.845 + (Math.random() - 0.5) * 0.02  // lat
  ]
});

// Generate order number
const generateOrderNumber = (date, index) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `ORD-${y}${m}${d}-${String(index).padStart(4, '0')}`;
};

// Get seasonal multiplier
const getSeasonalMultiplier = (date) => {
  const month = date.getMonth();
  const dayOfWeek = date.getDay();
  
  let multiplier = 1.0;
  
  // Καλοκαίρι (τουρισμός)
  if (month >= 5 && month <= 8) multiplier *= 1.4;
  // Χειμώνας
  if (month >= 11 || month <= 1) multiplier *= 0.8;
  // Σαββατοκύριακο
  if (dayOfWeek === 0 || dayOfWeek === 6) multiplier *= 1.3;
  
  return multiplier;
};

// Generate order content
const generateOrderContent = (storeType) => {
  const products = STORE_TYPES[storeType]?.products || STORE_TYPES['Καφετέρια'].products;
  const numItems = randomBetween(1, 4);
  const items = [];
  let totalPrice = 0;

  for (let i = 0; i < numItems; i++) {
    const product = randomChoice(products);
    const quantity = randomBetween(1, 2);
    items.push(`${product.name}${quantity > 1 ? ' x' + quantity : ''}`);
    totalPrice += product.price * quantity;
  }

  return {
    content: items.join(', '),
    productPrice: Math.round(totalPrice * 100) / 100
  };
};

// ============== MAIN FUNCTION ==============
async function seedMassiveData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Σύνδεση με MongoDB\n');

    // ============== STEP 1: Load existing data ==============
    console.log('📊 Φόρτωση υπαρχόντων δεδομένων...');
    let existingStores = await Store.find({});
    let existingDrivers = await Driver.find({});
    let existingCustomers = await Customer.find({});
    
    console.log(`   Καταστήματα: ${existingStores.length}`);
    console.log(`   Οδηγοί: ${existingDrivers.length}`);
    console.log(`   Πελάτες: ${existingCustomers.length}`);

    // ============== STEP 2: Create additional stores ==============
    const storesToCreate = CONFIG.TARGET_STORES - existingStores.length;
    if (storesToCreate > 0) {
      console.log(`\n🏪 Δημιουργία ${storesToCreate} επιπλέον καταστημάτων...`);
      
      const storeTypes = Object.keys(STORE_TYPES);
      const newStores = [];
      
      for (let i = 0; i < storesToCreate; i++) {
        const storeType = storeTypes[i % storeTypes.length];
        const typeData = STORE_TYPES[storeType];
        const storeName = `${randomChoice(typeData.names)} ${i + 1}`;
        
        newStores.push({
          email: `store${existingStores.length + i + 1}@test.com`,
          password: await bcrypt.hash('store123', 10),
          businessName: storeName,
          ownerName: `${randomChoice(FIRST_NAMES)} ${randomChoice(LAST_NAMES)}`,
          phone: `2551${randomBetween(10000, 99999)}`,
          address: `${randomChoice(STREET_NAMES)} ${randomBetween(1, 150)}, Αλεξανδρούπολη`,
          afm: String(randomBetween(100000000, 999999999)),
          storeType: storeType,
          location: randomLocation(),
          isApproved: true,
          status: 'approved',
          isEmailVerified: true,
          workingHours: '08:00 - 23:00'
        });
      }
      
      await Store.insertMany(newStores);
      existingStores = await Store.find({ isApproved: true });
      console.log(`   ✅ Συνολικά καταστήματα: ${existingStores.length}`);
    }

    // ============== STEP 3: Create additional drivers ==============
    const driversToCreate = CONFIG.TARGET_DRIVERS - existingDrivers.length;
    if (driversToCreate > 0) {
      console.log(`\n🚗 Δημιουργία ${driversToCreate} επιπλέον οδηγών...`);
      
      const vehicleTypes = ['Μοτοσυκλέτα', 'Αυτοκίνητο', 'Ποδήλατο'];
      const newDrivers = [];
      
      for (let i = 0; i < driversToCreate; i++) {
        const firstName = randomChoice(FIRST_NAMES);
        const lastName = randomChoice(LAST_NAMES);
        
        newDrivers.push({
          email: `driver${existingDrivers.length + i + 1}@test.com`,
          password: await bcrypt.hash('driver123', 10),
          name: `${firstName} ${lastName}`,
          phone: randomPhone(),
          vehicleType: randomChoice(vehicleTypes),
          vehiclePlate: `${String.fromCharCode(65 + randomBetween(0, 25))}${String.fromCharCode(65 + randomBetween(0, 25))}${String.fromCharCode(65 + randomBetween(0, 25))}-${randomBetween(1000, 9999)}`,
          licenseNumber: `ΑΜ${randomBetween(100000, 999999)}`,
          isApproved: true,
          status: 'approved',
          isEmailVerified: true,
          isOnline: Math.random() > 0.3
        });
      }
      
      await Driver.insertMany(newDrivers);
      existingDrivers = await Driver.find({ isApproved: true });
      console.log(`   ✅ Συνολικά οδηγοί: ${existingDrivers.length}`);
    }

    // ============== STEP 4: Create additional customers ==============
    const customersToCreate = CONFIG.TARGET_CUSTOMERS - existingCustomers.length;
    if (customersToCreate > 0) {
      console.log(`\n👥 Δημιουργία ${customersToCreate} επιπλέον πελατών...`);
      
      const newCustomers = [];
      for (let i = 0; i < customersToCreate; i++) {
        const firstName = randomChoice(FIRST_NAMES);
        const lastName = randomChoice(LAST_NAMES);
        
        newCustomers.push({
          name: `${firstName} ${lastName}`,
          email: `customer${existingCustomers.length + i + 1}@test.com`,
          password: await bcrypt.hash('customer123', 10),
          phone: randomPhone(),
          address: `${randomChoice(STREET_NAMES)} ${randomBetween(1, 200)}, Αλεξανδρούπολη`,
          location: randomLocation(),
          isActive: true,
          isEmailVerified: true
        });
        
        // Progress every 100
        if ((i + 1) % 100 === 0) {
          console.log(`   ... ${i + 1}/${customersToCreate}`);
        }
      }
      
      await Customer.insertMany(newCustomers);
      existingCustomers = await Customer.find({ isActive: true });
      console.log(`   ✅ Συνολικά πελάτες: ${existingCustomers.length}`);
    }

    // ============== STEP 5: Delete old orders ==============
    console.log('\n🗑️  Διαγραφή παλιών παραγγελιών...');
    const deletedOrders = await Order.deleteMany({});
    console.log(`   ✅ Διαγράφηκαν ${deletedOrders.deletedCount} παραγγελίες`);

    // ============== STEP 6: Generate orders ==============
    console.log(`\n📦 Δημιουργία παραγγελιών για ${CONFIG.YEARS_OF_DATA} χρόνια...`);
    
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 1); // Χθες
    
    const startDate = new Date(endDate);
    startDate.setFullYear(startDate.getFullYear() - CONFIG.YEARS_OF_DATA);
    
    const approvedStores = existingStores.filter(s => s.isApproved);
    const approvedDrivers = existingDrivers.filter(d => d.isApproved);
    const activeCustomers = existingCustomers.filter(c => c.isActive);
    
    let totalOrders = 0;
    let batchOrders = [];
    const BATCH_SIZE = 1000;
    
    // Iterate through each day
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const multiplier = getSeasonalMultiplier(d);
      const ordersToday = Math.floor(CONFIG.BASE_ORDERS_PER_DAY * multiplier * (0.8 + Math.random() * 0.4));
      
      let dailyOrderIndex = 1;
      
      for (let i = 0; i < ordersToday; i++) {
        const customer = randomChoice(activeCustomers);
        const store = randomChoice(approvedStores);
        const driver = randomChoice(approvedDrivers);
        
        // Random time between 8:00 and 22:00
        const orderTime = new Date(d);
        orderTime.setHours(randomBetween(8, 21), randomBetween(0, 59), 0, 0);
        
        const { content, productPrice } = generateOrderContent(store.storeType);
        const deliveryFee = Math.round((randomBetween(15, 40) / 10) * 100) / 100;
        const totalPrice = Math.round((productPrice + deliveryFee) * 100) / 100;
        
        // 5% cancellation rate
        const isCancelled = Math.random() < CONFIG.CANCELLATION_RATE;
        
        const completedAt = new Date(orderTime);
        completedAt.setMinutes(completedAt.getMinutes() + randomBetween(20, 50));
        
        batchOrders.push({
          orderNumber: generateOrderNumber(d, dailyOrderIndex++),
          customer: {
            customerId: customer._id,
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            address: customer.address
          },
          storeId: store._id,
          storeName: store.businessName,
          orderType: 'text',
          orderContent: content,
          status: isCancelled ? 'cancelled' : 'completed',
          productPrice,
          deliveryFee,
          totalPrice,
          driverId: driver._id,
          driverName: driver.name,
          createdAt: orderTime,
          completedAt: isCancelled ? null : completedAt,
          cancelledAt: isCancelled ? completedAt : null
        });
        
        totalOrders++;
        
        // Insert batch
        if (batchOrders.length >= BATCH_SIZE) {
          await Order.insertMany(batchOrders);
          console.log(`   ✅ ${totalOrders} παραγγελίες...`);
          batchOrders = [];
        }
      }
    }
    
    // Insert remaining
    if (batchOrders.length > 0) {
      await Order.insertMany(batchOrders);
    }
    
    console.log(`   ✅ Συνολικά: ${totalOrders} παραγγελίες`);

    // ============== STEP 7: Statistics ==============
    console.log('\n═══════════════════════════════════════');
    console.log('📊 ΤΕΛΙΚΑ ΣΤΑΤΙΣΤΙΚΑ');
    console.log('═══════════════════════════════════════');
    
    const stats = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: { $sum: '$totalPrice' }
        }
      }
    ]);
    
    stats.forEach(s => {
      console.log(`   ${s._id}: ${s.count} παραγγελίες, €${s.revenue?.toFixed(2) || 0}`);
    });
    
    const totalRevenue = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    
    console.log('───────────────────────────────────────');
    console.log(`   🏪 Καταστήματα: ${approvedStores.length}`);
    console.log(`   🚗 Οδηγοί: ${approvedDrivers.length}`);
    console.log(`   👥 Πελάτες: ${activeCustomers.length}`);
    console.log(`   📦 Παραγγελίες: ${totalOrders}`);
    console.log(`   💰 Συνολικά έσοδα: €${totalRevenue[0]?.total?.toFixed(2) || 0}`);
    console.log('═══════════════════════════════════════');
    
    console.log('\n✅ Ολοκληρώθηκε επιτυχώς!');
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Σφάλμα:', error);
    process.exit(1);
  }
}

seedMassiveData();
