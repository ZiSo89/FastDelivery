/**
 * Add Orders for Testing Pagination
 * 
 * Προσθέτει πολλές παραγγελίες για:
 * - Πελάτη: zisoglou@hotmail.gr
 * - Κατάστημα: 🏪 Πληρωμή Λογαριασμών (zisoglou@gmail.com)
 * 
 * Run: node tests/addOrdersForTest.js
 */

const path = require('path');
const fs = require('fs');

// Manual .env parsing to avoid conflicts
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const mongoMatch = envContent.match(/MONGODB_URI=(.+)/);
const MONGODB_URI = mongoMatch ? mongoMatch[1].trim() : null;

const mongoose = require('mongoose');

const Order = require('../src/models/Order');
const Customer = require('../src/models/Customer');
const Store = require('../src/models/Store');
const Driver = require('../src/models/Driver');

const ORDERS_TO_CREATE = 50;

// Generate unique order number based on date
function generateOrderNumber(date, sequence) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  const seqStr = String(sequence).padStart(4, '0');
  return `ORD-${dateStr}-${seqStr}`;
}

// Sample order contents
const orderContents = [
  'Καφές φραπέ μέτριος με γάλα',
  'Σουβλάκι χοιρινό με πίτα, τζατζίκι',
  'Πίτσα Μαργαρίτα μεγάλη',
  'Κρέπα σοκολάτα με μπανάνα',
  'Σαλάτα του Σεφ με κοτόπουλο',
  'Πληρωμή λογαριασμού ΔΕΗ',
  'Πληρωμή λογαριασμού COSMOTE',
  'Φάρμακα από φαρμακείο',
  'Μπύρες και σνακ',
  'Πακέτο από courier',
];

async function main() {
  try {
    const mongoUri = MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in .env file');
    }
    
    console.log('🔌 Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB Atlas\n');

    // Find customer
    const customer = await Customer.findOne({ email: 'zisoglou@hotmail.gr' });
    if (!customer) {
      throw new Error('Customer zisoglou@hotmail.gr not found!');
    }
    console.log(`📧 Found customer: ${customer.fullName || 'N/A'} (${customer.email})`);
    console.log(`   Phone: ${customer.phone || 'N/A'}`);
    console.log(`   Address: ${customer.address || 'N/A'}`);

    // Find store
    const store = await Store.findOne({ email: 'zisoglou@gmail.com' });
    if (!store) {
      throw new Error('Store zisoglou@gmail.com not found!');
    }
    console.log(`🏪 Found store: ${store.storeName || 'N/A'} (${store.email})`);

    // Find drivers
    const drivers = await Driver.find({ isEmailVerified: true, isApproved: true });
    console.log(`🚗 Found ${drivers.length} available drivers`);

    // Sample addresses
    const addresses = [
      'Λεωφ. Δημοκρατίας 45, Αλεξανδρούπολη',
      'Κύπρου 23, Αλεξανδρούπολη',
      'Μ. Αλεξάνδρου 12, Αλεξανδρούπολη',
      'Εθνικής Αντίστασης 56, Αλεξανδρούπολη',
      'Βενιζέλου 78, Αλεξανδρούπολη',
    ];

    const statuses = ['completed', 'completed', 'completed', 'cancelled'];
    
    console.log(`\n📦 Creating ${ORDERS_TO_CREATE} orders...\n`);

    // Get last order number to continue sequence
    const lastOrder = await Order.findOne().sort({ orderNumber: -1 }).select('orderNumber');
    let lastSeq = 0;
    if (lastOrder && lastOrder.orderNumber) {
      const match = lastOrder.orderNumber.match(/ORD-\d{8}-(\d{4})/);
      if (match) lastSeq = parseInt(match[1]);
    }
    console.log(`   Starting from sequence: ${lastSeq + 1}`);

    let createdCount = 0;
    
    for (let i = 0; i < ORDERS_TO_CREATE; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const hoursAgo = Math.floor(Math.random() * 24);
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - daysAgo);
      orderDate.setHours(orderDate.getHours() - hoursAgo);

      const address = addresses[Math.floor(Math.random() * addresses.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const driver = drivers.length > 0 ? drivers[Math.floor(Math.random() * drivers.length)] : null;
      const content = orderContents[Math.floor(Math.random() * orderContents.length)];
      
      const productPrice = Math.floor(Math.random() * 30) + 5;
      const deliveryFee = Math.floor(Math.random() * 3) + 2;

      // Generate unique order number
      const orderNumber = generateOrderNumber(orderDate, lastSeq + i + 1);

      const orderData = {
        orderNumber: orderNumber,
        customer: {
          name: customer.fullName || 'Πελάτης Test',
          phone: customer.phone || '6900000000',
          email: customer.email,
          address: customer.address || address
        },
        deliveryLocation: {
          type: 'Point',
          coordinates: [25.876 + Math.random() * 0.01, 40.845 + Math.random() * 0.01]
        },
        orderType: 'text',
        orderContent: content,
        storeId: store._id,
        storeName: store.storeName || 'Test Store',
        productPrice: productPrice,
        deliveryFee: deliveryFee,
        totalPrice: productPrice + deliveryFee,
        driverId: driver ? driver._id : null,
        driverName: driver ? driver.fullName : null,
        status: status,
        statusHistory: [
          { status: 'pending_store', updatedBy: 'system', timestamp: orderDate }
        ],
        createdAt: orderDate,
        updatedAt: orderDate,
      };

      // Add status history based on status
      if (status === 'completed') {
        orderData.statusHistory.push(
          { status: 'confirmed', updatedBy: 'store', timestamp: new Date(orderDate.getTime() + 5*60000) },
          { status: 'assigned', updatedBy: 'admin', timestamp: new Date(orderDate.getTime() + 10*60000) },
          { status: 'in_delivery', updatedBy: 'driver', timestamp: new Date(orderDate.getTime() + 20*60000) },
          { status: 'completed', updatedBy: 'driver', timestamp: new Date(orderDate.getTime() + 40*60000) }
        );
        orderData.confirmedAt = new Date(orderDate.getTime() + 5*60000);
        orderData.completedAt = new Date(orderDate.getTime() + 40*60000);
      } else if (status === 'cancelled') {
        orderData.statusHistory.push(
          { status: 'cancelled', updatedBy: 'customer', timestamp: new Date(orderDate.getTime() + 10*60000) }
        );
      }

      try {
        const order = new Order(orderData);
        await order.save();
        createdCount++;
        process.stdout.write(`  Created ${createdCount}/${ORDERS_TO_CREATE} orders\r`);
      } catch (err) {
        console.log(`\n   ⚠️ Order ${i+1} failed: ${err.message}`);
      }
    }

    console.log(`\n\n✅ Created ${createdCount} orders successfully!`);

    // Show statistics
    const totalCustomerOrders = await Order.countDocuments({ 'customer.email': customer.email });
    const totalStoreOrders = await Order.countDocuments({ storeId: store._id });
    
    console.log(`\n📊 Statistics:`);
    console.log(`   Orders for customer ${customer.email}: ${totalCustomerOrders}`);
    console.log(`   Orders for store ${store.storeName}: ${totalStoreOrders}`);

    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    console.log('\n✅ Done! Now test pagination in the app.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.errors) {
      Object.keys(error.errors).forEach(key => {
        console.error(`   - ${key}: ${error.errors[key].message}`);
      });
    }
    process.exit(1);
  }
}

main();
