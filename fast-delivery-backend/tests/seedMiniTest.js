/**
 * Mini Test Seed Script - Αλεξανδρούπολη
 * 
 * Δοκιμαστικό με λίγα δεδομένα για να επιβεβαιώσουμε ότι δουλεύει:
 * - 5 επιπλέον καταστήματα
 * - 3 επιπλέον οδηγούς  
 * - 20 επιπλέον πελάτες
 * - ~500 παραγγελίες (1 εβδομάδα)
 * 
 * ✅ Όλα τα πεδία συμπληρωμένα
 * ✅ isEmailVerified: true
 * ✅ Δεδομένα Αλεξανδρούπολης
 * 
 * Run: node tests/seedMiniTest.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Order = require('../src/models/Order');
const Customer = require('../src/models/Customer');
const Store = require('../src/models/Store');
const Driver = require('../src/models/Driver');

// ============== MINI CONFIGURATION ==============
const CONFIG = {
  DAYS_OF_DATA: 7, // 1 εβδομάδα
  EXTRA_STORES: 5,
  EXTRA_DRIVERS: 3,
  EXTRA_CUSTOMERS: 20,
  ORDERS_PER_DAY: 70,
  CANCELLATION_RATE: 0.05,
};

// ============== ΑΛΕΞΑΝΔΡΟΥΠΟΛΗ DATA ==============
// Κέντρο: 25.8743, 40.8476
const ALEXANDROUPOLI = {
  CENTER_LNG: 25.8743,
  CENTER_LAT: 40.8476,
  RADIUS_LNG: 0.03, // ~2.5km
  RADIUS_LAT: 0.015
};

// Ελληνικά ονόματα
const FIRST_NAMES = ['Γιάννης', 'Μαρία', 'Κώστας', 'Ελένη', 'Δημήτρης', 'Νίκος', 'Σοφία', 'Παναγιώτης', 'Αναστασία', 'Βασίλης'];
const LAST_NAMES = ['Παπαδόπουλος', 'Γεωργίου', 'Νικολάου', 'Βασιλείου', 'Κωνσταντίνου', 'Δημητρίου', 'Ιωάννου', 'Χατζής'];

// Πραγματικοί δρόμοι Αλεξανδρούπολης
const STREETS = [
  'Λεωφόρος Δημοκρατίας',
  'Οδός 14ης Μαΐου',
  'Κύπρου',
  'Λεωφόρος Μάκρης',
  'Διονυσίου Σολωμού',
  'Εθνικής Αντίστασης',
  'Παλαιολόγου',
  'Μιαούλη',
  'Κουντουριώτου',
  'Αγίου Δημητρίου',
  'Βενιζέλου',
  'Καραολή & Δημητρίου'
];

const AREAS = ['Κέντρο', 'Νέα Χιλή', 'Άνθεια', 'Μαΐστρος', 'Απαλός'];

const STORE_TYPES = {
  'Καφετέρια': {
    names: ['Espresso House', 'Coffee Lab', 'Café Aegean', 'Θρακικό Καφέ'],
    descriptions: ['Specialty coffee & snacks', 'Καφές, γλυκά και ελαφρά γεύματα', 'Ο καλύτερος καφές στην πόλη'],
    products: [
      { name: 'Καφέ Φραπέ', price: 2.50 },
      { name: 'Καπουτσίνο', price: 3.00 },
      { name: 'Freddo Espresso', price: 3.20 },
      { name: 'Τοστ Κλασικό', price: 3.50 },
      { name: 'Κρουασάν σοκολάτα', price: 2.80 }
    ]
  },
  'Ταβέρνα': {
    names: ['Ο Γιώργος', 'Τα Κύματα', 'Θρακιώτικη Γωνιά', 'Του Ψαρά'],
    descriptions: ['Παραδοσιακή ελληνική κουζίνα', 'Θρακιώτικες σπεσιαλιτέ', 'Φρέσκα θαλασσινά καθημερινά'],
    products: [
      { name: 'Σουβλάκι χοιρινό', price: 3.00 },
      { name: 'Γύρος πίτα', price: 3.50 },
      { name: 'Μερίδα Μουσακά', price: 8.50 },
      { name: 'Χωριάτικη σαλάτα', price: 6.00 },
      { name: 'Μπριζόλα χοιρινή', price: 12.00 }
    ]
  },
  'Πιτσαρία': {
    names: ['Pizza Roma', 'Napoli Express', 'Πίτσα Αλεξ'],
    descriptions: ['Αυθεντική ιταλική πίτσα', 'Πίτσα σε ξυλόφουρνο', 'Delivery σε 30 λεπτά'],
    products: [
      { name: 'Πίτσα Μαργαρίτα', price: 7.50 },
      { name: 'Πίτσα Special', price: 10.00 },
      { name: 'Πίτσα Πεπερόνι', price: 9.00 },
      { name: 'Calzone', price: 8.50 }
    ]
  }
};

const VEHICLES = [
  { type: 'Μοτοσυκλέτα', plates: ['ΡΟΕ', 'ΡΟΜ', 'ΡΟΝ'] },
  { type: 'Αυτοκίνητο', plates: ['ΕΒΡ', 'ΡΟΔ'] },
  { type: 'Ποδήλατο', plates: null }
];

// ============== HELPERS ==============
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomPhone = () => `69${randomBetween(70, 99)}${String(randomBetween(100000, 999999))}`;
const randomLandline = () => `2551${randomBetween(10000, 99999)}`;

// Τυχαία τοποθεσία στην Αλεξανδρούπολη
const randomLocation = () => ({
  type: 'Point',
  coordinates: [
    ALEXANDROUPOLI.CENTER_LNG + (Math.random() - 0.5) * 2 * ALEXANDROUPOLI.RADIUS_LNG,
    ALEXANDROUPOLI.CENTER_LAT + (Math.random() - 0.5) * 2 * ALEXANDROUPOLI.RADIUS_LAT
  ]
});

// Τυχαία διεύθυνση
const randomAddress = () => {
  const street = randomChoice(STREETS);
  const num = randomBetween(1, 150);
  const area = randomChoice(AREAS);
  return `${street} ${num}, ${area}, Αλεξανδρούπολη 68100`;
};

// Τυχαίο ΑΦΜ (9 ψηφία)
const randomAFM = () => String(randomBetween(100000000, 999999999));

// Τυχαίο ωράριο
const randomWorkingHours = () => {
  const options = [
    'Δευ-Παρ: 08:00-22:00, Σαβ: 09:00-23:00',
    'Καθημερινά: 10:00-24:00',
    'Δευ-Κυρ: 07:00-23:00',
    '24 ώρες'
  ];
  return randomChoice(options);
};

// Global counter for unique order numbers
let globalOrderCounter = 0;

const generateOrderNumber = (date, index) => {
  globalOrderCounter++;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const timestamp = Date.now().toString().slice(-4);
  return `ORD-${y}${m}${d}-${String(index).padStart(4, '0')}-${timestamp}${globalOrderCounter}`;
};

const generateOrderContent = (storeType) => {
  const typeData = STORE_TYPES[storeType] || STORE_TYPES['Καφετέρια'];
  const numItems = randomBetween(1, 4);
  const items = [];
  let totalPrice = 0;

  for (let i = 0; i < numItems; i++) {
    const product = randomChoice(typeData.products);
    const qty = randomBetween(1, 2);
    items.push(`${qty}x ${product.name}`);
    totalPrice += product.price * qty;
  }

  return { content: items.join(', '), productPrice: Math.round(totalPrice * 100) / 100 };
};

// ============== MAIN ==============
async function seedMiniTest() {
  console.log('🧪 MINI TEST SEED - Αλεξανδρούπολη\n');
  console.log('═══════════════════════════════════════════');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Σύνδεση με MongoDB\n');

    // Count existing
    const existingStores = await Store.find({ isApproved: true });
    const existingDrivers = await Driver.find({ isApproved: true });
    const existingCustomers = await Customer.find({ isActive: true });
    const existingOrders = await Order.countDocuments();
    
    console.log('📊 Υπάρχοντα δεδομένα:');
    console.log(`   Καταστήματα: ${existingStores.length}`);
    console.log(`   Οδηγοί: ${existingDrivers.length}`);
    console.log(`   Πελάτες: ${existingCustomers.length}`);
    console.log(`   Παραγγελίες: ${existingOrders}`);

    // ===== CREATE STORES =====
    console.log(`\n🏪 Δημιουργία ${CONFIG.EXTRA_STORES} καταστημάτων...`);
    const newStores = [];
    const storeTypes = Object.keys(STORE_TYPES);
    const hashedPassword = await bcrypt.hash('store123', 10);
    
    for (let i = 0; i < CONFIG.EXTRA_STORES; i++) {
      const storeType = storeTypes[i % storeTypes.length];
      const typeData = STORE_TYPES[storeType];
      const storeName = `${randomChoice(typeData.names)} Test${i + 1}`;
      const location = randomLocation();
      
      newStores.push({
        email: `ministore${Date.now()}${i}@test.com`,
        password: hashedPassword,
        businessName: storeName,
        ownerName: `${randomChoice(FIRST_NAMES)} ${randomChoice(LAST_NAMES)}`,
        phone: randomLandline(),
        address: randomAddress(),
        afm: randomAFM(),
        storeType,
        location,
        description: randomChoice(typeData.descriptions),
        serviceAreas: randomChoice(AREAS) + ', Αλεξανδρούπολη',
        workingHours: randomWorkingHours(),
        isApproved: true,
        status: 'approved',
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null
      });
    }
    await Store.insertMany(newStores);
    console.log(`   ✅ Δημιουργήθηκαν ${newStores.length} καταστήματα`);

    // ===== CREATE DRIVERS =====
    console.log(`\n🚗 Δημιουργία ${CONFIG.EXTRA_DRIVERS} οδηγών...`);
    const newDrivers = [];
    const driverHashedPassword = await bcrypt.hash('driver123', 10);
    
    for (let i = 0; i < CONFIG.EXTRA_DRIVERS; i++) {
      const vehicleData = randomChoice(VEHICLES);
      const licensePlate = vehicleData.plates 
        ? `${randomChoice(vehicleData.plates)}-${randomBetween(1000, 9999)}`
        : 'N/A';
      
      newDrivers.push({
        email: `minidriver${Date.now()}${i}@test.com`,
        password: driverHashedPassword,
        name: `${randomChoice(FIRST_NAMES)} ${randomChoice(LAST_NAMES)}`,
        phone: randomPhone(),
        vehicle: vehicleData.type,
        licensePlate,
        isApproved: true,
        status: 'approved',
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
        isOnline: Math.random() > 0.3, // 70% online
        currentOrder: null
      });
    }
    await Driver.insertMany(newDrivers);
    console.log(`   ✅ Δημιουργήθηκαν ${newDrivers.length} οδηγοί`);

    // ===== CREATE CUSTOMERS =====
    console.log(`\n👥 Δημιουργία ${CONFIG.EXTRA_CUSTOMERS} πελατών...`);
    const newCustomers = [];
    const customerHashedPassword = await bcrypt.hash('customer123', 10);
    
    for (let i = 0; i < CONFIG.EXTRA_CUSTOMERS; i++) {
      const location = randomLocation();
      newCustomers.push({
        name: `${randomChoice(FIRST_NAMES)} ${randomChoice(LAST_NAMES)}`,
        email: `minicustomer${Date.now()}${i}@test.com`,
        password: customerHashedPassword,
        phone: randomPhone(),
        address: randomAddress(),
        location,
        role: 'customer',
        isActive: true,
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
        pushToken: null
      });
    }
    await Customer.insertMany(newCustomers);
    console.log(`   ✅ Δημιουργήθηκαν ${newCustomers.length} πελάτες`);

    // ===== GET ALL FOR ORDERS =====
    const allStores = await Store.find({ isApproved: true });
    const allDrivers = await Driver.find({ isApproved: true });
    const allCustomers = await Customer.find({ isActive: true });

    console.log(`\n📊 Διαθέσιμα για παραγγελίες:`);
    console.log(`   Καταστήματα: ${allStores.length}`);
    console.log(`   Οδηγοί: ${allDrivers.length}`);
    console.log(`   Πελάτες: ${allCustomers.length}`);

    // ===== CREATE ORDERS =====
    console.log(`\n📦 Δημιουργία παραγγελιών για ${CONFIG.DAYS_OF_DATA} ημέρες...`);
    
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 1); // Χθες
    
    let totalOrders = 0;
    const orders = [];
    
    for (let day = 0; day < CONFIG.DAYS_OF_DATA; day++) {
      const orderDate = new Date(endDate);
      orderDate.setDate(orderDate.getDate() - day);
      
      const ordersToday = CONFIG.ORDERS_PER_DAY + randomBetween(-10, 10);
      
      for (let i = 0; i < ordersToday; i++) {
        const customer = randomChoice(allCustomers);
        const store = randomChoice(allStores);
        const driver = randomChoice(allDrivers);
        
        const orderTime = new Date(orderDate);
        orderTime.setHours(randomBetween(8, 22), randomBetween(0, 59), randomBetween(0, 59), 0);
        
        const { content, productPrice } = generateOrderContent(store.storeType);
        const deliveryFee = randomBetween(15, 35) / 10; // 1.5€ - 3.5€
        const isCancelled = Math.random() < CONFIG.CANCELLATION_RATE;
        
        const completedAt = new Date(orderTime);
        completedAt.setMinutes(completedAt.getMinutes() + randomBetween(25, 50));
        
        // Customer location for delivery
        const deliveryLocation = customer.location || randomLocation();
        
        // Status history για completed orders
        const statusHistory = [
          { status: 'pending_store', updatedBy: 'customer', timestamp: new Date(orderTime) },
          { status: 'pricing', updatedBy: 'store', timestamp: new Date(orderTime.getTime() + 60000) },
          { status: 'pending_customer_confirm', updatedBy: 'store', timestamp: new Date(orderTime.getTime() + 120000) },
          { status: 'confirmed', updatedBy: 'customer', timestamp: new Date(orderTime.getTime() + 180000) },
          { status: 'assigned', updatedBy: 'admin', timestamp: new Date(orderTime.getTime() + 300000) },
          { status: 'accepted_driver', updatedBy: 'driver', timestamp: new Date(orderTime.getTime() + 360000) },
          { status: 'preparing', updatedBy: 'store', timestamp: new Date(orderTime.getTime() + 420000) },
          { status: 'in_delivery', updatedBy: 'driver', timestamp: new Date(orderTime.getTime() + 900000) }
        ];
        
        if (isCancelled) {
          statusHistory.push({ status: 'cancelled', updatedBy: 'customer', timestamp: new Date(orderTime.getTime() + 600000) });
        } else {
          statusHistory.push({ status: 'completed', updatedBy: 'driver', timestamp: completedAt });
        }
        
        orders.push({
          orderNumber: generateOrderNumber(orderDate, i + 1),
          customer: {
            customerId: customer._id,
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            address: customer.address
          },
          deliveryLocation,
          storeId: store._id,
          storeName: store.businessName,
          orderType: 'text',
          orderContent: content,
          orderVoiceUrl: null,
          status: isCancelled ? 'cancelled' : 'completed',
          statusHistory,
          productPrice,
          deliveryFee,
          totalPrice: Math.round((productPrice + deliveryFee) * 100) / 100,
          driverId: driver._id,
          driverName: driver.name,
          createdAt: orderTime,
          updatedAt: completedAt,
          confirmedAt: new Date(orderTime.getTime() + 180000),
          completedAt: isCancelled ? null : completedAt
        });
        
        totalOrders++;
      }
      
      // Progress
      process.stdout.write(`   Ημέρα ${day + 1}/${CONFIG.DAYS_OF_DATA}: ${ordersToday} παραγγελίες\r`);
    }
    console.log('');
    
    // Insert orders
    console.log(`   Εισαγωγή ${orders.length} παραγγελιών...`);
    await Order.insertMany(orders);
    console.log(`   ✅ Δημιουργήθηκαν ${totalOrders} παραγγελίες`);

    // ===== FINAL STATS =====
    console.log('\n═══════════════════════════════════════════');
    console.log('✅ MINI TEST ΟΛΟΚΛΗΡΩΘΗΚΕ ΕΠΙΤΥΧΩΣ!');
    console.log('═══════════════════════════════════════════');
    
    const totalOrdersInDB = await Order.countDocuments();
    const completedOrders = await Order.countDocuments({ status: 'completed' });
    const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });
    const totalStores = await Store.countDocuments({ isApproved: true });
    const totalDrivers = await Driver.countDocuments({ isApproved: true });
    const totalCustomers = await Customer.countDocuments({ isActive: true });
    
    console.log(`\n📊 Τελικά Στατιστικά:`);
    console.log(`   Καταστήματα: ${totalStores}`);
    console.log(`   Οδηγοί: ${totalDrivers}`);
    console.log(`   Πελάτες: ${totalCustomers}`);
    console.log(`   Παραγγελίες: ${totalOrdersInDB}`);
    console.log(`   - Ολοκληρωμένες: ${completedOrders}`);
    console.log(`   - Ακυρωμένες: ${cancelledOrders}`);
    
    console.log('\n🎉 Το script λειτουργεί σωστά!');
    console.log('   Μπορείς να τρέξεις το μεγάλο: node tests/seedMassiveData.js');
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ΣΦΑΛΜΑ:', error.message);
    console.error('\nStack:', error.stack);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seedMiniTest();
