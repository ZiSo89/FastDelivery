require('dotenv').config();
const mongoose = require('mongoose');
const Customer = require('../src/models/Customer');
const Store = require('../src/models/Store');
const Driver = require('../src/models/Driver');
const Order = require('../src/models/Order');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fast-delivery';

async function createTestOrders() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find specific customer and store
    const customer = await Customer.findOne({ email: 'zisoglou@hotmail.gr' });
    const store = await Store.findOne({ email: 'zisoglou@gmail.com' });
    
    if (!customer) {
      console.log('❌ Customer zisoglou@hotmail.gr not found');
      process.exit(1);
    }
    
    if (!store) {
      console.log('❌ Store zisoglou@gmail.com not found');
      process.exit(1);
    }
    
    console.log(`📧 Customer: ${customer.fullName} (${customer._id})`);
    console.log(`🏪 Store: ${store.storeName} (${store._id})`);

    // Find a random driver
    const driver = await Driver.findOne({ isApproved: true, isAvailable: true });
    
    const statuses = ['delivered', 'cancelled', 'delivered', 'delivered', 'delivered'];
    const products = [
      'Πληρωμή ΔΕΗ', 'Πληρωμή ΕΥΔΑΠ', 'Πληρωμή Cosmote', 'Πληρωμή VODAFONE',
      'Πληρωμή Wind', 'Πληρωμή ΕΦΚΑ', 'Πληρωμή Δήμου', 'Πληρωμή Ενοικίου'
    ];

    const ordersToCreate = [];
    const numOrders = 50; // 50 orders for this customer/store

    for (let i = 0; i < numOrders; i++) {
      const daysAgo = Math.floor(Math.random() * 90); // Random day in last 90 days
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - daysAgo);
      
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const product = products[Math.floor(Math.random() * products.length)];
      const deliveryCost = (Math.random() * 3 + 2).toFixed(2);

      const order = {
        store: store._id,
        customer: customer._id,
        driver: driver ? driver._id : null,
        customerName: customer.fullName,
        customerPhone: customer.phone || '6900000000',
        customerEmail: customer.email,
        deliveryAddress: customer.address || 'Λ. Δημοκρατίας 100, Αλεξανδρούπολη',
        deliveryLocation: customer.location || {
          type: 'Point',
          coordinates: [25.874722, 40.847778]
        },
        products: product,
        status: status,
        deliveryCost: parseFloat(deliveryCost),
        storeName: store.storeName,
        storePhone: store.phone,
        storeAddress: store.address,
        pickupLocation: store.location,
        createdAt: orderDate,
        updatedAt: orderDate
      };

      // Add completion dates for delivered/cancelled orders
      if (status === 'delivered') {
        const deliveryTime = new Date(orderDate);
        deliveryTime.setMinutes(deliveryTime.getMinutes() + Math.floor(Math.random() * 45) + 15);
        order.pickedUpAt = new Date(orderDate.getTime() + 10 * 60000);
        order.deliveredAt = deliveryTime;
      } else if (status === 'cancelled') {
        order.cancelledAt = new Date(orderDate.getTime() + 5 * 60000);
        order.cancelReason = 'Ακύρωση από πελάτη';
      }

      ordersToCreate.push(order);
    }

    // Insert all orders
    const result = await Order.insertMany(ordersToCreate);
    console.log(`\n✅ Created ${result.length} orders for customer ${customer.fullName}`);
    console.log(`   Store: ${store.storeName}`);

    // Show summary
    const deliveredCount = ordersToCreate.filter(o => o.status === 'delivered').length;
    const cancelledCount = ordersToCreate.filter(o => o.status === 'cancelled').length;
    console.log(`\n📊 Summary:`);
    console.log(`   - Delivered: ${deliveredCount}`);
    console.log(`   - Cancelled: ${cancelledCount}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTestOrders();
