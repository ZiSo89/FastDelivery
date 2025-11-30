/**
 * Massive Data Seed Script - Αλεξανδρούπολη
 * 
 * Δημιουργεί ρεαλιστικά δεδομένα για 2 χρόνια λειτουργίας:
 * - 30 καταστήματα
 * - 10 οδηγούς
 * - 500 πελάτες
 * - ~50,000 παραγγελίες
 * 
 * ✅ Όλα τα πεδία συμπληρωμένα
 * ✅ isEmailVerified: true
 * ✅ Δεδομένα Αλεξανδρούπολης
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

// ============== ΑΛΕΞΑΝΔΡΟΥΠΟΛΗ DATA ==============
// Κέντρο: 25.8743, 40.8476
const ALEXANDROUPOLI = {
  CENTER_LNG: 25.8743,
  CENTER_LAT: 40.8476,
  RADIUS_LNG: 0.03, // ~2.5km
  RADIUS_LAT: 0.015
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
  'Καραολή & Δημητρίου',
  'Μεγάλου Αλεξάνδρου',
  'Ελευθερίου Βενιζέλου',
  'Φιλελλήνων',
  'Μακεδονίας',
  'Θράκης',
  'Αριστοτέλους',
  'Πλάτωνος',
  'Σωκράτους'
];

const AREAS = ['Κέντρο', 'Νέα Χιλή', 'Άνθεια', 'Μαΐστρος', 'Απαλός'];

// Τύποι καταστημάτων με προϊόντα
const STORE_TYPES = {
  'Καφετέρια': {
    names: ['Espresso House', 'Coffee Lab', 'Café Aegean', 'Θρακικό Καφέ', 'Aroma Café', 'The Daily Grind', 'Καφέ Νέον'],
    descriptions: ['Specialty coffee & snacks', 'Καφές, γλυκά και ελαφρά γεύματα', 'Ο καλύτερος καφές στην πόλη'],
    products: [
      { name: 'Καφέ Φραπέ', price: 2.50 },
      { name: 'Καπουτσίνο', price: 3.00 },
      { name: 'Freddo Espresso', price: 3.20 },
      { name: 'Σοκολάτα ζεστή', price: 3.00 },
      { name: 'Τοστ Κλασικό', price: 3.50 },
      { name: 'Club Sandwich', price: 5.50 },
      { name: 'Κρουασάν σοκολάτα', price: 2.80 },
      { name: 'Χυμός πορτοκάλι', price: 3.00 }
    ]
  },
  'Mini Market': {
    names: ['Express Market', 'Αγορά 24', 'Quick Stop', 'Γωνιακό', 'My Market'],
    descriptions: ['Σούπερ μάρκετ γειτονιάς', 'Όλα τα απαραίτητα 24/7', 'Τρόφιμα και είδη σπιτιού'],
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
    descriptions: ['Φαρμακείο με πλήρη εξυπηρέτηση', 'Φάρμακα και καλλυντικά', 'Εφημερεύον φαρμακείο'],
    products: [
      { name: 'Depon 500mg', price: 3.50 },
      { name: 'Βιταμίνη C', price: 8.00 },
      { name: 'Αντισηπτικό χεριών', price: 4.00 },
      { name: 'Παυσίπονο', price: 4.50 },
      { name: 'Σιρόπι για βήχα', price: 7.00 }
    ]
  },
  'Ταβέρνα': {
    names: ['Ο Γιώργος', 'Τα Κύματα', 'Θρακιώτικη Γωνιά', 'Του Ψαρά', 'Παραδοσιακή Γωνιά', 'Μεζεδοπωλείο Θράκη', 'Η Παλιά Αυλή'],
    descriptions: ['Παραδοσιακή ελληνική κουζίνα', 'Θρακιώτικες σπεσιαλιτέ', 'Φρέσκα θαλασσινά καθημερινά'],
    products: [
      { name: 'Σουβλάκι χοιρινό', price: 3.00 },
      { name: 'Γύρος πίτα', price: 3.50 },
      { name: 'Μερίδα Μουσακά', price: 8.50 },
      { name: 'Χωριάτικη σαλάτα', price: 6.00 },
      { name: 'Μπριζόλα χοιρινή', price: 12.00 },
      { name: 'Μερίδα πατάτες', price: 3.00 }
    ]
  },
  'Γλυκά': {
    names: ['Sweet Corner', 'Ζαχαροπλαστείο Άρωμα', 'Γλυκές Στιγμές', 'La Dolce Vita'],
    descriptions: ['Χειροποίητα γλυκά', 'Ζαχαροπλαστείο με παράδοση', 'Τούρτες και παγωτά'],
    products: [
      { name: 'Γαλακτομπούρεκο', price: 4.00 },
      { name: 'Μπακλαβάς', price: 4.50 },
      { name: 'Προφιτερόλ', price: 5.00 },
      { name: 'Τούρτα σοκολάτα', price: 5.50 },
      { name: 'Παγωτό 2 μπάλες', price: 3.50 }
    ]
  },
  'Πιτσαρία': {
    names: ['Pizza Roma', 'Napoli Express', 'Πίτσα Αλεξ', 'Pizza House', 'Italian Corner'],
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

// Generate order number
const generateOrderNumber = (date, index) => {
  globalOrderCounter++;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const timestamp = Date.now().toString().slice(-4);
  return `ORD-${y}${m}${d}-${String(index).padStart(4, '0')}-${timestamp}${globalOrderCounter}`;
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

// ============== MAIN FUNCTION ==============
async function seedMassiveData() {
  console.log('🚀 MASSIVE DATA SEED - Αλεξανδρούπολη\n');
  console.log('═══════════════════════════════════════════');
  
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
      const hashedPassword = await bcrypt.hash('store123', 10);
      
      for (let i = 0; i < storesToCreate; i++) {
        const storeType = storeTypes[i % storeTypes.length];
        const typeData = STORE_TYPES[storeType];
        const storeName = `${randomChoice(typeData.names)} ${i + 1}`;
        const location = randomLocation();
        
        newStores.push({
          email: `massivestore${Date.now()}${i}@test.com`,
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
      existingStores = await Store.find({ isApproved: true });
      console.log(`   ✅ Συνολικά καταστήματα: ${existingStores.length}`);
    }

    // ============== STEP 3: Create additional drivers ==============
    const driversToCreate = CONFIG.TARGET_DRIVERS - existingDrivers.length;
    if (driversToCreate > 0) {
      console.log(`\n🚗 Δημιουργία ${driversToCreate} επιπλέον οδηγών...`);
      
      const newDrivers = [];
      const driverHashedPassword = await bcrypt.hash('driver123', 10);
      
      for (let i = 0; i < driversToCreate; i++) {
        const vehicleData = randomChoice(VEHICLES);
        const licensePlate = vehicleData.plates 
          ? `${randomChoice(vehicleData.plates)}-${randomBetween(1000, 9999)}`
          : 'N/A';
        
        newDrivers.push({
          email: `massivedriver${Date.now()}${i}@test.com`,
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
      existingDrivers = await Driver.find({ isApproved: true });
      console.log(`   ✅ Συνολικά οδηγοί: ${existingDrivers.length}`);
    }

    // ============== STEP 4: Create additional customers ==============
    const customersToCreate = CONFIG.TARGET_CUSTOMERS - existingCustomers.length;
    if (customersToCreate > 0) {
      console.log(`\n👥 Δημιουργία ${customersToCreate} επιπλέον πελατών...`);
      
      const newCustomers = [];
      const customerHashedPassword = await bcrypt.hash('customer123', 10);
      
      for (let i = 0; i < customersToCreate; i++) {
        const location = randomLocation();
        newCustomers.push({
          name: `${randomChoice(FIRST_NAMES)} ${randomChoice(LAST_NAMES)}`,
          email: `massivecustomer${Date.now()}${i}@test.com`,
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
    
    console.log(`\n📊 Διαθέσιμα για παραγγελίες:`);
    console.log(`   Καταστήματα: ${approvedStores.length}`);
    console.log(`   Οδηγοί: ${approvedDrivers.length}`);
    console.log(`   Πελάτες: ${activeCustomers.length}`);
    
    let totalOrders = 0;
    let batchOrders = [];
    const BATCH_SIZE = 1000;
    
    // Iterate through each day
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const multiplier = getSeasonalMultiplier(d);
      const ordersToday = Math.floor(CONFIG.BASE_ORDERS_PER_DAY * multiplier * (0.8 + Math.random() * 0.4));
      
      for (let i = 0; i < ordersToday; i++) {
        const customer = randomChoice(activeCustomers);
        const store = randomChoice(approvedStores);
        const driver = randomChoice(approvedDrivers);
        
        // Random time between 8:00 and 22:00
        const orderTime = new Date(d);
        orderTime.setHours(randomBetween(8, 21), randomBetween(0, 59), randomBetween(0, 59), 0);
        
        const { content, productPrice } = generateOrderContent(store.storeType);
        const deliveryFee = randomBetween(15, 35) / 10; // 1.5€ - 3.5€
        const totalPrice = Math.round((productPrice + deliveryFee) * 100) / 100;
        
        // 5% cancellation rate
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
        
        batchOrders.push({
          orderNumber: generateOrderNumber(d, i + 1),
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
          totalPrice,
          driverId: driver._id,
          driverName: driver.name,
          createdAt: orderTime,
          updatedAt: completedAt,
          confirmedAt: new Date(orderTime.getTime() + 180000),
          completedAt: isCancelled ? null : completedAt
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
    console.log('\n═══════════════════════════════════════════');
    console.log('📊 ΤΕΛΙΚΑ ΣΤΑΤΙΣΤΙΚΑ');
    console.log('═══════════════════════════════════════════');
    
    const totalOrdersInDB = await Order.countDocuments();
    const completedOrders = await Order.countDocuments({ status: 'completed' });
    const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });
    const totalStores = await Store.countDocuments({ isApproved: true });
    const totalDrivers = await Driver.countDocuments({ isApproved: true });
    const totalCustomers = await Customer.countDocuments({ isActive: true });
    
    console.log(`\n   🏪 Καταστήματα: ${totalStores}`);
    console.log(`   🚗 Οδηγοί: ${totalDrivers}`);
    console.log(`   👥 Πελάτες: ${totalCustomers}`);
    console.log(`   📦 Παραγγελίες: ${totalOrdersInDB}`);
    console.log(`   - Ολοκληρωμένες: ${completedOrders}`);
    console.log(`   - Ακυρωμένες: ${cancelledOrders}`);
    
    const totalRevenue = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    
    console.log(`   💰 Συνολικά έσοδα: €${totalRevenue[0]?.total?.toFixed(2) || 0}`);
    console.log('═══════════════════════════════════════════');
    
    console.log('\n✅ Ολοκληρώθηκε επιτυχώς!');
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ΣΦΑΛΜΑ:', error.message);
    console.error('\nStack:', error.stack);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seedMassiveData();
