const mongoose = require('mongoose');
require('dotenv').config();

const Order = require('../src/models/Order');
const Customer = require('../src/models/Customer');
const Store = require('../src/models/Store');
const Driver = require('../src/models/Driver');

// Τυπικά προϊόντα ανά τύπο καταστήματος
const productsByStoreType = {
  'Καφετέρια': [
    { name: 'Καφέ Φραπέ', price: 2.50 },
    { name: 'Καπουτσίνο', price: 3.00 },
    { name: 'Φρέντο Εσπρέσο', price: 3.50 },
    { name: 'Σοκολάτα ζεστή', price: 3.00 },
    { name: 'Τοστ με τυρί-ζαμπόν', price: 3.50 },
    { name: 'Κρουασάν σοκολάτα', price: 2.00 },
    { name: 'Club Sandwich', price: 5.50 },
    { name: 'Τυρόπιτα', price: 2.50 },
    { name: 'Μπουγάτσα', price: 3.00 },
    { name: 'Χυμός πορτοκάλι', price: 3.00 }
  ],
  'Mini Market': [
    { name: 'Γάλα 1L', price: 1.80 },
    { name: 'Ψωμί', price: 1.50 },
    { name: 'Αυγά 6άδα', price: 3.50 },
    { name: 'Τυρί φέτα 400γρ', price: 5.00 },
    { name: 'Νερό 6άδα', price: 2.50 },
    { name: 'Coca Cola 1.5L', price: 2.20 },
    { name: 'Chips Lays', price: 2.00 },
    { name: 'Σοκολάτα γάλακτος', price: 1.50 },
    { name: 'Καφές φίλτρου 250γρ', price: 4.50 },
    { name: 'Ζάχαρη 1kg', price: 1.80 }
  ],
  'Φαρμακείο': [
    { name: 'Depon 500mg', price: 3.50 },
    { name: 'Βιταμίνη C 1000mg', price: 8.00 },
    { name: 'Μάσκες μιας χρήσης 50τεμ', price: 5.00 },
    { name: 'Αντισηπτικό χεριών', price: 4.00 },
    { name: 'Παυσίπονο', price: 4.50 },
    { name: 'Σιρόπι για βήχα', price: 7.00 },
    { name: 'Αντιισταμινικό', price: 6.00 },
    { name: 'Κρέμα ενυδάτωσης', price: 12.00 },
    { name: 'Οδοντόκρεμα', price: 3.50 },
    { name: 'Αντηλιακό SPF50', price: 15.00 }
  ],
  'Ταβέρνα': [
    { name: 'Σουβλάκι χοιρινό', price: 3.00 },
    { name: 'Γύρος πίτα', price: 3.50 },
    { name: 'Μερίδα πατάτες', price: 3.00 },
    { name: 'Σαλάτα χωριάτικη', price: 6.00 },
    { name: 'Μουσακάς', price: 9.00 },
    { name: 'Παστίτσιο', price: 8.50 },
    { name: 'Μπριζόλα χοιρινή', price: 12.00 },
    { name: 'Κοτόπουλο σχάρας', price: 10.00 },
    { name: 'Τζατζίκι', price: 3.50 },
    { name: 'Αναψυκτικό', price: 2.00 }
  ],
  'Γλυκά': [
    { name: 'Γαλακτομπούρεκο', price: 4.00 },
    { name: 'Μπακλαβάς', price: 4.50 },
    { name: 'Κανταΐφι', price: 4.50 },
    { name: 'Προφιτερόλ', price: 5.00 },
    { name: 'Τούρτα σοκολάτα (κομμάτι)', price: 5.50 },
    { name: 'Παγωτό 2 μπάλες', price: 3.50 },
    { name: 'Κρέπα σοκολάτα', price: 4.00 },
    { name: 'Λουκουμάδες', price: 5.00 },
    { name: 'Cheesecake', price: 5.50 },
    { name: 'Σοκολατόπιτα', price: 5.00 }
  ],
  'Άλλο': [
    { name: 'Προϊόν 1', price: 5.00 },
    { name: 'Προϊόν 2', price: 8.00 },
    { name: 'Προϊόν 3', price: 10.00 }
  ]
};

// Helper: Τυχαία επιλογή από array
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Helper: Τυχαίος αριθμός μεταξύ min και max
const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper: Δημιουργία orderNumber για συγκεκριμένη ημερομηνία
const generateOrderNumber = (date, orderIndex) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  return `ORD-${dateStr}-${String(orderIndex).padStart(4, '0')}`;
};

// Helper: Δημιουργία τυχαίας παραγγελίας
const generateOrderContent = (storeType) => {
  const products = productsByStoreType[storeType] || productsByStoreType['Άλλο'];
  const numItems = randomBetween(1, 4);
  const selectedProducts = [];
  let totalPrice = 0;

  for (let i = 0; i < numItems; i++) {
    const product = randomChoice(products);
    const quantity = randomBetween(1, 3);
    selectedProducts.push(`${product.name}${quantity > 1 ? ' x' + quantity : ''}`);
    totalPrice += product.price * quantity;
  }

  return {
    content: selectedProducts.join(', '),
    productPrice: Math.round(totalPrice * 100) / 100
  };
};

// Helper: Δημιουργία τυχαίας ημερομηνίας μέσα στην ημέρα (8:00 - 22:00)
const getRandomTimeInDay = (date) => {
  const hour = randomBetween(8, 21);
  const minute = randomBetween(0, 59);
  const result = new Date(date);
  result.setHours(hour, minute, 0, 0);
  return result;
};

const seedHistoricalOrders = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Σύνδεση με MongoDB');

    // Φόρτωση υπαρχόντων δεδομένων
    const customers = await Customer.find({ isActive: true });
    const stores = await Store.find({ isApproved: true });
    const drivers = await Driver.find({ isApproved: true });

    if (customers.length === 0 || stores.length === 0 || drivers.length === 0) {
      console.log('❌ Δεν βρέθηκαν αρκετά δεδομένα. Τρέξε πρώτα το seedTestData.js');
      process.exit(1);
    }

    console.log(`📊 Βρέθηκαν: ${customers.length} πελάτες, ${stores.length} καταστήματα, ${drivers.length} οδηγοί`);

    // Υπολογισμός ημερομηνιών για τους τελευταίους 3 μήνες (εξαιρώντας την τελευταία εβδομάδα)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Αρχή της σημερινής ημέρας
    
    // Τελειώνουμε 7 μέρες πριν για να αποφύγουμε conflicts με πραγματικές παραγγελίες
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() - 7);
    
    const threeMonthsAgo = new Date(today);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const ordersToCreate = [];
    let orderCount = 0;

    // Οργάνωση παραγγελιών ανά ημέρα για σωστό orderNumber
    const ordersByDay = {};

    // Για κάθε ημέρα των τελευταίων 3 μηνών (μέχρι 7 μέρες πριν)
    for (let d = new Date(threeMonthsAgo); d < endDate; d.setDate(d.getDate() + 1)) {
      const dayKey = d.toISOString().split('T')[0];
      ordersByDay[dayKey] = [];
      
      // Για κάθε πελάτη
      for (const customer of customers) {
        // 70% πιθανότητα να παραγγείλει κάθε μέρα
        if (Math.random() > 0.3) {
          const numOrders = randomBetween(1, 3);
          
          for (let i = 0; i < numOrders; i++) {
            const store = randomChoice(stores);
            const driver = randomChoice(drivers);
            const orderTime = getRandomTimeInDay(new Date(d));
            
            // Χρόνος παράδοσης: 20-60 λεπτά μετά την παραγγελία
            const deliveryTime = new Date(orderTime);
            deliveryTime.setMinutes(deliveryTime.getMinutes() + randomBetween(20, 60));

            const { content, productPrice } = generateOrderContent(store.storeType);
            
            // Τυχαία χρέωση delivery (1.50 - 4.00)
            const deliveryFee = Math.round((randomBetween(15, 40) / 10) * 100) / 100;
            const totalPrice = Math.round((productPrice + deliveryFee) * 100) / 100;

            ordersByDay[dayKey].push({
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
              status: 'completed',
              productPrice: productPrice,
              deliveryFee: deliveryFee,
              totalPrice: totalPrice,
              driverId: driver._id,
              driverName: driver.name,
              createdAt: orderTime,
              completedAt: deliveryTime
            });
          }
        }
      }
    }

    // Ταξινόμηση κάθε ημέρας κατά ώρα και προσθήκη orderNumber
    for (const dayKey of Object.keys(ordersByDay)) {
      const dayOrders = ordersByDay[dayKey];
      // Ταξινόμηση κατά ώρα δημιουργίας
      dayOrders.sort((a, b) => a.createdAt - b.createdAt);
      
      // Βρες πόσες παραγγελίες υπάρχουν ήδη για αυτή την ημέρα
      // dayKey format: 2025-08-28 -> dateStr: 20250828
      const dateStr = dayKey.replace(/-/g, '');
      const existingCount = await Order.countDocuments({
        orderNumber: new RegExp(`^ORD-${dateStr}-`)
      });
      
      // Προσθήκη orderNumber ξεκινώντας μετά τα υπάρχοντα
      dayOrders.forEach((order, index) => {
        order.orderNumber = generateOrderNumber(order.createdAt, existingCount + index + 1);
        ordersToCreate.push(order);
        orderCount++;
      });
    }

    console.log(`\n📦 Δημιουργία ${orderCount} ιστορικών παραγγελιών...`);

    // Εισαγωγή σε batches για καλύτερη απόδοση
    const batchSize = 500;
    for (let i = 0; i < ordersToCreate.length; i += batchSize) {
      const batch = ordersToCreate.slice(i, i + batchSize);
      await Order.insertMany(batch);
      console.log(`  ✅ Εισήχθησαν ${Math.min(i + batchSize, ordersToCreate.length)}/${ordersToCreate.length} παραγγελίες`);
    }

    // Στατιστικά
    const totalOrders = await Order.countDocuments({ status: 'completed' });
    const totalRevenue = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);

    console.log('\n📊 Στατιστικά:');
    console.log('─────────────────────────');
    console.log(`📦 Συνολικές ολοκληρωμένες παραγγελίες: ${totalOrders}`);
    console.log(`💰 Συνολικά έσοδα: €${totalRevenue[0]?.total?.toFixed(2) || 0}`);
    console.log(`📅 Περίοδος: ${threeMonthsAgo.toLocaleDateString('el-GR')} - ${today.toLocaleDateString('el-GR')}`);
    console.log('─────────────────────────');

    // Παραγγελίες ανά μήνα
    const ordersByMonth = await Order.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$totalPrice' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    console.log('\n📈 Παραγγελίες ανά μήνα:');
    ordersByMonth.forEach(m => {
      const monthName = new Date(m._id.year, m._id.month - 1).toLocaleDateString('el-GR', { month: 'long', year: 'numeric' });
      console.log(`  ${monthName}: ${m.count} παραγγελίες, €${m.revenue.toFixed(2)}`);
    });

    console.log('\n✅ Ιστορικά δεδομένα δημιουργήθηκαν επιτυχώς!');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Σφάλμα:', error);
    process.exit(1);
  }
};

seedHistoricalOrders();
