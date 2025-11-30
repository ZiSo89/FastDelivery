/**
 * ============================================================
 * SEED DATA SCRIPT - Αλεξανδρούπολη
 * ============================================================
 * 
 * Ολοκληρωμένο script που γεμίζει τη βάση με ρεαλιστικά δεδομένα:
 * - 1 Admin
 * - Settings με τύπους καταστημάτων
 * - 10-15 Καταστήματα (1-2 ανά κατηγορία)
 * - 5 Οδηγοί
 * - 30 Πελάτες
 * - ~500 Παραγγελίες (τελευταίος μήνας)
 * - Monthly Expenses
 * 
 * ΠΡΟΣΟΧΗ: Διαγράφει ΟΛΑ τα υπάρχοντα δεδομένα!
 * 
 * Run: node tests/seedData.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Models
const Admin = require('../src/models/Admin');
const Store = require('../src/models/Store');
const Driver = require('../src/models/Driver');
const Order = require('../src/models/Order');
const Customer = require('../src/models/Customer');
const Settings = require('../src/models/Settings');
const MonthlyExpense = require('../src/models/MonthlyExpense');
const User = require('../src/models/User');

// ============================================================
// CONFIGURATION
// ============================================================
const CONFIG = {
  DAYS_OF_ORDERS: 30,        // Πόσες μέρες παραγγελιών
  ORDERS_PER_DAY: 15,        // Μέσος όρος παραγγελιών/ημέρα
  NUM_CUSTOMERS: 30,         // Αριθμός πελατών
  NUM_DRIVERS: 5,            // Αριθμός οδηγών
  CANCELLATION_RATE: 0.05,   // 5% ακυρώσεις
};

// ============================================================
// ΑΛΕΞΑΝΔΡΟΥΠΟΛΗ DATA
// ============================================================
const ALEXANDROUPOLI = {
  // Κέντρο πόλης (λίγο πιο βόρεια για να αποφύγουμε τη θάλασσα)
  CENTER: { lat: 40.8520, lng: 25.8750 },
  // Ακτίνα για τυχαία σημεία (μόνο προς Β/Δ για να μην πέσουμε στη θάλασσα)
  RADIUS: { lat: 0.012, lng: 0.025 }  // ~1.5km βόρεια, ~2km ανατολή/δύση
};

// Ελληνικά ονόματα
const FIRST_NAMES = [
  'Γιάννης', 'Μαρία', 'Κώστας', 'Ελένη', 'Δημήτρης', 
  'Νίκος', 'Σοφία', 'Παναγιώτης', 'Αναστασία', 'Βασίλης',
  'Χρήστος', 'Αικατερίνη', 'Γεώργιος', 'Ευαγγελία', 'Αθανάσιος',
  'Σταυρούλα', 'Θεόδωρος', 'Μαργαρίτα', 'Κωνσταντίνος', 'Δέσποινα'
];

const LAST_NAMES = [
  'Παπαδόπουλος', 'Γεωργίου', 'Νικολάου', 'Βασιλείου', 'Κωνσταντίνου',
  'Δημητρίου', 'Ιωάννου', 'Χατζής', 'Αθανασίου', 'Μιχαηλίδης',
  'Παπαδημητρίου', 'Καραγιάννης', 'Οικονόμου', 'Αλεξίου', 'Σαββίδης'
];

// Πραγματικοί δρόμοι Αλεξανδρούπολης
const STREETS = [
  'Λεωφόρος Δημοκρατίας', 'Οδός 14ης Μαΐου', 'Κύπρου', 'Λεωφόρος Μάκρης',
  'Διονυσίου Σολωμού', 'Εθνικής Αντίστασης', 'Παλαιολόγου', 'Μιαούλη',
  'Κουντουριώτου', 'Αγίου Δημητρίου', 'Βενιζέλου', 'Καραολή & Δημητρίου',
  'Μεγάλου Αλεξάνδρου', 'Ιωακείμ Καβύρη', 'Πλατεία Πολυτεχνείου'
];

const AREAS = ['Κέντρο', 'Νέα Χιλή', 'Άνθεια', 'Μαΐστρος', 'Απαλός'];

// ============================================================
// STORE TYPES - Όλες οι κατηγορίες για το UI
// ============================================================
const ALL_STORE_TYPES = [
  { name: 'Mini Market', icon: '🛒' },
  { name: 'Φαρμακείο', icon: '💊' },
  { name: 'Ταβέρνα', icon: '🍔' },
  { name: 'Καφετέρια', icon: '☕' },
  { name: 'Γλυκά', icon: '🍰' },
  { name: 'Πιτσαρία', icon: '🍕' },
  { name: 'Σουβλατζίδικο', icon: '🥙' },
  { name: 'Αρτοποιείο', icon: '🥖' },
  { name: 'Κάβα', icon: '🍷' },
  { name: 'Ανθοπωλείο', icon: '💐' },
  { name: 'Άλλο', icon: '🏪' }
];

// ============================================================
// STORES TO CREATE - Μόνο 10-15 καταστήματα σε επιλεγμένες κατηγορίες
// ============================================================
const STORES_TO_CREATE = [
  // Καφετέριες (2)
  { 
    type: 'Καφετέρια',
    name: 'Espresso House', 
    desc: 'Specialty coffee & snacks',
    products: [
      { name: 'Καφέ Φραπέ', price: 2.50 },
      { name: 'Καπουτσίνο', price: 3.00 },
      { name: 'Freddo Espresso', price: 3.20 },
      { name: 'Τοστ Κλασικό', price: 3.50 },
      { name: 'Club Sandwich', price: 5.50 }
    ]
  },
  { 
    type: 'Καφετέρια',
    name: 'Café Aegean', 
    desc: 'Ο καλύτερος καφές στην πόλη',
    products: [
      { name: 'Freddo Cappuccino', price: 3.50 },
      { name: 'Σοκολάτα ζεστή', price: 3.00 },
      { name: 'Κρουασάν σοκολάτα', price: 2.80 },
      { name: 'Cheesecake', price: 5.00 }
    ]
  },
  // Ταβέρνες (2)
  { 
    type: 'Ταβέρνα',
    name: 'Ο Γιώργος', 
    desc: 'Παραδοσιακή ελληνική κουζίνα',
    products: [
      { name: 'Μουσακάς', price: 8.50 },
      { name: 'Παστίτσιο', price: 8.00 },
      { name: 'Χωριάτικη σαλάτα', price: 6.00 },
      { name: 'Μπριζόλα χοιρινή', price: 12.00 }
    ]
  },
  { 
    type: 'Ταβέρνα',
    name: 'Τα Κύματα', 
    desc: 'Φρέσκα θαλασσινά καθημερινά',
    products: [
      { name: 'Καλαμαράκια τηγανητά', price: 10.00 },
      { name: 'Γαρίδες σαγανάκι', price: 12.00 },
      { name: 'Ψάρι σχάρας', price: 15.00 }
    ]
  },
  // Mini Market (2)
  { 
    type: 'Mini Market',
    name: 'Market Express', 
    desc: 'Ό,τι χρειάζεστε, γρήγορα!',
    products: [
      { name: 'Γάλα 1L', price: 1.80 },
      { name: 'Ψωμί', price: 1.50 },
      { name: 'Αυγά 6άδα', price: 3.50 },
      { name: 'Τυρί φέτα 400γρ', price: 5.00 },
      { name: 'Coca Cola 1.5L', price: 2.20 }
    ]
  },
  { 
    type: 'Mini Market',
    name: 'Αγορά Γειτονιάς', 
    desc: 'Τοπικά προϊόντα',
    products: [
      { name: 'Νερό 6άδα', price: 2.50 },
      { name: 'Chips Lays', price: 2.00 },
      { name: 'Σοκολάτα γάλακτος', price: 1.50 }
    ]
  },
  // Φαρμακείο (1)
  { 
    type: 'Φαρμακείο',
    name: 'Φαρμακείο Υγεία', 
    desc: 'Εξυπηρέτηση με φροντίδα',
    products: [
      { name: 'Depon 500mg', price: 3.50 },
      { name: 'Βιταμίνη C 1000mg', price: 8.00 },
      { name: 'Μάσκες 50τεμ', price: 5.00 },
      { name: 'Αντισηπτικό', price: 4.00 }
    ]
  },
  // Πιτσαρία (2)
  { 
    type: 'Πιτσαρία',
    name: 'Pizza Roma', 
    desc: 'Αυθεντική ιταλική πίτσα',
    products: [
      { name: 'Πίτσα Μαργαρίτα', price: 7.50 },
      { name: 'Πίτσα Special', price: 10.00 },
      { name: 'Πίτσα Πεπερόνι', price: 9.00 },
      { name: 'Calzone', price: 8.50 }
    ]
  },
  { 
    type: 'Πιτσαρία',
    name: 'Napoli Express', 
    desc: 'Delivery σε 30 λεπτά!',
    products: [
      { name: 'Πίτσα 4 Τυριά', price: 9.50 },
      { name: 'Πίτσα BBQ Chicken', price: 10.50 },
      { name: 'Garlic Bread', price: 3.50 }
    ]
  },
  // Σουβλατζίδικο (2)
  { 
    type: 'Σουβλατζίδικο',
    name: 'Ο Θρακιώτης', 
    desc: 'Τα καλύτερα σουβλάκια!',
    products: [
      { name: 'Σουβλάκι χοιρινό', price: 2.80 },
      { name: 'Σουβλάκι κοτόπουλο', price: 2.80 },
      { name: 'Γύρος πίτα', price: 3.50 },
      { name: 'Μερίδα γύρος', price: 8.00 },
      { name: 'Πατάτες τηγανητές', price: 3.00 }
    ]
  },
  { 
    type: 'Σουβλατζίδικο',
    name: 'Souvlaki Time', 
    desc: 'Γρήγορο & νόστιμο',
    products: [
      { name: 'Καλαμάκι χοιρινό', price: 2.50 },
      { name: 'Πίτα γύρος κοτόπουλο', price: 3.50 },
      { name: 'Club πίτα', price: 4.50 }
    ]
  },
  // Γλυκά (1)
  { 
    type: 'Γλυκά',
    name: 'Γλυκοπωλείο Η Απόλαυση', 
    desc: 'Παραδοσιακά γλυκά',
    products: [
      { name: 'Γαλακτομπούρεκο', price: 4.00 },
      { name: 'Μπακλαβάς', price: 4.50 },
      { name: 'Προφιτερόλ', price: 5.00 },
      { name: 'Cheesecake', price: 5.50 }
    ]
  },
  // Αρτοποιείο (1)
  { 
    type: 'Αρτοποιείο',
    name: 'Αρτοποιείο Θράκη', 
    desc: 'Φρέσκο ψωμί καθημερινά',
    products: [
      { name: 'Χωριάτικο ψωμί', price: 2.00 },
      { name: 'Τυρόπιτα', price: 2.50 },
      { name: 'Σπανακόπιτα', price: 2.80 },
      { name: 'Μπουγάτσα', price: 3.00 }
    ]
  }
  // Κάβα, Ανθοπωλείο, Άλλο -> ΑΔΕΙΕΣ ΚΑΤΗΓΟΡΙΕΣ (δεν δημιουργούμε καταστήματα)
];

// Τύποι οχημάτων για οδηγούς
const VEHICLES = [
  { type: 'Μοτοσυκλέτα', plates: ['ΡΟΕ', 'ΡΟΜ', 'ΡΟΝ'] },
  { type: 'Αυτοκίνητο', plates: ['ΕΒΡ', 'ΡΟΔ'] },
  { type: 'Ποδήλατο', plates: null }
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomPhone = () => `69${randomBetween(70, 99)}${String(randomBetween(100000, 999999))}`;
const randomLandline = () => `2551${randomBetween(10000, 99999)}`;
const randomAFM = () => String(randomBetween(100000000, 999999999));

// Τυχαία τοποθεσία στην Αλεξανδρούπολη (μόνο προς Β/Δ, αποφεύγουμε τη θάλασσα)
const randomLocation = () => {
  // lat: μόνο θετικό offset (βόρεια) ή μικρό νότια
  const latOffset = (Math.random() * 0.8 - 0.1) * ALEXANDROUPOLI.RADIUS.lat;
  // lng: ανατολή/δύση κανονικά
  const lngOffset = (Math.random() - 0.5) * 2 * ALEXANDROUPOLI.RADIUS.lng;
  
  return {
    type: 'Point',
    coordinates: [
      ALEXANDROUPOLI.CENTER.lng + lngOffset,
      ALEXANDROUPOLI.CENTER.lat + latOffset
    ]
  };
};

// Τυχαία διεύθυνση
const randomAddress = () => {
  const street = randomChoice(STREETS);
  const num = randomBetween(1, 150);
  const area = randomChoice(AREAS);
  return `${street} ${num}, ${area}, Αλεξανδρούπολη 68100`;
};

// Τυχαίο ωράριο
const randomWorkingHours = () => {
  const options = [
    'Δευ-Παρ: 08:00-22:00, Σαβ: 09:00-23:00',
    'Καθημερινά: 10:00-24:00',
    'Δευ-Κυρ: 07:00-23:00',
    '08:00 - 22:00'
  ];
  return randomChoice(options);
};

// Δημιουργία περιεχομένου παραγγελίας
const generateOrderContent = (storeType) => {
  // Βρες το κατάστημα με αυτόν τον τύπο για τα προϊόντα του
  const storeData = STORES_TO_CREATE.find(s => s.type === storeType);
  const products = storeData?.products || [
    { name: 'Προϊόν', price: 5.00 }
  ];
  
  const numItems = randomBetween(1, 4);
  const items = [];
  let totalPrice = 0;

  for (let i = 0; i < numItems; i++) {
    const product = randomChoice(products);
    const qty = randomBetween(1, 2);
    items.push(`${qty}x ${product.name}`);
    totalPrice += product.price * qty;
  }

  return { 
    content: items.join(', '), 
    productPrice: Math.round(totalPrice * 100) / 100 
  };
};

// Global counter for unique order numbers
let orderCounter = 0;

const generateOrderNumber = (date) => {
  orderCounter++;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `ORD-${y}${m}${d}-${String(orderCounter).padStart(4, '0')}`;
};

// ============================================================
// MAIN SEED FUNCTION
// ============================================================
async function seedData() {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║           SEED DATA - Αλεξανδρούπολη                       ║');
  console.log('║           Ολοκληρωμένο Test Dataset                        ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Σύνδεση με MongoDB\n');

    // ========================================
    // STEP 1: Clear ALL existing data
    // ========================================
    console.log('🗑️  Καθαρισμός υπαρχόντων δεδομένων...');
    await Admin.deleteMany({});
    await Store.deleteMany({});
    await Driver.deleteMany({});
    await Order.deleteMany({});
    await Customer.deleteMany({});
    await User.deleteMany({});
    await Settings.deleteMany({});
    await MonthlyExpense.deleteMany({});
    console.log('   ✓ Διαγράφηκαν όλα τα δεδομένα\n');

    // ========================================
    // STEP 2: Create Admin
    // ========================================
    console.log('👤 Δημιουργία Admin...');
    const admin = await Admin.create({
      email: 'admin@fastdelivery.gr',
      password: 'admin123',
      name: 'Διαχειριστής Συστήματος'
    });
    console.log('   ✓ admin@fastdelivery.gr / admin123\n');

    // ========================================
    // STEP 3: Create Settings with Store Types
    // ========================================
    console.log('⚙️  Δημιουργία Settings...');
    // Χρησιμοποιούμε το ALL_STORE_TYPES array για τα settings (και τις 11 κατηγορίες)
    const storeTypesArray = ALL_STORE_TYPES.map(st => ({
      name: st.name,
      icon: st.icon
    }));
    
    await Settings.create({
      key: 'main',
      driverSalary: 800,
      defaultDeliveryFee: 3,
      serviceArea: 'Αλεξανδρούπολη',
      serviceHoursEnabled: false,
      serviceHoursStart: '09:00',
      serviceHoursEnd: '23:00',
      storeTypes: storeTypesArray
    });
    console.log(`   ✓ ${storeTypesArray.length} τύποι καταστημάτων\n`);

    // ========================================
    // STEP 4: Create Stores (12 καταστήματα σε επιλεγμένες κατηγορίες)
    // ========================================
    console.log('🏪 Δημιουργία Καταστημάτων...');
    // Τα models κάνουν auto-hash στο pre('save'), οπότε περνάμε plain password
    const storePassword = 'store123';
    const createdStores = [];
    
    // Χρησιμοποιούμε το STORES_TO_CREATE array
    for (let i = 0; i < STORES_TO_CREATE.length; i++) {
      const storeInfo = STORES_TO_CREATE[i];
      const store = await Store.create({
        email: `store${i + 1}@test.com`,
        password: storePassword,
        businessName: storeInfo.name,
        ownerName: `${randomChoice(FIRST_NAMES)} ${randomChoice(LAST_NAMES)}`,
        phone: randomLandline(),
        address: randomAddress(),
        afm: randomAFM(),
        storeType: storeInfo.type,
        location: randomLocation(),
        description: storeInfo.desc,
        serviceAreas: `${randomChoice(AREAS)}, Αλεξανδρούπολη`,
        workingHours: randomWorkingHours(),
        isApproved: true,
        status: 'approved',
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null
      });
      createdStores.push(store);
    }
    
    // Add one pending store for testing
    await Store.create({
      email: 'pending.store@test.com',
      password: storePassword,
      businessName: 'Νέο Κατάστημα (Αναμονή)',
      ownerName: `${randomChoice(FIRST_NAMES)} ${randomChoice(LAST_NAMES)}`,
      phone: randomLandline(),
      address: randomAddress(),
      afm: randomAFM(),
      storeType: 'Καφετέρια',
      location: randomLocation(),
      description: 'Κατάστημα σε αναμονή έγκρισης',
      isApproved: false,
      status: 'pending',
      isEmailVerified: true
    });
    
    console.log(`   ✓ ${createdStores.length} εγκεκριμένα + 1 σε αναμονή\n`);

    // ========================================
    // STEP 5: Create Drivers
    // ========================================
    console.log('🚗 Δημιουργία Οδηγών...');
    const driverPassword = 'driver123';
    const createdDrivers = [];
    
    for (let i = 0; i < CONFIG.NUM_DRIVERS; i++) {
      const vehicleData = randomChoice(VEHICLES);
      const licensePlate = vehicleData.plates 
        ? `${randomChoice(vehicleData.plates)}-${randomBetween(1000, 9999)}`
        : 'N/A';
      
      const driver = await Driver.create({
        email: `driver${i + 1}@test.com`,
        password: driverPassword,
        name: `${randomChoice(FIRST_NAMES)} ${randomChoice(LAST_NAMES)}`,
        phone: randomPhone(),
        vehicleType: vehicleData.type,
        vehiclePlate: licensePlate,
        licenseNumber: `ΑΜ${randomBetween(100000, 999999)}`,
        isApproved: true,
        status: 'approved',
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
        isOnline: Math.random() > 0.3,  // 70% online
        currentOrder: null
      });
      createdDrivers.push(driver);
    }
    
    // Add one pending driver
    await Driver.create({
      email: 'pending.driver@test.com',
      password: driverPassword,
      name: 'Οδηγός Σε Αναμονή',
      phone: randomPhone(),
      vehicleType: 'Μοτοσυκλέτα',
      vehiclePlate: 'ΡΟΕ-0000',
      licenseNumber: 'ΑΜ000000',
      isApproved: false,
      status: 'pending',
      isEmailVerified: true,
      isOnline: false
    });
    
    console.log(`   ✓ ${createdDrivers.length} εγκεκριμένοι + 1 σε αναμονή\n`);

    // ========================================
    // STEP 6: Create Customers
    // ========================================
    console.log('👥 Δημιουργία Πελατών...');
    const customerPassword = 'customer123';
    const createdCustomers = [];
    
    for (let i = 0; i < CONFIG.NUM_CUSTOMERS; i++) {
      const customer = await Customer.create({
        name: `${randomChoice(FIRST_NAMES)} ${randomChoice(LAST_NAMES)}`,
        email: `customer${i + 1}@test.com`,
        password: customerPassword,
        phone: randomPhone(),
        address: randomAddress(),
        location: randomLocation(),
        role: 'customer',
        isActive: true,
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
        isDeleted: false,
        deletedAt: null
      });
      createdCustomers.push(customer);
    }
    console.log(`   ✓ ${createdCustomers.length} πελάτες\n`);

    // ========================================
    // STEP 7: Create Orders (last month)
    // ========================================
    console.log(`📦 Δημιουργία Παραγγελιών (${CONFIG.DAYS_OF_ORDERS} ημέρες)...`);
    
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    const ordersToCreate = [];
    let completedCount = 0;
    let cancelledCount = 0;
    
    for (let day = 0; day < CONFIG.DAYS_OF_ORDERS; day++) {
      const orderDate = new Date(today);
      orderDate.setDate(orderDate.getDate() - day);
      
      const ordersToday = CONFIG.ORDERS_PER_DAY + randomBetween(-5, 5);
      
      for (let i = 0; i < ordersToday; i++) {
        const customer = randomChoice(createdCustomers);
        const store = randomChoice(createdStores);
        const driver = randomChoice(createdDrivers);
        
        const orderTime = new Date(orderDate);
        orderTime.setHours(randomBetween(8, 22), randomBetween(0, 59), 0, 0);
        
        const { content, productPrice } = generateOrderContent(store.storeType);
        const deliveryFee = randomBetween(20, 40) / 10;  // 2€ - 4€
        const totalPrice = Math.round((productPrice + deliveryFee) * 100) / 100;
        
        const isCancelled = Math.random() < CONFIG.CANCELLATION_RATE;
        
        const completedAt = new Date(orderTime);
        completedAt.setMinutes(completedAt.getMinutes() + randomBetween(25, 50));
        
        const deliveryLocation = customer.location || randomLocation();
        
        let status, finalDriver, driverName;
        
        if (isCancelled) {
          status = 'cancelled';
          finalDriver = null;
          driverName = null;
          cancelledCount++;
        } else {
          status = 'completed';
          finalDriver = driver._id;
          driverName = driver.name;
          completedCount++;
        }
        
        ordersToCreate.push({
          orderNumber: generateOrderNumber(orderTime),
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
          status,
          productPrice,
          deliveryFee,
          totalPrice,
          driverId: finalDriver,
          driverName,
          createdAt: orderTime,
          completedAt: status === 'completed' ? completedAt : null,
          cancelledAt: status === 'cancelled' ? completedAt : null
        });
      }
      
      process.stdout.write(`   Ημέρα ${day + 1}/${CONFIG.DAYS_OF_ORDERS}\r`);
    }
    
    // Insert orders in batches
    console.log('');
    console.log('   Εισαγωγή παραγγελιών στη βάση...');
    const batchSize = 100;
    for (let i = 0; i < ordersToCreate.length; i += batchSize) {
      const batch = ordersToCreate.slice(i, i + batchSize);
      await Order.insertMany(batch);
    }
    console.log(`   ✓ ${completedCount} ολοκληρωμένες, ${cancelledCount} ακυρωμένες\n`);

    // ========================================
    // STEP 8: Create Monthly Expenses
    // ========================================
    console.log('💰 Δημιουργία Μηνιαίων Εξόδων...');
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    for (let i = 0; i < 3; i++) {
      let month = currentMonth - i;
      let year = currentYear;
      if (month <= 0) {
        month += 12;
        year -= 1;
      }
      
      await MonthlyExpense.create({
        year,
        month,
        amount: randomBetween(500, 2000),
        notes: `Έξοδα ${month}/${year}: Καύσιμα, Συντήρηση, Διάφορα`,
        updatedBy: admin._id
      });
    }
    console.log('   ✓ Τελευταίοι 3 μήνες\n');

    // ========================================
    // FINAL SUMMARY
    // ========================================
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                 ✅ SEED ΟΛΟΚΛΗΡΩΘΗΚΕ!                      ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    
    const stats = {
      admins: await Admin.countDocuments(),
      stores: await Store.countDocuments(),
      storesApproved: await Store.countDocuments({ isApproved: true }),
      drivers: await Driver.countDocuments(),
      driversApproved: await Driver.countDocuments({ isApproved: true }),
      driversOnline: await Driver.countDocuments({ isOnline: true }),
      customers: await Customer.countDocuments(),
      orders: await Order.countDocuments(),
      ordersCompleted: await Order.countDocuments({ status: 'completed' }),
      ordersCancelled: await Order.countDocuments({ status: 'cancelled' })
    };
    
    console.log('📊 ΣΤΑΤΙΣΤΙΚΑ:');
    console.log('─────────────────────────────────────────');
    console.log(`   👤 Admins:     ${stats.admins}`);
    console.log(`   🏪 Καταστήματα: ${stats.storesApproved} εγκεκριμένα (${stats.stores} σύνολο)`);
    console.log(`   🚗 Οδηγοί:     ${stats.driversApproved} εγκεκριμένοι (${stats.driversOnline} online)`);
    console.log(`   👥 Πελάτες:    ${stats.customers}`);
    console.log(`   📦 Παραγγελίες: ${stats.orders}`);
    console.log(`      - Ολοκληρωμένες: ${stats.ordersCompleted}`);
    console.log(`      - Ακυρωμένες:    ${stats.ordersCancelled}`);
    console.log('─────────────────────────────────────────');
    console.log('');
    console.log('🔑 CREDENTIALS:');
    console.log('─────────────────────────────────────────');
    console.log('   Admin:    admin@fastdelivery.gr / admin123');
    console.log('   Store:    store1@test.com / store123');
    console.log('   Driver:   driver1@test.com / driver123');
    console.log('   Customer: customer1@test.com / customer123');
    console.log('─────────────────────────────────────────');
    console.log('');
    
    await mongoose.connection.close();
    console.log('🔌 Σύνδεση με βάση έκλεισε.');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ΣΦΑΛΜΑ:', error.message);
    console.error(error.stack);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run
seedData();
